from __future__ import annotations

from rest_framework import serializers

from apps.reports.models import Report
from apps.templates.excel_preview import ExcelPreviewError, get_sheet_names


class ReportSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source="project.name", read_only=True)
    project_code = serializers.CharField(source="project.code", read_only=True)
    template_name = serializers.CharField(source="template.name", read_only=True, default="")
    uploaded_by_username = serializers.CharField(source="uploaded_by.username", read_only=True)
    row_count = serializers.SerializerMethodField()

    class Meta:
        model = Report
        fields = [
            "id",
            "project",
            "project_name",
            "project_code",
            "template",
            "template_name",
            "file",
            "original_filename",
            "status",
            "error_message",
            "row_count",
            "uploaded_by",
            "uploaded_by_username",
            "uploaded_at",
        ]
        read_only_fields = [
            "id",
            "original_filename",
            "status",
            "error_message",
            "row_count",
            "uploaded_by",
            "uploaded_by_username",
            "uploaded_at",
            "project_name",
            "project_code",
            "template_name",
        ]

    def get_row_count(self, report: Report) -> int:
        annotated_count = getattr(report, "row_count", None)
        if annotated_count is not None:
            return annotated_count
        return report.rows.count()

    def validate_file(self, file: object) -> object:
        try:
            get_sheet_names(file)
        except ExcelPreviewError as exc:
            raise serializers.ValidationError(str(exc)) from exc
        file.seek(0)
        return file

    def validate(self, attrs: dict[str, object]) -> dict[str, object]:
        template = attrs.get("template")
        project = attrs.get("project")
        if template is not None and project is not None and template.project_id != project.id:
            raise serializers.ValidationError({"template": "Template must belong to the selected project."})
        return attrs
