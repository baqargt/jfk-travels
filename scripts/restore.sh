#!/usr/bin/env sh
set -eu

if [ "$#" -ne 1 ]; then
  echo "Usage: scripts/restore.sh path/to/backup.dump" >&2
  exit 2
fi

backup_file="$1"
test -f "$backup_file"
docker compose exec -T db pg_restore --clean --if-exists --no-owner -U "${POSTGRES_USER:-jfk}" -d "${POSTGRES_DB:-jfk_erp}" < "$backup_file"
docker compose exec -T api alembic upgrade head
echo "Restore completed and migrations are current."
