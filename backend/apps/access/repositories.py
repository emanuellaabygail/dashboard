from __future__ import annotations

from django.db.models import QuerySet

from apps.access.models import ProjectAccess


class ProjectAccessNotFoundError(Exception):
    pass


class AccessRepository:
    def list(self, *, project: str = "", status: str = "") -> QuerySet[ProjectAccess]:
        queryset = ProjectAccess.objects.select_related("project", "user", "decided_by")
        if project:
            queryset = queryset.filter(project_id=project)
        if status:
            queryset = queryset.filter(status=status)
        return queryset

    def get(self, record_id: int) -> ProjectAccess:
        try:
            return ProjectAccess.objects.select_related("project", "user", "decided_by").get(pk=record_id)
        except ProjectAccess.DoesNotExist as exc:
            raise ProjectAccessNotFoundError(f"Access record {record_id} was not found.") from exc
