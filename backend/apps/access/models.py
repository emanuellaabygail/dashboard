from __future__ import annotations

from django.contrib.auth.models import User
from django.db import models

from apps.projects.models import Project


class Profile(models.Model):
    """Extends Django's built-in User with an app role. A superuser (created via
    createsuperuser) is always treated as SUPERADMIN regardless of this row — see
    apps.access.permissions.get_role — so bootstrapping the very first admin needs no
    extra setup beyond the normal Django createsuperuser flow."""

    class Role(models.TextChoices):
        SUPERADMIN = "superadmin", "Super Admin"
        PROJECT_ADMIN = "project_admin", "Project Admin"
        USER = "user", "User"

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="access_profile")
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.USER)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"{self.user.username} ({self.role})"


class ProjectAccess(models.Model):
    """A user's access state for one project — doubles as both an access grant and an
    access request, distinguished by status. A direct grant (by an admin) and an
    approved request end up in the exact same state (status=APPROVED)."""

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        DENIED = "denied", "Denied"

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="access_records")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="project_access_records")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    requested_at = models.DateTimeField(auto_now_add=True)
    decided_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="decided_access_records"
    )
    decided_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-requested_at"]
        constraints = [
            models.UniqueConstraint(fields=["project", "user"], name="unique_project_access_per_user")
        ]

    def __str__(self) -> str:
        return f"{self.user.username} -> {self.project.code} ({self.status})"
