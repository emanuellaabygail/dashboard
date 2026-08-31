from __future__ import annotations

from django.contrib.auth.models import User
from django.db.models import Q
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.request import Request
from rest_framework.response import Response

from apps.access.models import Profile
from apps.access.permissions import IsAdminOnly, IsSuperAdminOnly, is_admin
from apps.access.repositories import ProjectAccessNotFoundError
from apps.access.serializers import (
    GrantAccessSerializer,
    ProjectAccessSerializer,
    RequestAccessSerializer,
    UpdateUserRoleSerializer,
    UserRoleSerializer,
)
from apps.access.services import AccessError, AccessService


class UserRoleViewSet(viewsets.ReadOnlyModelViewSet):
    """User directory. Any admin can list/search users (needed to pick who to grant
    project access to); only a superadmin can change a user's role."""

    serializer_class = UserRoleSerializer
    permission_classes = [IsAdminOnly]

    def get_queryset(self):
        queryset = User.objects.all().order_by("username")
        search = self.request.query_params.get("search", "")
        if search:
            queryset = queryset.filter(Q(username__icontains=search) | Q(email__icontains=search))
        return queryset

    @action(detail=True, methods=["patch"], permission_classes=[IsSuperAdminOnly])
    def role(self, request: Request, pk: str | None = None) -> Response:
        user = self.get_object()
        serializer = UpdateUserRoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        profile, _ = Profile.objects.get_or_create(user=user)
        profile.role = serializer.validated_data["role"]
        profile.save(update_fields=["role"])

        return Response(UserRoleSerializer(user).data)


class ProjectAccessViewSet(viewsets.ModelViewSet):
    """Access records double as requests and grants. Non-admins only ever see (and can
    only create) their own records; admins see and manage everyone's."""

    serializer_class = ProjectAccessSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "delete", "head", "options"]

    def get_queryset(self):
        queryset = AccessService().list_records(
            project=self.request.query_params.get("project", ""),
            status=self.request.query_params.get("status", ""),
        )
        if not is_admin(self.request.user):
            queryset = queryset.filter(user=self.request.user)
        return queryset

    def create(self, request: Request) -> Response:
        serializer = RequestAccessSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            record = AccessService().request_access(
                project_id=serializer.validated_data["project"], user=request.user
            )
        except AccessError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(ProjectAccessSerializer(record).data, status=status.HTTP_201_CREATED)

    def perform_destroy(self, instance) -> None:
        if not is_admin(self.request.user):
            raise PermissionDenied("Only an admin can revoke access.")
        AccessService().revoke(instance.id)

    @action(detail=False, methods=["post"])
    def grant(self, request: Request) -> Response:
        if not is_admin(request.user):
            raise PermissionDenied("Only an admin can grant access.")

        serializer = GrantAccessSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            record = AccessService().grant(
                project_id=serializer.validated_data["project"],
                user_id=serializer.validated_data["user"],
                granted_by=request.user,
            )
        except AccessError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(ProjectAccessSerializer(record).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def approve(self, request: Request, pk: str | None = None) -> Response:
        return self._decide(request, pk, approve=True)

    @action(detail=True, methods=["post"])
    def deny(self, request: Request, pk: str | None = None) -> Response:
        return self._decide(request, pk, approve=False)

    def _decide(self, request: Request, pk: str | None, *, approve: bool) -> Response:
        if not is_admin(request.user):
            raise PermissionDenied("Only an admin can decide on access requests.")

        try:
            record = AccessService().decide(int(pk), approve=approve, decided_by=request.user)
        except ProjectAccessNotFoundError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)

        return Response(ProjectAccessSerializer(record).data)
