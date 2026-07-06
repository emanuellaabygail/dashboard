from __future__ import annotations

from django.urls import path

from apps.authentication.views import (
    CsrfTokenView,
    CurrentUserView,
    LoginView,
    LogoutView,
    SignUpView,
)


app_name = "authentication"

urlpatterns = [
    path("csrf/", CsrfTokenView.as_view(), name="csrf"),
    path("me/", CurrentUserView.as_view(), name="me"),
    path("login/", LoginView.as_view(), name="login"),
    path("signup/", SignUpView.as_view(), name="signup"),
    path("logout/", LogoutView.as_view(), name="logout"),
]
