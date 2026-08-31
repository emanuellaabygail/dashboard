from __future__ import annotations

from apps.dashboard.repositories import DashboardRepository
from apps.projects.repositories import ProjectNotFoundError, ProjectRepository


class ProjectSummaryError(Exception):
    pass


class DashboardService:
    def __init__(self, repository: DashboardRepository | None = None) -> None:
        self.repository = repository or DashboardRepository()

    def get_summary(self) -> dict[str, object]:
        repository = self.repository
        progress = repository.overall_progress()

        recent_reports = [
            {
                "id": report.id,
                "project_name": report.project.name,
                "template_name": report.template.name if report.template else None,
                "status": report.status,
                "row_count": report.row_count,
                "uploaded_at": report.uploaded_at.isoformat(),
                "uploaded_by_username": report.uploaded_by.username,
            }
            for report in repository.recent_reports()
        ]

        projects = [
            {
                "id": project.id,
                "name": project.name,
                "code": project.code,
                "status": project.status,
                "created_at": project.created_at.isoformat(),
            }
            for project in repository.all_projects()
        ]

        return {
            "projects": repository.project_counts(),
            "reports": repository.report_counts(),
            "templates": repository.template_counts(),
            "total_rows_parsed": repository.total_rows_parsed(),
            "delayed_projects": repository.delayed_projects_count(),
            "overall_progress": progress,
            "recent_reports": recent_reports,
            "project_list": projects,
        }

    def get_project_summary(self, project_id: int) -> dict[str, object]:
        try:
            project = ProjectRepository().get(project_id)
        except ProjectNotFoundError as exc:
            raise ProjectSummaryError(f"Project {project_id} was not found.") from exc

        summary = self.repository.project_summary(project_id)
        summary["procurement_breakdown"] = self.repository.procurement_breakdown(project_id)
        summary["project"] = {
            "id": project.id,
            "name": project.name,
            "code": project.code,
            "status": project.status,
            "start_date": project.start_date.isoformat() if project.start_date else None,
            "end_date": project.end_date.isoformat() if project.end_date else None,
            "contract_value": str(project.contract_value) if project.contract_value is not None else None,
        }
        return summary
