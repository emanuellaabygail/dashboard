from __future__ import annotations

from django.middleware.csrf import get_token
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from rest_framework import permissions, status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.authentication.serializers import LoginSerializer, SignUpSerializer, UserSerializer
from apps.authentication.services import AuthenticationService, InvalidCredentialsError


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CsrfTokenView(APIView):
    authentication_classes: list[type] = []
    permission_classes = [permissions.AllowAny]

    def get(self, request: Request) -> Response:
        return Response({"csrfToken": get_token(request)})


class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request) -> Response:
        user = AuthenticationService().get_current_user(request)
        return Response(UserSerializer(user).data)


@method_decorator(csrf_protect, name="dispatch")
class LoginView(APIView):
    authentication_classes: list[type] = []
    permission_classes = [permissions.AllowAny]

    def post(self, request: Request) -> Response:
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            authenticated = AuthenticationService().login(
                request=request,
                username=serializer.validated_data["username"],
                password=serializer.validated_data["password"],
            )
        except InvalidCredentialsError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(UserSerializer(authenticated.user).data)


@method_decorator(csrf_protect, name="dispatch")
class SignUpView(APIView):
    authentication_classes: list[type] = []
    permission_classes = [permissions.AllowAny]

    def post(self, request: Request) -> Response:
        serializer = SignUpSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        authenticated = AuthenticationService().sign_up(
            request=request,
            username=data["username"],
            email=data.get("email", ""),
            first_name=data.get("first_name", ""),
            last_name=data.get("last_name", ""),
            password=data["password"],
        )

        return Response(UserSerializer(authenticated.user).data, status=status.HTTP_201_CREATED)


@method_decorator(csrf_protect, name="dispatch")
class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request: Request) -> Response:
        AuthenticationService().logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)
