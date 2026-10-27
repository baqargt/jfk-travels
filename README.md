# JFK Travel ERP

React/Vite frontend with a FastAPI API, PostgreSQL, Redis/Celery and private MinIO storage. Business state is persisted in PostgreSQL; browser storage is used only for sidebar presentation preference.

## Deployment profiles and feature flags

Optional application integrations are controlled with environment flags. The corresponding Redis/Celery, S3-compatible storage and ClamAV service blocks are temporarily commented in `compose.yaml` for the low-memory deployment:

```env
REDIS_ENABLED=true
CELERY_ENABLED=true
STORAGE_BACKEND=s3
MALWARE_SCAN_ENABLED=true
FILE_UPLOADS_ENABLED=true
```

For a 1GB RAM VPS without Docker, use the temporary low-memory profile:

```env
ENVIRONMENT=production
DATABASE_URL=postgresql+psycopg://jfk:strong-password@127.0.0.1:5432/jfk_erp
REDIS_ENABLED=false
CELERY_ENABLED=false
STORAGE_BACKEND=local
LOCAL_STORAGE_PATH=/var/lib/jfk-erp/uploads
MALWARE_SCAN_ENABLED=false
FILE_UPLOADS_ENABLED=false
COOKIE_SECURE=true
```

The root `.env.example` now defaults to this direct-deployment profile. In particular, `DATABASE_URL`, `REDIS_URL` and `CLAMAV_HOST` use `127.0.0.1`. If Docker Compose is used instead, switch those hosts to `db`, `redis` and `clamav`, and use `minio` for the internal S3 endpoint as shown in the comments inside `.env.example`.

Before starting production, replace the example domain, database/admin passwords, `JWT_SECRET` and `FIELD_ENCRYPTION_KEY`. `FIELD_ENCRYPTION_KEY` must be a real Fernet key, not an arbitrary password. In production the manager seed is not automatic, so create a second Manager/Administrator before enabling finance workflows.

For a direct systemd deployment, copy the completed environment file outside the repository, for example to `/etc/jfk-erp/jfk-erp.env`, set permissions to `600`, and reference it with `EnvironmentFile=/etc/jfk-erp/jfk-erp.env`. Do not commit the real `.env`. If the database password contains reserved URL characters, percent-encode it inside `DATABASE_URL`.

`FILE_UPLOADS_ENABLED=false` is intentional: without malware scanning, production document uploads should remain unavailable. When uploads are required, install ClamAV or use an external scanning service before enabling them. Do not treat an unscanned file as clean.

The low-memory runtime should contain only PostgreSQL, Nginx and one Uvicorn worker. Build the React frontend on a development/CI machine and deploy only the generated static files. Use a 1–2GB swap file as an emergency buffer, not as normal application memory.

Suggested PostgreSQL starting values for a 1GB host:

```conf
shared_buffers = 128MB
effective_cache_size = 384MB
work_mem = 2MB
maintenance_work_mem = 32MB
max_connections = 30
```

With Celery disabled, run database-backed maintenance commands from cron or systemd timers every 5–15 minutes:

```sh
python -m app.jobs.expire_limits
```

These commands must remain idempotent and use database locking. Before switching to the low-memory profile, verify `/health/ready` reports disabled optional dependencies without returning `503`. Feature flags must be wired and tested before removing Redis, MinIO or ClamAV from an existing deployment.

## Development start

1. Copy `.env.example` to `.env` and replace the development secrets.
2. Start the core stack (PostgreSQL, API, frontend and gateway):

   ```sh
   docker compose up --build
   ```

   Redis, Celery worker/beat, S3-compatible storage and ClamAV are temporarily disabled in `compose.yaml`. To restore the full stack later, uncomment their service and volume blocks, enable the related flags in `.env`, and then use the `full` profile.

3. Open `http://localhost:8080`. The development seed creates the administrator and manager from `.env` (`ADMIN_EMAIL`, `ADMIN_PASSWORD`, `MANAGER_EMAIL`, `MANAGER_PASSWORD`). Change these values before the first start.

The API applies migrations and runs the idempotent development seed on startup. API docs are available at `http://localhost:8080/api/docs` outside production. Readiness is exposed at `/health/ready` and checks PostgreSQL, Redis and MinIO.

## Local checks

```sh
cd front-end && npm ci && npm run build
cd ../back-end && pip install -r requirements-dev.txt && ruff check app tests && pytest
```

## Production checklist

- Set `ENVIRONMENT=production`, `COOKIE_SECURE=true`, a strong `JWT_SECRET`, and a valid Fernet `FIELD_ENCRYPTION_KEY`; never commit `.env`.
- Replace all default PostgreSQL, MinIO and seeded-user passwords. Provision at least two distinct Administrator/Manager users before enabling finance workflows.
- Keep PostgreSQL, Redis, MinIO and ClamAV on the private Docker network. Expose only the TLS gateway and restrict VPS firewall ingress to 80/443 and administration access.
- Use `deploy/nginx-https.conf.example` with a real domain/certificate or a managed TLS reverse proxy.
- Configure SMTP, centralized structured log collection, uptime alerts for `/health/ready`, disk/volume alerts and container restart alerts.
- Run `scripts/backup.sh`, encrypt and copy the dump off-site, enforce retention, and regularly restore it into a fresh environment with `scripts/restore.sh`.
- Deploy immutable image tags. Before release, take a backup and record the current image/migration revision. Roll back application images only when compatible; otherwise restore the backup and previous images together.
- For direct deployment, run FastAPI and maintenance timers as restricted systemd users; keep PostgreSQL and Uvicorn bound to localhost and expose only Nginx on ports 80/443.
- Back up both PostgreSQL and `LOCAL_STORAGE_PATH` when local file storage is enabled.

## Security and workflow notes

Authentication uses short-lived HttpOnly access cookies and rotated refresh sessions, with CSRF protection on writes. Backend role/company/branch checks are authoritative. Sensitive fields are encrypted at application level. Files remain unavailable until object metadata validation and ClamAV scanning complete. Finance ledgers are append-only and booking confirmation uses a row lock plus an `Idempotency-Key` to prevent duplicate booking and limit consumption.
