from __future__ import annotations

from django.contrib import admin

from apps.reports.models import Report, ReportRow


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ["original_filename", "project", "template", "status", "uploaded_by", "uploaded_at"]
    list_filter = ["status", "project"]
    search_fields = ["original_filename"]


@admin.register(ReportRow)
class ReportRowAdmin(admin.ModelAdmin):
    list_display = ["report", "sheet_name", "row_number"]
    list_filter = ["sheet_name"]
    search_fields = ["report__original_filename"]
