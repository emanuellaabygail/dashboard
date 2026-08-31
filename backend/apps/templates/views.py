from __future__ import annotations

from rest_framework import permissions, status, viewsets
from rest_framework.parsers import MultiPartParser
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.access.permissions import ProjectScopedPermission, accessible_project_ids
from apps.templates.excel_preview import DEFAULT_PREVIEW_ROWS, ExcelPreviewError, ExcelPreviewService
from apps.templates.serializers import TemplateSerializer
from apps.templates.services import TemplateService


class TemplateViewSet(viewsets.ModelViewSet):
    serializer_class = TemplateSerializer
    permission_classes = [permissions.IsAuthenticated, ProjectScopedPermission]
    filterset_fields = ["is_active", "project"]

    def get_queryset(self):
        queryset = TemplateService().list_templates(
            search=self.request.query_params.get("search", ""),
            is_active=self.request.query_params.get("is_active", ""),
            project=self.request.query_params.get("project", ""),
        )
        project_ids = accessible_project_ids(self.request.user)
        if project_ids is not None:
            queryset = queryset.filter(project_id__in=project_ids)
        return queryset

    def perform_create(self, serializer: TemplateSerializer) -> None:
        template = TemplateService().create_template(
            created_by=self.request.user,
            **serializer.validated_data,
        )
        serializer.instance = template

    def perform_update(self, serializer: TemplateSerializer) -> None:
        template = TemplateService().update_template(
            serializer.instance.id,
            **serializer.validated_data,
        )
        serializer.instance = template

    def perform_destroy(self, instance) -> None:
        TemplateService().delete_template(instance.id)


class TemplatePreviewView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser]

    def post(self, request: Request) -> Response:
        uploaded_file = request.FILES.get("file")
        if uploaded_file is None:
            return Response({"detail": "A file is required."}, status=status.HTTP_400_BAD_REQUEST)

        sheet_name = request.data.get("sheet_name") or None
        load_full = str(request.data.get("full", "")).lower() in {"1", "true", "yes"}
        max_rows = None if load_full else DEFAULT_PREVIEW_ROWS

        try:
            preview = ExcelPreviewService().preview(uploaded_file, sheet_name=sheet_name, max_rows=max_rows)
        except ExcelPreviewError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                "sheet_names": preview.sheet_names,
                "sheet_name": preview.sheet_name,
                "rows": preview.rows,
                "total_rows": preview.total_rows,
                "merges": [
                    {
                        "min_row": merge.min_row,
                        "max_row": merge.max_row,
                        "min_col": merge.min_col,
                        "max_col": merge.max_col,
                    }
                    for merge in preview.merges
                ],
            }
        )
