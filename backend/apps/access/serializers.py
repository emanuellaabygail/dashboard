from __future__ import annotations

from django.contrib.auth.models import User
from rest_framework import serializers

from apps.access.models import Profile, ProjectAccess
from apps.access.permissions import get_role


class UserRoleSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "full_name", "role", "is_superuser"]
        read_only_fields = fields

    def get_full_name(self, user: User) -> str:
        return user.get_full_name()

    def get_role(self, user: User) -> str:
        return get_role(user)


class UpdateUserRoleSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=Profile.Role.choices)


class ProjectAccessSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source="project.name", read_only=True)
    project_code = serializers.CharField(source="project.code", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)
    user_full_name = serializers.SerializerMethodField()
    decided_by_username = serializers.CharField(source="decided_by.username", read_only=True)

    class Meta:
        model = ProjectAccess
        fields = [
            "id",
            "project",
            "project_name",
            "project_code",
            "user",
            "username",
            "user_full_name",
            "status",
            "requested_at",
            "decided_by",
            "decided_by_username",
            "decided_at",
        ]
        read_only_fields = [
            "id",
            "project_name",
            "project_code",
            "username",
            "user_full_name",
            "status",
            "requested_at",
            "decided_by",
            "decided_by_username",
            "decided_at",
        ]

    def get_user_full_name(self, record: ProjectAccess) -> str:
        return record.user.get_full_name()


class RequestAccessSerializer(serializers.Serializer):
    project = serializers.IntegerField()


class GrantAccessSerializer(serializers.Serializer):
    project = serializers.IntegerField()
    user = serializers.IntegerField()
