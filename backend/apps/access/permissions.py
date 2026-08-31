from __future__ import annotations

from django.contrib.auth.models import AnonymousUser, User
from rest_framework import permissions

from apps.access.models import Profile, ProjectAccess


def get_role(user: User | AnonymousUser | None) -> str:
    if user is None or not user.is_authenticated:
        return Profile.Role.USER
    if user.is_superuser:
        return Profile.Role.SUPERADMIN
    profile = Profile.objects.filter(user=user).first()
    return profile.role if profile else Profile.Role.USER


def is_admin(user: User | AnonymousUser | None) -> bool:
    return get_role(user) in (Profile.Role.SUPERADMIN, Profile.Role.PROJECT_ADMIN)


def is_super_admin(user: User | AnonymousUser | None) -> bool:
    return get_role(user) == Profile.Role.SUPERADMIN


def has_project_access(user: User | AnonymousUser | None, project_id: object) -> bool:
    if not project_id:
        return False
    if is_admin(user):
        return True
    return ProjectAccess.objects.filter(
        project_id=project_id, user=user, status=ProjectAccess.Status.APPROVED
    ).exists()


def accessible_project_ids(user: User | AnonymousUser | None) -> list[int] | None:
    """None means "every project" (an admin); otherwise the explicit list of project ids
    this user has been approved for."""
    if is_admin(user):
        return None
    return list(
        ProjectAccess.objects.filter(user=user, status=ProjectAccess.Status.APPROVED).values_list(
            "project_id", flat=True
        )
    )


class IsAdminRole(permissions.BasePermission):
    """Read (list/retrieve) is open to any authenticated user; write requires
    superadmin or project_admin."""

    def has_permission(self, request, view) -> bool:
        if request.method in permissions.SAFE_METHODS:
            return True
        return is_admin(request.user)


class IsAdminOnly(permissions.BasePermission):
    """Every method requires superadmin or project_admin."""

    def has_permission(self, request, view) -> bool:
        return is_admin(request.user)


class IsSuperAdminOnly(permissions.BasePermission):
    """Every method requires superadmin."""

    def has_permission(self, request, view) -> bool:
        return is_super_admin(request.user)


class HasProjectAccess(permissions.BasePermission):
    """For read-only APIViews that always take a `project` query param. Views without a
    `project` param (i.e. those that 400 on their own) pass this permission and handle
    the missing param themselves."""

    def has_permission(self, request, view) -> bool:
        project_id = request.query_params.get("project")
        if not project_id:
            return True
        return has_project_access(request.user, project_id)


class ProjectScopedPermission(permissions.BasePermission):
    """For ViewSets whose model has a `project` FK. Reading requires access to that
    project (or admin); any write requires an admin role. Queryset-level filtering
    (see `accessible_project_ids`) still applies for list requests with no `project`
    filter — this only covers the request-level and per-object checks."""

    def has_permission(self, request, view) -> bool:
        if request.method not in permissions.SAFE_METHODS:
            return is_admin(request.user)
        project_id = request.query_params.get("project")
        if not project_id:
            return True
        return has_project_access(request.user, project_id)

    def has_object_permission(self, request, view, obj) -> bool:
        if request.method not in permissions.SAFE_METHODS:
            return is_admin(request.user)
        project_id = getattr(obj, "project_id", None)
        if project_id is None:
            return True
        return has_project_access(request.user, project_id)
