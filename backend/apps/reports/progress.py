from __future__ import annotations

from apps.reports.models import Report
from apps.templates.models import TemplateSheet

CategoryTotals = dict[str, float]


def to_number(value: object) -> float | None:
    if value is None:
        return None
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    try:
        return float(str(value).strip().replace("%", ""))
    except ValueError:
        return None


def category_configs_for_template(template_id: int) -> dict[str, list[dict[str, str]]]:
    """Maps sheet_name -> list of {label, plan_field_key, actual_field_key, match_label?}."""
    configs: dict[str, list[dict[str, str]]] = {}
    sheets = TemplateSheet.objects.filter(template_id=template_id).exclude(progress_categories=[])
    for sheet in sheets:
        if sheet.progress_categories:
            configs[sheet.sheet_name] = sheet.progress_categories
    return configs


def label_field_keys_for_template(template_id: int) -> dict[str, list[str]]:
    """Maps sheet_name -> ordered list of label field_keys, for resolving match_label."""
    return {
        sheet.sheet_name: sheet.label_field_keys
        for sheet in TemplateSheet.objects.filter(template_id=template_id).exclude(label_field_keys=[])
    }


def key_depth_for_template(template_id: int) -> dict[str, int]:
    """Maps sheet_name -> key_depth, for excluding stored ancestor/group rows from sums."""
    return {
        sheet.sheet_name: sheet.key_depth
        for sheet in TemplateSheet.objects.filter(template_id=template_id, key_depth__isnull=False)
    }


def resolve_row_label(row_data: dict[str, object], label_field_keys: list[str]) -> str | None:
    """Item descriptions are often split across several columns by indent depth, so a
    row's label is the first non-blank value found across the configured columns."""
    for field_key in label_field_keys:
        value = row_data.get(field_key)
        if value is not None and str(value).strip() != "":
            return str(value).strip()
    return None


def aggregate_report_categories(
    report: Report, *, sheet_name: str = ""
) -> dict[str, CategoryTotals]:
    """Sums plan/actual per progress category label across a report's rows.

    Returns {label: {"plan": total, "actual": total}}.
    """
    configs = category_configs_for_template(report.template_id)
    if not configs:
        return {}

    label_field_keys = label_field_keys_for_template(report.template_id)
    key_depths = key_depth_for_template(report.template_id)

    # A label targeted by match_label (a precise, single-row lookup on an authoritative
    # summary sheet) is trusted over a blanket whole-sheet sum with the same label —
    # e.g. a "Procurement" total from a SUMMARY sheet vs. summing every BOQ line's own
    # "Procurement" column, which double-counts through Excel outline rollups. If any
    # sheet defines a label via match_label, blanket (non-matched) contributions to that
    # same label are dropped so the two sources never mix.
    precise_labels = {
        category["label"]
        for categories in configs.values()
        for category in categories
        if category.get("match_label")
    }

    # Only leaf rows: non-leaf rows are Excel outline-group rollups whose values
    # already duplicate their nested child rows, so including them would double-count.
    rows = report.rows.filter(is_leaf=True)
    if sheet_name:
        rows = rows.filter(sheet_name=sheet_name)

    totals: dict[str, CategoryTotals] = {}
    for row in rows:
        categories = configs.get(row.sheet_name)
        if not categories:
            continue

        # Rows shallower than the sheet's configured grouping depth are ancestor/group-header
        # rows kept only for displaying the Excel outline structure — their rollup values would
        # double-count the target-depth rows summed below them, so they're excluded here.
        target_depth = key_depths.get(row.sheet_name)
        if target_depth is not None and row.group_depth != target_depth:
            continue

        raw_label = resolve_row_label(row.data, label_field_keys.get(row.sheet_name, []))
        row_label = raw_label.lower() if raw_label is not None else None

        for category in categories:
            match_label = category.get("match_label")
            if match_label:
                if row_label is None or row_label != match_label.strip().lower():
                    continue
            elif category["label"] in precise_labels:
                continue

            plan_value = to_number(row.data.get(category["plan_field_key"]))
            actual_value = to_number(row.data.get(category["actual_field_key"]))
            if plan_value is None and actual_value is None:
                continue
            bucket = totals.setdefault(category["label"], {"plan": 0.0, "actual": 0.0})
            bucket["plan"] += plan_value or 0.0
            bucket["actual"] += actual_value or 0.0

    return totals


def resolve_overall(categories: dict[str, CategoryTotals]) -> CategoryTotals | None:
    """Picks the category literally labeled "Overall"; otherwise sums every category."""
    for label, totals in categories.items():
        if label.strip().lower() == "overall":
            return totals
    if not categories:
        return None
    return {
        "plan": sum(totals["plan"] for totals in categories.values()),
        "actual": sum(totals["actual"] for totals in categories.values()),
    }
