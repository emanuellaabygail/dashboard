from __future__ import annotations

import datetime

from django.db.models import Count

from apps.projects.models import Project
from apps.reports.models import Report, ReportRow
from apps.reports.progress import aggregate_report_categories, resolve_overall, to_number
from apps.reports.services import ReportService
from apps.templates.models import Template


class DashboardRepository:
    def project_counts(self) -> dict[str, int | dict[str, int]]:
        total = Project.objects.count()
        by_status = dict(
            Project.objects.values_list("status").annotate(count=Count("id")).order_by()
        )
        return {"total": total, "by_status": by_status}

    def report_counts(self) -> dict[str, int | dict[str, int]]:
        total = Report.objects.count()
        by_status = dict(
            Report.objects.values_list("status").annotate(count=Count("id")).order_by()
        )
        return {"total": total, "by_status": by_status}

    def template_counts(self) -> dict[str, int]:
        return {
            "total": self._template_queryset().count(),
            "active": self._template_queryset(active_only=True).count(),
        }

    def _template_queryset(self, active_only: bool = False):
        queryset = Template.objects.all()
        if active_only:
            queryset = queryset.filter(is_active=True)
        return queryset

    def total_rows_parsed(self) -> int:
        return ReportRow.objects.count()

    def delayed_projects_count(self, *, today: datetime.date | None = None) -> int:
        today = today or datetime.date.today()
        return (
            Project.objects.filter(end_date__lt=today)
            .exclude(status__in=[Project.Status.COMPLETED, Project.Status.CANCELLED])
            .count()
        )

    def recent_reports(self, limit: int = 10) -> list[Report]:
        return list(
            Report.objects.select_related("project", "template", "uploaded_by")
            .annotate(row_count=Count("rows"))
            .order_by("-uploaded_at")[:limit]
        )

    def recent_projects(self, limit: int = 5) -> list[Project]:
        return list(Project.objects.order_by("-created_at")[:limit])

    def overall_progress(self) -> dict[str, float | None]:
        """Aggregate the "Overall" progress category across the latest parsed report per project."""
        latest_parsed_ids = (
            Report.objects.filter(status=Report.Status.PARSED)
            .order_by("project_id", "-uploaded_at")
            .distinct("project_id")
            .values_list("id", flat=True)
        )

        plan_total = 0.0
        actual_total = 0.0
        has_data = False

        for report in Report.objects.filter(id__in=list(latest_parsed_ids)):
            overall = resolve_overall(aggregate_report_categories(report))
            if overall is None:
                continue
            plan_total += overall["plan"]
            actual_total += overall["actual"]
            has_data = True

        if not has_data:
            return {"plan": None, "actual": None, "percent": None}

        percent = (actual_total / plan_total * 100) if plan_total else None
        return {"plan": plan_total, "actual": actual_total, "percent": percent}

    def all_projects(self) -> list[Project]:
        return list(Project.objects.order_by("-created_at"))

    def procurement_breakdown(self, project_id: int) -> list[dict[str, object]]:
        """Each sheet's own Procurement/Construction Plan vs Actual, read directly from its
        "TOTAL <section>" row(s) — Excel's own rollup already sums the full section (including
        rows our own depth filter doesn't keep), so it's trusted over re-deriving a total from
        our own parsed item sums."""
        latest_report = (
            Report.objects.filter(project_id=project_id, status=Report.Status.PARSED)
            .order_by("-uploaded_at")
            .first()
        )
        if latest_report is None or latest_report.template_id is None:
            return []

        item_counts: dict[str, int] = {}
        for item in ReportService().get_work_items(latest_report.id):
            if item["is_group"]:
                continue
            item_counts[item["sheet_name"]] = item_counts.get(item["sheet_name"], 0) + 1

        breakdown: list[dict[str, object]] = []
        for sheet in latest_report.template.sheets.all():
            if not sheet.total_row_labels:
                continue

            categories = {
                category["label"]: category
                for category in sheet.progress_categories
                if category["label"] in ("Procurement", "Construction") and not category.get("match_label")
            }
            if not categories:
                continue

            totals: dict[str, dict[str, float]] = {label: {"plan": 0.0, "actual": 0.0} for label in categories}
            total_rows = ReportRow.objects.filter(
                report=latest_report, sheet_name=sheet.sheet_name, is_total_row=True
            )
            for row in total_rows:
                for label, category in categories.items():
                    plan_value = to_number(row.data.get(category["plan_field_key"]))
                    actual_value = to_number(row.data.get(category["actual_field_key"]))
                    totals[label]["plan"] += plan_value or 0.0
                    totals[label]["actual"] += actual_value or 0.0

            breakdown.append(
                {
                    "label": sheet.sheet_name,
                    "item_count": item_counts.get(sheet.sheet_name, 0),
                    "categories": totals,
                }
            )

        return breakdown

    def project_summary(self, project_id: int) -> dict[str, object]:
        reports = (
            Report.objects.filter(project_id=project_id, status=Report.Status.PARSED)
            .order_by("uploaded_at")
        )

        s_curve: list[dict[str, object]] = []
        latest_categories: dict[str, dict[str, float]] = {}

        for report in reports:
            categories = aggregate_report_categories(report)
            overall = resolve_overall(categories)
            if overall is None:
                continue
            s_curve.append(
                {
                    "report_id": report.id,
                    "uploaded_at": report.uploaded_at.isoformat(),
                    "plan": overall["plan"],
                    "actual": overall["actual"],
                }
            )
            latest_categories = categories

        latest_overall = resolve_overall(latest_categories) if latest_categories else None

        overall_result = None
        if latest_overall is not None:
            plan = latest_overall["plan"]
            actual = latest_overall["actual"]
            overall_result = {
                "plan": plan,
                "actual": actual,
                "deviation": actual - plan,
                "spi": (actual / plan) if plan else None,
            }

        category_cards: list[dict[str, object]] = []
        non_overall = {
            label: totals
            for label, totals in latest_categories.items()
            if label.strip().lower() != "overall"
        }
        total_plan_for_wf = sum(totals["plan"] for totals in non_overall.values())
        for label, totals in non_overall.items():
            category_cards.append(
                {
                    "label": label,
                    "plan": totals["plan"],
                    "actual": totals["actual"],
                    "deviation": totals["actual"] - totals["plan"],
                    "weight_fraction": (totals["plan"] / total_plan_for_wf) if total_plan_for_wf else None,
                }
            )
        category_cards.sort(key=lambda card: card["plan"], reverse=True)

        return {
            "has_data": overall_result is not None,
            "overall": overall_result,
            "categories": category_cards,
            "s_curve": s_curve,
        }
