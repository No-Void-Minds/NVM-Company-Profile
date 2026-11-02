#!/usr/bin/env bash
set -euo pipefail

remote_port="${NVM_PG_REMOTE_PORT:-5432}"
exec ssh -N -L "15432:127.0.0.1:${remote_port}" nvmadmin@192.168.68.144
