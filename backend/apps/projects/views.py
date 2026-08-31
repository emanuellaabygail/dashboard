from __future__ import annotations

from rest_framework import permissions, viewsets

from apps.access.permissions import IsAdminRole
from apps.projects.serializers import ProjectSerializer
from apps.projects.services import ProjectService


class ProjectViewSet(viewsets.ModelViewSet):
    """List/retrieve is open to every authenticated user (per RBAC design, everyone can
    see the project directory); create/update/delete requires an admin role."""

    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]
    filterset_fields = ["status"]

    def get_queryset(self):
        return ProjectService().list_projects(
            search=self.request.query_params.get("search", ""),
            status=self.request.query_params.get("status", ""),
        )

    def perform_create(self, serializer: ProjectSerializer) -> None:
        project = ProjectService().create_project(
            created_by=self.request.user,
            **serializer.validated_data,
        )
        serializer.instance = project

    def perform_update(self, serializer: ProjectSerializer) -> None:
        project = ProjectService().update_project(
            serializer.instance.id,
            **serializer.validated_data,
        )
        serializer.instance = project

    def perform_destroy(self, instance) -> None:
        ProjectService().delete_project(instance.id)
