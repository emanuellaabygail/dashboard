from __future__ import annotations

from dataclasses import dataclass

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import AnonymousUser, User
from django.http import HttpRequest


class InvalidCredentialsError(Exception):
    pass


@dataclass(frozen=True)
class AuthenticatedUser:
    user: User


class AuthenticationService:
    def get_current_user(self, request: HttpRequest) -> User | AnonymousUser:
        return request.user

    def login(self, request: HttpRequest, username: str, password: str) -> AuthenticatedUser:
        login_identifier = self._resolve_login_identifier(username)
        user = authenticate(request=request, username=login_identifier, password=password)
        if user is None:
            raise InvalidCredentialsError("Invalid username or password.")

        login(request, user)
        return AuthenticatedUser(user=user)

    def sign_up(
        self,
        request: HttpRequest,
        username: str,
        password: str,
        email: str = "",
        first_name: str = "",
        last_name: str = "",
    ) -> AuthenticatedUser:
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
        )
        login(request, user)
        return AuthenticatedUser(user=user)

    def logout(self, request: HttpRequest) -> None:
        logout(request)

    def _resolve_login_identifier(self, username: str) -> str:
        if "@" not in username:
            return username

        user = User.objects.filter(email__iexact=username).only("username").first()
        if user is None:
            return username
        return user.username
