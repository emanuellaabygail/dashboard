from __future__ import annotations

from rest_framework import serializers

from apps.access.models import ProjectAccess
from apps.access.permissions import is_admin
from apps.projects.models import Project


class ProjectSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source="created_by.username", read_only=True)
    access_status = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "code",
            "description",
            "status",
            "start_date",
            "end_date",
            "contract_value",
            "created_by",
            "created_by_username",
            "access_status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_by",
            "created_by_username",
            "access_status",
            "created_at",
            "updated_at",
        ]

    def get_access_status(self, project: Project) -> str:
        """"admin" (sees everything), else the caller's own request/grant state for this
        project — "approved", "pending", "denied", or "none" if never requested."""
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if user is None:
            return "none"
        if is_admin(user):
            return "admin"
        record = ProjectAccess.objects.filter(project=project, user=user).first()
        return record.status if record else "none"

    def validate(self, attrs: dict[str, object]) -> dict[str, object]:
        start_date = attrs.get("start_date", getattr(self.instance, "start_date", None))
        end_date = attrs.get("end_date", getattr(self.instance, "end_date", None))
        if start_date and end_date and start_date > end_date:
            raise serializers.ValidationError({"end_date": "End date must be on or after the start date."})
        return attrs
