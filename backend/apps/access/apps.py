from __future__ import annotations

from django.apps import AppConfig


class AccessConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.access"

    def ready(self) -> None:
        from apps.access import signals  # noqa: F401
