#!/bin/sh
set -e

echo "[start] Japan Product API — migrate then serve on port ${PORT:-8000}"

php artisan config:clear

php artisan migrate --force

exec php artisan serve --host=0.0.0.0 --port="${PORT:-8000}"
