#!/bin/sh
set -e
cd "$(dirname "$0")/.."
docker compose --env-file .env down
echo "Servicios detenidos. Los volúmenes se conservan."
