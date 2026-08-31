from __future__ import annotations

from django.contrib.auth.models import User
from django.db.models import QuerySet

from apps.reports.excel_parser import ExcelParseError, parse_report_file
from apps.reports.models import Report
from apps.reports.progress import resolve_row_label
from apps.reports.repositories import ReportNotFoundError, ReportRepository
from apps.templates.models import Template

__all__ = ["ReportNotFoundError", "ReportParseError", "ReportService"]


class ReportParseError(Exception):
    pass


class ReportService:
    def __init__(self, repository: ReportRepository | None = None) -> None:
        self.repository = repository or ReportRepository()

    def list_reports(self, *, project: str = "", status: str = "") -> QuerySet[Report]:
        return self.repository.list(project=project, status=status)

    def get_report(self, report_id: int) -> Report:
        return self.repository.get(report_id)

    def create_report(self, *, uploaded_by: User, **fields: object) -> Report:
        return self.repository.create(uploaded_by=uploaded_by, **fields)

    def delete_report(self, report_id: int) -> None:
        report = self.get_report(report_id)
        self.repository.delete(report)

    def parse_report(self, report_id: int, template_id: int | None = None) -> Report:
        report = self.get_report(report_id)

        if template_id is not None:
            try:
                template = Template.objects.prefetch_related("sheets").get(pk=template_id)
            except Template.DoesNotExist as exc:
                raise ReportParseError("The selected template does not exist.") from exc
            if template.project_id != report.project_id:
                raise ReportParseError("The template must belong to the same project as the report.")
            report.template = template
        elif report.template_id is not None:
            template = report.template
        else:
            raise ReportParseError("A template is required to parse this report.")

        try:
            with report.file.open("rb") as file_obj:
                parsed_rows = parse_report_file(file_obj, template)
        except ExcelParseError as exc:
            return self.repository.mark_failed(report, str(exc))

        if not parsed_rows:
            return self.repository.mark_failed(report, "No data rows were found using this template's column mappings.")

        self.repository.save_parsed_rows(report, parsed_rows)
        report.row_count = len(parsed_rows)
        return self.repository.mark_parsed(report)

    def get_sheet_names(self, report_id: int) -> list[str]:
        report = self.get_report(report_id)
        return list(
            self.repository.rows(report).order_by("sheet_name").values_list("sheet_name", flat=True).distinct()
        )

    def get_work_items(self, report_id: int, *, sheet_name: str = "") -> list[dict[str, object]]:
        report = self.get_report(report_id)
        if report.template_id is None:
            return []

        sheet_configs = {sheet.sheet_name: sheet for sheet in report.template.sheets.all()}
        rows = self.repository.rows(report, sheet_name=sheet_name)

        items: list[dict[str, object]] = []
        for row in rows:
            sheet_config = sheet_configs.get(row.sheet_name)
            if sheet_config is None or not sheet_config.label_field_keys:
                continue

            # The sheet's own pre-computed "TOTAL <section>" row(s) — not a work item or a
            # section header, only used to source dashboard sheet-level totals directly.
            if row.is_total_row:
                continue

            # Rows shallower than the sheet's key_depth are ancestor/section-header rows kept
            # only to show the Excel grouping structure as a tree; they carry no progress data.
            is_group = sheet_config.key_column_indexes and row.group_depth is not None and row.group_depth != sheet_config.key_depth

            # A sheet with its own numbering depth filter already keeps exactly one,
            # non-overlapping grouping level at parse time — every stored item row is a
            # genuine item there, even though it "rolls up" the deeper rows we chose
            # not to keep. Only fall back to outline-based leaf detection when there's
            # no such filter, to avoid showing a rollup row next to its own children.
            if not sheet_config.key_column_indexes and not row.is_leaf:
                continue

            label = resolve_row_label(row.data, sheet_config.label_field_keys)
            if label is None:
                continue

            if is_group:
                items.append(
                    {
                        "row_number": row.row_number,
                        "sheet_name": row.sheet_name,
                        "label": label,
                        "categories": {},
                        "is_group": True,
                        "group_number": row.group_number,
                        "depth": row.group_depth,
                    }
                )
                continue

            categories: dict[str, dict[str, object]] = {}
            for category in sheet_config.progress_categories:
                plan_key = category.get("item_plan_field_key") or category["plan_field_key"]
                actual_key = category.get("item_actual_field_key") or category["actual_field_key"]
                plan_value = row.data.get(plan_key)
                actual_value = row.data.get(actual_key)
                if plan_value is None and actual_value is None:
                    continue
                categories[category["label"]] = {"plan": plan_value, "actual": actual_value}

            if not categories:
                continue

            items.append(
                {
                    "row_number": row.row_number,
                    "sheet_name": row.sheet_name,
                    "label": label,
                    "categories": categories,
                    "is_group": False,
                    "group_number": row.group_number,
                    "depth": row.group_depth,
                }
            )

        return items
