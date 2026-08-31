from __future__ import annotations

from django.contrib.auth.models import User
from django.db import models

from apps.projects.models import Project


class Template(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="templates")
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name="templates")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.project.code} - {self.name}"


class TemplateSheet(models.Model):
    template = models.ForeignKey(Template, on_delete=models.CASCADE, related_name="sheets")
    sheet_name = models.CharField(max_length=200)
    header_row_start = models.PositiveIntegerField(default=1)
    header_row_end = models.PositiveIntegerField(default=1)
    column_mappings = models.JSONField(default=list, blank=True)
    # Ordered list of column_indexes; a row's numbering value is the first non-null value
    # found among them (numbering is often split across columns by indent depth, like the
    # label columns). key_depth is the EXACT segment-count to keep (e.g. 3 for "1.1.1" /
    # "III.1.1") — siblings at one fixed depth never overlap, unlike a "<= depth" range
    # which would keep a rollup section alongside its own children.
    key_column_indexes = models.JSONField(default=list, blank=True)
    key_depth = models.PositiveIntegerField(null=True, blank=True)
    progress_categories = models.JSONField(default=list, blank=True)
    # Ordered list of field_keys; a row's label is the first non-null value found among
    # them. Item descriptions are often split across several columns by indent depth
    # (mirroring the numbering columns), so one column alone can miss deeper items.
    label_field_keys = models.JSONField(default=list, blank=True)
    # Exact label text (matched via label_field_keys) of this sheet's own pre-computed
    # "TOTAL <section>" row(s), e.g. ["TOTAL III"]. Excel already sums the full section
    # here (including rows we don't otherwise keep), so this is trusted directly rather
    # than re-derived from summing our own parsed rows. Sheets with more than one section
    # (e.g. two Roman-numeral totals) list every row to sum together.
    total_row_labels = models.JSONField(default=list, blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self) -> str:
        return f"{self.template.name} - {self.sheet_name}"
