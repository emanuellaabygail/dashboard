from __future__ import annotations

from django.contrib.auth.models import User
from django.db.models import QuerySet

from apps.templates.models import Template
from apps.templates.repositories import TemplateNotFoundError, TemplateRepository

__all__ = ["TemplateNotFoundError", "TemplateService"]


class TemplateService:
    def __init__(self, repository: TemplateRepository | None = None) -> None:
        self.repository = repository or TemplateRepository()

    def list_templates(self, *, search: str = "", is_active: str = "", project: str = "") -> QuerySet[Template]:
        return self.repository.list(search=search, is_active=is_active, project=project)

    def get_template(self, template_id: int) -> Template:
        return self.repository.get(template_id)

    def create_template(self, *, created_by: User, **fields: object) -> Template:
        return self.repository.create(created_by=created_by, **fields)

    def update_template(self, template_id: int, **fields: object) -> Template:
        template = self.get_template(template_id)
        return self.repository.update(template, **fields)

    def delete_template(self, template_id: int) -> None:
        template = self.get_template(template_id)
        self.repository.delete(template)
