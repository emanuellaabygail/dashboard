from __future__ import annotations

import csv
import datetime

from django.http import HttpResponse
from rest_framework import permissions
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.access.permissions import HasProjectAccess
from apps.analytics.services import AnalyticsService


def _parse_date(value: str | None) -> datetime.date | None:
    if not value:
        return None
    try:
        return datetime.date.fromisoformat(value)
    except ValueError:
        return None


class AnalyticsFiltersView(APIView):
    permission_classes = [permissions.IsAuthenticated, HasProjectAccess]

    def get(self, request: Request) -> Response:
        project_id = request.query_params.get("project")
        if not project_id:
            return Response({"detail": "The 'project' query parameter is required."}, status=400)

        disciplines = AnalyticsService().get_disciplines(int(project_id))
        return Response({"disciplines": disciplines})


class AnalyticsProgressView(APIView):
    permission_classes = [permissions.IsAuthenticated, HasProjectAccess]

    def get(self, request: Request) -> Response:
        project_id = request.query_params.get("project")
        if not project_id:
            return Response({"detail": "The 'project' query parameter is required."}, status=400)

        trend = AnalyticsService().get_progress_trend(
            project_id=int(project_id),
            sheet_name=request.query_params.get("sheet", ""),
            date_from=_parse_date(request.query_params.get("date_from")),
            date_to=_parse_date(request.query_params.get("date_to")),
        )
        return Response(trend)


class AnalyticsExportView(APIView):
    permission_classes = [permissions.IsAuthenticated, HasProjectAccess]

    def get(self, request: Request) -> HttpResponse:
        project_id = request.query_params.get("project")
        if not project_id:
            return Response({"detail": "The 'project' query parameter is required."}, status=400)

        rows = AnalyticsService().export_rows(
            project_id=int(project_id),
            sheet_name=request.query_params.get("sheet", ""),
            date_from=_parse_date(request.query_params.get("date_from")),
            date_to=_parse_date(request.query_params.get("date_to")),
        )

        field_keys: list[str] = []
        seen = set()
        materialized = list(rows)
        for row in materialized:
            for key in row.data.keys():
                if key not in seen:
                    seen.add(key)
                    field_keys.append(key)

        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="analytics-export.csv"'

        writer = csv.writer(response)
        writer.writerow(["report_id", "uploaded_at", "sheet_name", "row_number", *field_keys])
        for row in materialized:
            writer.writerow(
                [
                    row.report_id,
                    row.report.uploaded_at.isoformat(),
                    row.sheet_name,
                    row.row_number,
                    *[row.data.get(key, "") for key in field_keys],
                ]
            )

        return response
