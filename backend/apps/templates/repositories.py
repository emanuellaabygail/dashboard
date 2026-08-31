from __future__ import annotations

from django.db.models import Q, QuerySet

from apps.templates.models import Template, TemplateSheet


class TemplateNotFoundError(Exception):
    pass


class TemplateRepository:
    def list(self, *, search: str = "", is_active: str = "", project: str = "") -> QuerySet[Template]:
        queryset = Template.objects.select_related("created_by", "project").prefetch_related("sheets")

        if search:
            queryset = queryset.filter(Q(name__icontains=search) | Q(sheets__sheet_name__icontains=search)).distinct()

        if is_active:
            queryset = queryset.filter(is_active=is_active.lower() in {"1", "true", "yes"})

        if project:
            queryset = queryset.filter(project_id=project)

        return queryset

    def get(self, template_id: int) -> Template:
        try:
            return (
                Template.objects.select_related("created_by", "project")
                .prefetch_related("sheets")
                .get(pk=template_id)
            )
        except Template.DoesNotExist as exc:
            raise TemplateNotFoundError(f"Template {template_id} was not found.") from exc

    def create(self, *, sheets: list[dict[str, object]], **fields: object) -> Template:
        template = Template.objects.create(**fields)
        self._replace_sheets(template, sheets)
        return template

    def update(self, template: Template, *, sheets: list[dict[str, object]] | None = None, **fields: object) -> Template:
        for field, value in fields.items():
            setattr(template, field, value)
        template.save()

        if sheets is not None:
            self._replace_sheets(template, sheets)

        return template

    def delete(self, template: Template) -> None:
        template.delete()

    def _replace_sheets(self, template: Template, sheets: list[dict[str, object]]) -> None:
        template.sheets.all().delete()
        for order, sheet in enumerate(sheets):
            TemplateSheet.objects.create(template=template, order=order, **sheet)
