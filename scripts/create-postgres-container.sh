#!/usr/bin/env bash
set -euo pipefail

CONTAINER_NAME=${CONTAINER_NAME:-serviteca-postgres}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-serviteca_password}
POSTGRES_USER=${POSTGRES_USER:-serviteca_user}
POSTGRES_DB=${POSTGRES_DB:-serviteca}
POSTGRES_PORT=${POSTGRES_PORT:-5432}
DATA_PATH=${DATA_PATH:-$PWD/.data/postgres}
NETWORK_NAME=${NETWORK_NAME:-serviteca-network}
IMAGE_TAG=${IMAGE_TAG:-postgres:16}

if ! docker network ls --format '{{.Name}}' | grep -q "^${NETWORK_NAME}$"; then
  echo "Creating Docker network '${NETWORK_NAME}'..."
  docker network create "${NETWORK_NAME}"
fi

mkdir -p "${DATA_PATH}"

echo "Starting PostgreSQL container '${CONTAINER_NAME}' on port ${POSTGRES_PORT}..."
docker run -d \
  --name "${CONTAINER_NAME}" \
  --restart unless-stopped \
  --network "${NETWORK_NAME}" \
  -e POSTGRES_PASSWORD="${POSTGRES_PASSWORD}" \
  -e POSTGRES_USER="${POSTGRES_USER}" \
  -e POSTGRES_DB="${POSTGRES_DB}" \
  -v "${DATA_PATH}":/var/lib/postgresql/data \
  -p "${POSTGRES_PORT}:5432" \
  "${IMAGE_TAG}"

echo "PostgreSQL container '${CONTAINER_NAME}' is running."
echo "Connection URL: postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${POSTGRES_PORT}/${POSTGRES_DB}"
