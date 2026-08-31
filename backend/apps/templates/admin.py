from __future__ import annotations

from django.contrib import admin

from apps.templates.models import Template, TemplateSheet


class TemplateSheetInline(admin.TabularInline):
    model = TemplateSheet
    extra = 0


@admin.register(Template)
class TemplateAdmin(admin.ModelAdmin):
    list_display = ["name", "project", "is_active", "created_by", "created_at"]
    list_filter = ["is_active", "project"]
    search_fields = ["name"]
    inlines = [TemplateSheetInline]
