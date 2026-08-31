from __future__ import annotations

import datetime

from apps.reports.models import Report, ReportRow
from apps.reports.progress import aggregate_report_categories, resolve_overall
from apps.templates.models import TemplateSheet


class AnalyticsRepository:
    def disciplines(self, project_id: int) -> list[str]:
        sheet_names = (
            TemplateSheet.objects.filter(template__project_id=project_id)
            .order_by("order", "id")
            .values_list("sheet_name", flat=True)
            .distinct()
        )
        return list(dict.fromkeys(sheet_names))

    def _filtered_reports(
        self,
        *,
        project_id: int,
        date_from: datetime.date | None = None,
        date_to: datetime.date | None = None,
    ):
        queryset = Report.objects.filter(
            project_id=project_id, status=Report.Status.PARSED
        ).order_by("uploaded_at")
        if date_from:
            queryset = queryset.filter(uploaded_at__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(uploaded_at__date__lte=date_to)
        return queryset

    def progress_trend(
        self,
        *,
        project_id: int,
        sheet_name: str = "",
        date_from: datetime.date | None = None,
        date_to: datetime.date | None = None,
    ) -> list[dict[str, object]]:
        reports = self._filtered_reports(
            project_id=project_id, date_from=date_from, date_to=date_to
        )

        trend: list[dict[str, object]] = []
        for report in reports:
            categories = aggregate_report_categories(report, sheet_name=sheet_name)
            overall = resolve_overall(categories)
            if overall is None:
                continue

            plan_total = overall["plan"]
            actual_total = overall["actual"]
            trend.append(
                {
                    "report_id": report.id,
                    "uploaded_at": report.uploaded_at.isoformat(),
                    "plan": plan_total,
                    "actual": actual_total,
                    "percent": (actual_total / plan_total * 100) if plan_total else None,
                }
            )

        return trend

    def rows_for_export(
        self,
        *,
        project_id: int,
        sheet_name: str = "",
        date_from: datetime.date | None = None,
        date_to: datetime.date | None = None,
    ):
        reports = self._filtered_reports(
            project_id=project_id, date_from=date_from, date_to=date_to
        )
        queryset = ReportRow.objects.filter(report__in=reports).select_related("report").order_by(
            "report__uploaded_at", "sheet_name", "row_number"
        )
        if sheet_name:
            queryset = queryset.filter(sheet_name=sheet_name)
        return queryset
