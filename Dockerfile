# Production image: builds the React app and serves it from Django itself
# (same-origin), so the session/CSRF cookies used for auth never have to
# cross domains. Local development still uses docker-compose.yml, which
# runs the frontend and backend as separate dev-server containers.

# --- Stage 1: build the frontend ---
FROM node:22-alpine AS frontend-build
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
# Same-origin in production: the API lives at /api on this same domain.
ENV VITE_API_BASE_URL=/api
RUN npm run build

# --- Stage 2: backend, serving the built frontend as static files ---
FROM python:3.13-slim
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .
COPY --from=frontend-build /frontend/dist ./frontend_dist

RUN python manage.py collectstatic --noinput

EXPOSE 8000

CMD ["sh", "-c", "python manage.py migrate --noinput && gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 3"]
