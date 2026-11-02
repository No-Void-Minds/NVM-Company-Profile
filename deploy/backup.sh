#!/usr/bin/env bash
# Daily backup of the database and uploaded media, kept for 14 days (NFR-13).
set -euo pipefail

deploy_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
set -a
source "$deploy_dir/.env"
set +a

media_dir="/srv/nvm-compro/media"
stamp="$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Written under a temporary name, so a failed run never looks like a good backup.
docker exec -e PGPASSWORD="$PGPASSWORD_MIGRATOR" "$PG_CONTAINER" \
  pg_dump -U compro_migrator -Fc nvm_compro >"$BACKUP_DIR/.db-$stamp.tmp"
mv "$BACKUP_DIR/.db-$stamp.tmp" "$BACKUP_DIR/db-$stamp.dump"

tar -czf "$BACKUP_DIR/.media-$stamp.tmp" -C "$media_dir" .
mv "$BACKUP_DIR/.media-$stamp.tmp" "$BACKUP_DIR/media-$stamp.tar.gz"

find "$BACKUP_DIR" -maxdepth 1 -type f \( -name 'db-*.dump' -o -name 'media-*.tar.gz' \) -mtime +13 -delete
