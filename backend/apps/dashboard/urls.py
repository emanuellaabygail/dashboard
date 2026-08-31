from __future__ import annotations

from django.urls import path

from apps.dashboard.views import DashboardProjectSummaryView, DashboardSummaryView

app_name = "dashboard"

urlpatterns = [
    path("summary/", DashboardSummaryView.as_view(), name="summary"),
    path("project-summary/", DashboardProjectSummaryView.as_view(), name="project-summary"),
]
