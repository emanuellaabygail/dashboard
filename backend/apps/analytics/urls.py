from __future__ import annotations

from django.urls import path

from apps.analytics.views import AnalyticsExportView, AnalyticsFiltersView, AnalyticsProgressView

app_name = "analytics"

urlpatterns = [
    path("filters/", AnalyticsFiltersView.as_view(), name="filters"),
    path("progress/", AnalyticsProgressView.as_view(), name="progress"),
    path("export/", AnalyticsExportView.as_view(), name="export"),
]
