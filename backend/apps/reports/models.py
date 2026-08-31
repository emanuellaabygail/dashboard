from __future__ import annotations

from django.contrib.auth.models import User
from django.db import models

from apps.projects.models import Project
from apps.templates.models import Template


def report_upload_path(instance: "Report", filename: str) -> str:
    return f"reports/{instance.project_id}/{filename}"


class Report(models.Model):
    class Status(models.TextChoices):
        UPLOADED = "uploaded", "Uploaded"
        PARSED = "parsed", "Parsed"
        FAILED = "failed", "Failed"


    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="reports")
    template = models.ForeignKey(
        Template, on_delete=models.PROTECT, related_name="reports", null=True, blank=True
    )
    file = models.FileField(upload_to=report_upload_path)
    original_filename = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.UPLOADED)
    error_message = models.TextField(blank=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name="reports")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-uploaded_at"]

    def __str__(self) -> str:
        return f"{self.project.code} - {self.original_filename}"


class ReportRow(models.Model):
    report = models.ForeignKey(Report, on_delete=models.CASCADE, related_name="rows")
    sheet_name = models.CharField(max_length=200)
    row_number = models.PositiveIntegerField()
    data = models.JSONField()
    # False for rows that are Excel outline-group rollups (their values duplicate their
    # nested child rows below); aggregation must sum only is_leaf=True rows to avoid
    # double-counting the same work multiple times across hierarchy levels.
    is_leaf = models.BooleanField(default=True)
    # Hierarchy depth resolved from the sheet's numbering column(s) (e.g. "III.1.10" -> 3),
    # only set for sheets with a key_depth filter configured. Rows shallower than key_depth
    # are kept as group/section headers so the Excel grouping structure can be shown as a
    # tree; only rows where group_depth == key_depth are real work items.
    group_depth = models.PositiveIntegerField(null=True, blank=True)
    group_number = models.CharField(max_length=50, blank=True, default="")
    # True for a sheet's own pre-computed "TOTAL <section>" row (matched via the sheet's
    # configured total_row_labels) — not a work item, used only to source that sheet's
    # own Procurement/Construction totals directly from Excel's own rollup.
    is_total_row = models.BooleanField(default=False)

    class Meta:
        ordering = ["sheet_name", "row_number"]

    def __str__(self) -> str:
        return f"{self.report_id} - {self.sheet_name}:{self.row_number}"
