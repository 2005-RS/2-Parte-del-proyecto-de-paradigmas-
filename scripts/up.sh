#!/bin/sh
set -e
cd "$(dirname "$0")/.."
if ! command -v docker >/dev/null 2>&1; then
  echo "Instala Docker y Docker Compose, y vuelve a ejecutar este script."
  exit 1
fi
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Se creó .env desde .env.example."
fi
docker compose --env-file .env up -d --build
echo "Aula: http://localhost:8080"
echo "Cliente adicional: http://localhost:8081"
echo "Cuenta del profesor: ronny.salas@profelink.dev / Demo1234!"
