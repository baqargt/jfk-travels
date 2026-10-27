# JFK Travel ERP

React/Vite frontend with a FastAPI API, PostgreSQL, Redis/Celery and private MinIO storage. Business state is persisted in PostgreSQL; browser storage is used only for sidebar presentation preference.

## Development start

1. Copy `.env.example` to `.env` and replace the development secrets.
2. Start the complete stack:

   ```sh
   docker compose up --build
   ```

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

## Security and workflow notes

Authentication uses short-lived HttpOnly access cookies and rotated refresh sessions, with CSRF protection on writes. Backend role/company/branch checks are authoritative. Sensitive fields are encrypted at application level. Files remain unavailable until object metadata validation and ClamAV scanning complete. Finance ledgers are append-only and booking confirmation uses a row lock plus an `Idempotency-Key` to prevent duplicate booking and limit consumption.
