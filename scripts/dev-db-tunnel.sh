#!/usr/bin/env bash
set -euo pipefail

remote_port="${NVM_PG_REMOTE_PORT:-5432}"
# A dead link is noticed within about 90 seconds and ssh exits, instead of hanging with
# the local port still open. A port that cannot be forwarded stops ssh at once.
exec ssh -N \
  -o ServerAliveInterval=30 \
  -o ServerAliveCountMax=3 \
  -o ExitOnForwardFailure=yes \
  -L "15432:127.0.0.1:${remote_port}" nvmadmin@192.168.68.144
