from __future__ import annotations

from rest_framework.routers import DefaultRouter

from apps.access.views import ProjectAccessViewSet, UserRoleViewSet

app_name = "access"

router = DefaultRouter()
router.register("users", UserRoleViewSet, basename="access-user")
router.register("records", ProjectAccessViewSet, basename="access-record")

urlpatterns = router.urls
