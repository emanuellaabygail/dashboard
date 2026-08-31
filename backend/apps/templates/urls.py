from __future__ import annotations

from django.urls import path
from rest_framework.routers import DefaultRouter

from apps.templates.views import TemplatePreviewView, TemplateViewSet


app_name = "templates"

router = DefaultRouter()
router.register("", TemplateViewSet, basename="template")

urlpatterns = [
    path("preview/", TemplatePreviewView.as_view(), name="template-preview"),
] + router.urls
