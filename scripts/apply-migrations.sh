#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
MIGRATIONS_DIR="$PROJECT_ROOT/server/migrations"
ENV_FILE=${ENV_FILE:-$PROJECT_ROOT/server/.env}

if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "No se encontró el directorio de migraciones en $MIGRATIONS_DIR" >&2
  exit 1
fi

if [ -f "$ENV_FILE" ]; then
  echo "Cargando variables desde $ENV_FILE"
  set -a
  # shellcheck source=/dev/null
  source "$ENV_FILE"
  set +a
fi

if [ -z "${DATABASE_URL:-}" ]; then
  : "${DB_HOST:?Debe definir DB_HOST o DATABASE_URL}"
  : "${DB_USER:?Debe definir DB_USER o DATABASE_URL}"
  : "${DB_PASSWORD:?Debe definir DB_PASSWORD o DATABASE_URL}"
  : "${DB_NAME:?Debe definir DB_NAME o DATABASE_URL}"
  DB_PORT=${DB_PORT:-5432}
  CONNECTION_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
else
  CONNECTION_URL="$DATABASE_URL"
fi

PSQL_FLAGS=("$CONNECTION_URL" "-v" "ON_ERROR_STOP=1")

shopt -s nullglob
MIGRATION_FILES=($(ls "$MIGRATIONS_DIR"/*.sql 2>/dev/null | sort))
shopt -u nullglob

if [ ${#MIGRATION_FILES[@]} -eq 0 ]; then
  echo "No se encontraron archivos de migración para aplicar." >&2
  exit 0
fi

echo "Aplicando ${#MIGRATION_FILES[@]} migraciones a ${CONNECTION_URL}" | sed 's/\(postgresql:\/\/.*:\)[^@]*/\1****/'

for migration in "${MIGRATION_FILES[@]}"; do
  echo "→ Ejecutando $(basename "$migration")"
  psql "${PSQL_FLAGS[@]}" -f "$migration"
  echo "   ✔ Migración aplicada"
fi

echo "Todas las migraciones se aplicaron correctamente."
