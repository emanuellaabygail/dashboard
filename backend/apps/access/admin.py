from __future__ import annotations

from django.contrib import admin

from apps.access.models import Profile, ProjectAccess


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "role", "updated_at"]
    list_filter = ["role"]
    search_fields = ["user__username", "user__email"]


@admin.register(ProjectAccess)
class ProjectAccessAdmin(admin.ModelAdmin):
    list_display = ["user", "project", "status", "requested_at", "decided_by", "decided_at"]
    list_filter = ["status"]
    search_fields = ["user__username", "project__name", "project__code"]
