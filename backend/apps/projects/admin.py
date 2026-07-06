from __future__ import annotations

from django.contrib import admin

from apps.projects.models import Project


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ["code", "name", "status", "created_by", "created_at"]
    list_filter = ["status"]
    search_fields = ["code", "name"]
