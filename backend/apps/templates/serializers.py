from __future__ import annotations

from rest_framework import serializers

from apps.templates.models import Template, TemplateSheet


class ColumnMappingSerializer(serializers.Serializer):
    column_index = serializers.IntegerField(min_value=1)
    header_label = serializers.CharField(allow_blank=True, required=False, default="")
    field_key = serializers.CharField(min_length=1, max_length=100)


class ProgressCategorySerializer(serializers.Serializer):
    label = serializers.CharField(min_length=1, max_length=100)
    plan_field_key = serializers.CharField(min_length=1, max_length=100)
    actual_field_key = serializers.CharField(min_length=1, max_length=100)
    match_label = serializers.CharField(required=False, allow_blank=True, default="")
    item_plan_field_key = serializers.CharField(required=False, allow_blank=True, default="")
    item_actual_field_key = serializers.CharField(required=False, allow_blank=True, default="")


class TemplateSheetSerializer(serializers.ModelSerializer):
    column_mappings = ColumnMappingSerializer(many=True)
    key_column_indexes = serializers.ListField(
        child=serializers.IntegerField(min_value=1), required=False, default=list
    )
    key_depth = serializers.IntegerField(min_value=1, required=False, allow_null=True)
    progress_categories = ProgressCategorySerializer(many=True, required=False, default=list)
    label_field_keys = serializers.ListField(
        child=serializers.CharField(min_length=1, max_length=100), required=False, default=list
    )
    total_row_labels = serializers.ListField(
        child=serializers.CharField(min_length=1, max_length=200), required=False, default=list
    )

    class Meta:
        model = TemplateSheet
        fields = [
            "id",
            "sheet_name",
            "header_row_start",
            "header_row_end",
            "column_mappings",
            "key_column_indexes",
            "key_depth",
            "progress_categories",
            "label_field_keys",
            "total_row_labels",
        ]
        read_only_fields = ["id"]

    def validate(self, attrs: dict[str, object]) -> dict[str, object]:
        start = attrs.get("header_row_start", 1)
        end = attrs.get("header_row_end", 1)
        if end < start:
            raise serializers.ValidationError(
                {"header_row_end": "Header row end must be on or after the header row start."}
            )

        key_column_indexes = attrs.get("key_column_indexes", [])
        if key_column_indexes:
            column_mappings = attrs.get("column_mappings", [])
            mapped_indexes = {mapping["column_index"] for mapping in column_mappings}
            if any(index not in mapped_indexes for index in key_column_indexes):
                raise serializers.ValidationError(
                    {"key_column_indexes": "The row-number column(s) must be mapped columns."}
                )
            if not attrs.get("key_depth"):
                attrs["key_depth"] = 2

        column_mappings = attrs.get("column_mappings", [])
        field_keys = {mapping["field_key"] for mapping in column_mappings}
        progress_categories = attrs.get("progress_categories", [])
        labels = [category["label"] for category in progress_categories]
        if len(labels) != len(set(labels)):
            raise serializers.ValidationError(
                {"progress_categories": "Category labels must be unique within a sheet."}
            )
        for category in progress_categories:
            for field_name in ("plan_field_key", "actual_field_key"):
                if category[field_name] not in field_keys:
                    raise serializers.ValidationError(
                        {"progress_categories": "Each category's columns must be mapped columns."}
                    )
            for field_name in ("item_plan_field_key", "item_actual_field_key"):
                value = category.get(field_name)
                if value and value not in field_keys:
                    raise serializers.ValidationError(
                        {"progress_categories": "Each category's item display column must be a mapped column."}
                    )

        label_field_keys = attrs.get("label_field_keys", [])
        if any(key not in field_keys for key in label_field_keys):
            raise serializers.ValidationError(
                {"label_field_keys": "Each label column must be one of the mapped columns' field keys."}
            )

        if not label_field_keys and any(category.get("match_label") for category in progress_categories):
            raise serializers.ValidationError(
                {"progress_categories": "A work item label column is required to match categories by row label."}
            )

        if attrs.get("total_row_labels") and not label_field_keys:
            raise serializers.ValidationError(
                {"total_row_labels": "A work item label column is required to match the sheet's total row(s)."}
            )

        return attrs

    def validate_column_mappings(self, column_mappings: list[dict[str, object]]) -> list[dict[str, object]]:
        if not column_mappings:
            raise serializers.ValidationError("At least one column mapping is required.")

        field_keys = [mapping["field_key"] for mapping in column_mappings]
        if len(field_keys) != len(set(field_keys)):
            raise serializers.ValidationError("Field keys must be unique within a sheet.")

        return column_mappings


class TemplateSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source="project.name", read_only=True)
    project_code = serializers.CharField(source="project.code", read_only=True)
    created_by_username = serializers.CharField(source="created_by.username", read_only=True)
    sheets = TemplateSheetSerializer(many=True)

    class Meta:
        model = Template
        fields = [
            "id",
            "project",
            "project_name",
            "project_code",
            "name",
            "description",
            "is_active",
            "sheets",
            "created_by",
            "created_by_username",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_by", "created_by_username", "created_at", "updated_at"]

    def validate_sheets(self, sheets: list[dict[str, object]]) -> list[dict[str, object]]:
        if not sheets:
            raise serializers.ValidationError("At least one sheet configuration is required.")
        return sheets
