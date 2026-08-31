from __future__ import annotations

from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.request import Request
from rest_framework.response import Response

from apps.access.permissions import ProjectScopedPermission, accessible_project_ids, has_project_access
from apps.reports.repositories import ReportNotFoundError
from apps.reports.serializers import ReportSerializer
from apps.reports.services import ReportParseError, ReportService


class ReportViewSet(viewsets.ModelViewSet):
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated, ProjectScopedPermission]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filterset_fields = ["project", "status"]
    http_method_names = ["get", "post", "delete", "head", "options"]

    def get_queryset(self):
        queryset = ReportService().list_reports(
            project=self.request.query_params.get("project", ""),
            status=self.request.query_params.get("status", ""),
        )
        project_ids = accessible_project_ids(self.request.user)
        if project_ids is not None:
            queryset = queryset.filter(project_id__in=project_ids)
        return queryset

    def perform_create(self, serializer: ReportSerializer) -> None:
        original_filename = serializer.validated_data["file"].name
        report = ReportService().create_report(
            uploaded_by=self.request.user,
            original_filename=original_filename,
            **serializer.validated_data,
        )
        serializer.instance = report

    def perform_destroy(self, instance) -> None:
        ReportService().delete_report(instance.id)

    @action(detail=True, methods=["post"])
    def parse(self, request: Request, pk: str | None = None) -> Response:
        template_id = request.data.get("template")

        try:
            report = ReportService().parse_report(
                int(pk), template_id=int(template_id) if template_id else None
            )
        except ReportNotFoundError:
            return Response({"detail": "Report not found."}, status=status.HTTP_404_NOT_FOUND)
        except ReportParseError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(self.get_serializer(report).data)

    @action(detail=True, methods=["get"])
    def rows(self, request: Request, pk: str | None = None) -> Response:
        # A custom detail action doesn't call get_object(), so the permission class's
        # has_object_permission is never invoked here — check project access explicitly.
        try:
            report = ReportService().get_report(int(pk))
        except ReportNotFoundError:
            return Response({"detail": "Report not found."}, status=status.HTTP_404_NOT_FOUND)

        if not has_project_access(request.user, report.project_id):
            raise PermissionDenied("You do not have access to this project's reports.")

        sheet_names = ReportService().get_sheet_names(int(pk))
        items = ReportService().get_work_items(
            int(pk), sheet_name=request.query_params.get("sheet", "")
        )

        return Response({"sheet_names": sheet_names, "items": items})
