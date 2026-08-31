"""Root URL configuration for the backend API."""
from __future__ import annotations

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.authentication.urls")),
    path("api/access/", include("apps.access.urls")),
    path("api/projects/", include("apps.projects.urls")),
    path("api/templates/", include("apps.templates.urls")),
    path("api/reports/", include("apps.reports.urls")),
    path("api/dashboard/", include("apps.dashboard.urls")),
    path("api/analytics/", include("apps.analytics.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
