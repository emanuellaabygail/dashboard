"""Root URL configuration for the backend API."""
from __future__ import annotations

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.generic import TemplateView


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

# Low-traffic internal tool: media is served through Django in every environment rather
# than adding a separate file-serving layer. In production this needs a persistent volume
# mounted at MEDIA_ROOT, or uploaded reports won't survive a redeploy.
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

if settings.FRONTEND_DIST.exists():
    # Anything that isn't an API/admin/static/media route is a client-side React Router
    # path — hand it index.html so a hard refresh on e.g. /dashboard doesn't 404.
    urlpatterns += [
        re_path(
            r"^(?!api/|admin/|static/|media/).*$",
            TemplateView.as_view(template_name="index.html"),
        ),
    ]
