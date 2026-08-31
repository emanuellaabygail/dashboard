from __future__ import annotations

import datetime

from apps.analytics.repositories import AnalyticsRepository


class AnalyticsService:
    def __init__(self, repository: AnalyticsRepository | None = None) -> None:
        self.repository = repository or AnalyticsRepository()

    def get_disciplines(self, project_id: int) -> list[str]:
        return self.repository.disciplines(project_id)

    def get_progress_trend(
        self,
        *,
        project_id: int,
        sheet_name: str = "",
        date_from: datetime.date | None = None,
        date_to: datetime.date | None = None,
    ) -> list[dict[str, object]]:
        return self.repository.progress_trend(
            project_id=project_id, sheet_name=sheet_name, date_from=date_from, date_to=date_to
        )

    def export_rows(
        self,
        *,
        project_id: int,
        sheet_name: str = "",
        date_from: datetime.date | None = None,
        date_to: datetime.date | None = None,
    ):
        return self.repository.rows_for_export(
            project_id=project_id, sheet_name=sheet_name, date_from=date_from, date_to=date_to
        )
