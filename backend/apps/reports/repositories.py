from __future__ import annotations

from django.db import transaction
from django.db.models import Count, QuerySet

from apps.reports.excel_parser import ParsedRow
from apps.reports.models import Report, ReportRow


class ReportNotFoundError(Exception):
    pass


class ReportRepository:
    def list(self, *, project: str = "", status: str = "") -> QuerySet[Report]:
        queryset = Report.objects.select_related("project", "template", "uploaded_by").annotate(
            row_count=Count("rows")
        )

        if project:
            queryset = queryset.filter(project_id=project)

        if status:
            queryset = queryset.filter(status=status)

        return queryset

    def get(self, report_id: int) -> Report:
        try:
            return (
                Report.objects.select_related("project", "template", "uploaded_by")
                .annotate(row_count=Count("rows"))
                .get(pk=report_id)
            )
        except Report.DoesNotExist as exc:
            raise ReportNotFoundError(f"Report {report_id} was not found.") from exc

    def create(self, **fields: object) -> Report:
        return Report.objects.create(**fields)

    def delete(self, report: Report) -> None:
        report.file.delete(save=False)
        report.delete()

    def save_parsed_rows(self, report: Report, rows: list[ParsedRow]) -> None:
        with transaction.atomic():
            report.rows.all().delete()
            ReportRow.objects.bulk_create(
                ReportRow(
                    report=report,
                    sheet_name=row["sheet_name"],
                    row_number=row["row_number"],
                    data=row["data"],
                    is_leaf=row["is_leaf"],
                    group_depth=row["group_depth"],
                    group_number=row["group_number"] or "",
                    is_total_row=row["is_total_row"],
                )
                for row in rows
            )

    def mark_parsed(self, report: Report) -> Report:
        report.status = Report.Status.PARSED
        report.error_message = ""
        report.save(update_fields=["template", "status", "error_message"])
        return report

    def mark_failed(self, report: Report, error_message: str) -> Report:
        report.status = Report.Status.FAILED
        report.error_message = error_message
        report.save(update_fields=["template", "status", "error_message"])
        return report

    def rows(self, report: Report, *, sheet_name: str = "", leaf_only: bool = False) -> QuerySet[ReportRow]:
        queryset = report.rows.all()
        if leaf_only:
            queryset = queryset.filter(is_leaf=True)
        if sheet_name:
            queryset = queryset.filter(sheet_name=sheet_name)
        return queryset
