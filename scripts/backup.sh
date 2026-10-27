#!/usr/bin/env sh
set -eu

backup_dir="${BACKUP_DIR:-./backups}"
retention_days="${BACKUP_RETENTION_DAYS:-14}"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$backup_dir"
docker compose exec -T db pg_dump -U "${POSTGRES_USER:-jfk}" -d "${POSTGRES_DB:-jfk_erp}" -Fc > "$backup_dir/jfk_erp_$timestamp.dump"
find "$backup_dir" -type f -name 'jfk_erp_*.dump' -mtime "+$retention_days" -delete
echo "Encrypted off-site transfer must run after backup creation: $backup_dir/jfk_erp_$timestamp.dump"
