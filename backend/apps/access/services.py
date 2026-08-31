from __future__ import annotations

from django.contrib.auth.models import User
from django.db.models import QuerySet
from django.utils import timezone

from apps.access.models import ProjectAccess
from apps.access.repositories import AccessRepository, ProjectAccessNotFoundError
from apps.projects.repositories import ProjectNotFoundError, ProjectRepository

__all__ = ["AccessService", "AccessError", "ProjectAccessNotFoundError"]


class AccessError(Exception):
    pass


class AccessService:
    def __init__(self, repository: AccessRepository | None = None) -> None:
        self.repository = repository or AccessRepository()

    def list_records(self, *, project: str = "", status: str = "") -> QuerySet[ProjectAccess]:
        return self.repository.list(project=project, status=status)

    def request_access(self, *, project_id: int, user: User) -> ProjectAccess:
        try:
            project = ProjectRepository().get(project_id)
        except ProjectNotFoundError as exc:
            raise AccessError(str(exc)) from exc

        record, created = ProjectAccess.objects.get_or_create(project=project, user=user)
        if not created and record.status != ProjectAccess.Status.APPROVED:
            record.status = ProjectAccess.Status.PENDING
            record.decided_by = None
            record.decided_at = None
            record.requested_at = timezone.now()
            record.save(update_fields=["status", "decided_by", "decided_at", "requested_at"])
        return record

    def grant(self, *, project_id: int, user_id: int, granted_by: User) -> ProjectAccess:
        try:
            ProjectRepository().get(project_id)
        except ProjectNotFoundError as exc:
            raise AccessError(str(exc)) from exc

        record, _ = ProjectAccess.objects.update_or_create(
            project_id=project_id,
            user_id=user_id,
            defaults={
                "status": ProjectAccess.Status.APPROVED,
                "decided_by": granted_by,
                "decided_at": timezone.now(),
            },
        )
        return record

    def decide(self, record_id: int, *, approve: bool, decided_by: User) -> ProjectAccess:
        record = self.repository.get(record_id)
        record.status = ProjectAccess.Status.APPROVED if approve else ProjectAccess.Status.DENIED
        record.decided_by = decided_by
        record.decided_at = timezone.now()
        record.save(update_fields=["status", "decided_by", "decided_at"])
        return record

    def revoke(self, record_id: int) -> None:
        record = self.repository.get(record_id)
        record.delete()
