from __future__ import annotations

from rest_framework import permissions, status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.access.permissions import HasProjectAccess, IsAdminOnly
from apps.dashboard.services import DashboardService, ProjectSummaryError


class DashboardSummaryView(APIView):
    """The cross-project overview (recent uploads, aggregate totals) is admin-only —
    a normal user's project-level access doesn't extend to seeing other projects'
    activity mixed into one global view."""

    permission_classes = [permissions.IsAuthenticated, IsAdminOnly]

    def get(self, request: Request) -> Response:
        return Response(DashboardService().get_summary())


class DashboardProjectSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated, HasProjectAccess]

    def get(self, request: Request) -> Response:
        project_id = request.query_params.get("project")
        if not project_id:
            return Response({"detail": "The 'project' query parameter is required."}, status=400)

        try:
            summary = DashboardService().get_project_summary(int(project_id))
        except ProjectSummaryError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)

        return Response(summary)
