"""Django settings for the engineering progress backend."""
from __future__ import annotations

import os
from pathlib import Path

import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent

# Present only in the production image (see root Dockerfile), which copies the built
# React app here so Django can serve it as static files under the same origin as the
# API — avoiding cross-site cookies for session/CSRF auth entirely.
FRONTEND_DIST = BASE_DIR / "frontend_dist"


def get_env(name: str, default: str = "") -> str:
    return os.environ.get(name, default)


def get_bool_env(name: str, default: bool = False) -> bool:
    value = os.environ.get(name)
    if value is None:
        return default
    return value.lower() in {"1", "true", "yes", "on"}


SECRET_KEY = get_env("DJANGO_SECRET_KEY", "unsafe-development-secret-key")
DEBUG = get_bool_env("DJANGO_DEBUG", True)
ALLOWED_HOSTS = [
    host.strip()
    for host in get_env("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
    if host.strip()
]


INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "django_filters",
    "corsheaders",
    "apps.authentication",
    "apps.access",
    "apps.projects",
    "apps.templates",
    "apps.reports",
    "apps.dashboard",
    "apps.analytics",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [FRONTEND_DIST] if FRONTEND_DIST.exists() else [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# Managed Postgres hosts (Railway, Render, Heroku, ...) inject a single DATABASE_URL;
# local docker-compose keeps using the discrete POSTGRES_* variables.
if get_env("DATABASE_URL"):
    DATABASES = {"default": dj_database_url.parse(get_env("DATABASE_URL"), conn_max_age=600)}
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": get_env("POSTGRES_DB", "engineering_progress"),
            "USER": get_env("POSTGRES_USER", "engineering_progress"),
            "PASSWORD": get_env("POSTGRES_PASSWORD", "engineering_progress"),
            "HOST": get_env("POSTGRES_HOST", "localhost"),
            "PORT": get_env("POSTGRES_PORT", "5432"),
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Jakarta"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"]
STATICFILES_STORAGE = "whitenoise.storage.CompressedStaticFilesStorage"

# Serves the built React app's hashed asset files (e.g. /assets/index-abc123.js) straight
# from the root, alongside STATIC_URL — only present in the production image.
if FRONTEND_DIST.exists():
    WHITENOISE_ROOT = FRONTEND_DIST

MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

if not DEBUG:
    # Railway (and most PaaS) terminate TLS at the edge and forward plain HTTP internally,
    # so Django needs to trust that header to know the original request was HTTPS.
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SECURE_SSL_REDIRECT = get_bool_env("DJANGO_SECURE_SSL_REDIRECT", True)
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
}

CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in get_env(
        "CORS_ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]
CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in get_env(
        "CSRF_TRUSTED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]

SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = False
