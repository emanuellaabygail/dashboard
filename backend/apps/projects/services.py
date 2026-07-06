from __future__ import annotations

from django.contrib.auth.models import User
from django.db.models import QuerySet

from apps.projects.models import Project
from apps.projects.repositories import ProjectNotFoundError, ProjectRepository

__all__ = ["ProjectNotFoundError", "ProjectService"]


class ProjectService:
    def __init__(self, repository: ProjectRepository | None = None) -> None:
        self.repository = repository or ProjectRepository()

    def list_projects(self, *, search: str = "", status: str = "") -> QuerySet[Project]:
        return self.repository.list(search=search, status=status)

    def get_project(self, project_id: int) -> Project:
        return self.repository.get(project_id)

    def create_project(self, *, created_by: User, **fields: object) -> Project:
        return self.repository.create(created_by=created_by, **fields)

    def update_project(self, project_id: int, **fields: object) -> Project:
        project = self.get_project(project_id)
        return self.repository.update(project, **fields)

    def delete_project(self, project_id: int) -> None:
        project = self.get_project(project_id)
        self.repository.delete(project)
