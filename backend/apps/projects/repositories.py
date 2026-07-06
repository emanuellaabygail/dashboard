from __future__ import annotations

from django.db.models import Q, QuerySet

from apps.projects.models import Project


class ProjectNotFoundError(Exception):
    pass


class ProjectRepository:
    def list(self, *, search: str = "", status: str = "") -> QuerySet[Project]:
        queryset = Project.objects.select_related("created_by")

        if search:
            queryset = queryset.filter(Q(name__icontains=search) | Q(code__icontains=search))

        if status:
            queryset = queryset.filter(status=status)

        return queryset

    def get(self, project_id: int) -> Project:
        try:
            return Project.objects.select_related("created_by").get(pk=project_id)
        except Project.DoesNotExist as exc:
            raise ProjectNotFoundError(f"Project {project_id} was not found.") from exc

    def create(self, **fields: object) -> Project:
        return Project.objects.create(**fields)

    def update(self, project: Project, **fields: object) -> Project:
        for field, value in fields.items():
            setattr(project, field, value)
        project.save()
        return project

    def delete(self, project: Project) -> None:
        project.delete()
