#!/usr/bin/env bash
# Daily backup of the database and uploaded media, kept for 14 days (NFR-13).
# Every run appends one line to $BACKUP_DIR/backup.log and exits non-zero on failure.
set -euo pipefail

deploy_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
set -a
source "$deploy_dir/.env"
set +a

media_dir="/srv/nvm-compro/media"
stamp="$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

log_file="$BACKUP_DIR/backup.log"
db_tmp="$BACKUP_DIR/.db-$stamp.tmp"
media_tmp="$BACKUP_DIR/.media-$stamp.tmp"
err_file="$(mktemp)"
db_size="-"
media_size="-"
logged=""

log_line() {
  local line
  line="$(date '+%Y-%m-%dT%H:%M:%S%:z') $1 db=$db_size media=$media_size"
  if [ -n "${2:-}" ]; then
    line="$line pesan=$2"
  fi
  printf '%s\n' "$line" >>"$log_file"
  logged=1
}

fail() {
  log_line GAGAL "$1"
  echo "backup GAGAL: $1" >&2
  exit 1
}

# Stderr of the failed step, folded into one line for the log.
last_error() {
  tr -s '\n\t' '  ' <"$err_file" | sed 's/ *$//'
}

# Only this run's temporary files, so a concurrent or older run is never touched.
on_exit() {
  local rc=$?
  rm -f "$db_tmp" "$media_tmp" "$err_file"
  if [ "$rc" -ne 0 ] && [ -z "$logged" ]; then
    log_line GAGAL "berhenti tak terduga dengan kode $rc"
  fi
}
trap on_exit EXIT

# Written under a temporary name, so a failed run never looks like a good backup.
# docker exec uses the container's local socket, which needs no password.
docker exec "$PG_CONTAINER" pg_dump -U compro_migrator -Fc nvm_compro >"$db_tmp" 2>"$err_file" ||
  fail "pg_dump: $(last_error)"
[ -s "$db_tmp" ] || fail "pg_dump menghasilkan file kosong"
mv "$db_tmp" "$BACKUP_DIR/db-$stamp.dump"
db_size="$(du -h "$BACKUP_DIR/db-$stamp.dump" | cut -f1)"

[ -d "$media_dir" ] || fail "folder media $media_dir tidak ada"
# Find errors (an unreadable folder) count as problems too.
unreadable="$(find "$media_dir" \( \( -type d \( ! -readable -o ! -executable \) \) -o \( ! -type d ! -readable \) \) -print 2>&1 || true)"
if [ -n "$unreadable" ]; then
  count="$(printf '%s\n' "$unreadable" | wc -l)"
  first="$(printf '%s\n' "$unreadable" | head -n 1)"
  fail "izin: $count file atau folder media tidak bisa dibaca user $(id -un), contoh: $first. Backend menyimpan file 0644 dan folder 0755. Perbaiki file lama dengan: sudo chmod -R a+rX $media_dir"
fi

tar -czf "$media_tmp" -C "$media_dir" . 2>"$err_file" || fail "tar: $(last_error)"
mv "$media_tmp" "$BACKUP_DIR/media-$stamp.tar.gz"
media_size="$(du -h "$BACKUP_DIR/media-$stamp.tar.gz" | cut -f1)"

find "$BACKUP_DIR" -maxdepth 1 -type f \( -name 'db-*.dump' -o -name 'media-*.tar.gz' \) -mtime +13 -delete

log_line OK
