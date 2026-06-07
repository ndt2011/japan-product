#!/bin/sh
set -e

echo "[start] Japan Product API — migrate then serve on port ${PORT:-8000}"

# Railway: map MySQL plugin vars → Laravel (khi user quên DB_CONNECTION)
if [ -z "$DB_CONNECTION" ] || [ "$DB_CONNECTION" = "sqlite" ]; then
  if [ -n "$MYSQLHOST" ]; then
    export DB_CONNECTION=mysql
    export DB_HOST="${DB_HOST:-$MYSQLHOST}"
    export DB_PORT="${DB_PORT:-$MYSQLPORT}"
    export DB_DATABASE="${DB_DATABASE:-$MYSQLDATABASE}"
    export DB_USERNAME="${DB_USERNAME:-$MYSQLUSER}"
    export DB_PASSWORD="${DB_PASSWORD:-$MYSQLPASSWORD}"
    echo "[start] DB auto: mysql via MYSQLHOST"
  elif [ -n "$DB_HOST" ]; then
    export DB_CONNECTION=mysql
    echo "[start] DB auto: mysql via DB_HOST"
  elif [ -n "$MYSQL_URL" ]; then
    export DB_CONNECTION=mysql
    export DB_URL="${DB_URL:-$MYSQL_URL}"
    echo "[start] DB auto: mysql via MYSQL_URL"
  fi
fi

echo "[start] env DB_CONNECTION=${DB_CONNECTION:-unset}"
echo "[start] env DB_HOST=${DB_HOST:-unset}"
echo "[start] env MYSQLHOST=${MYSQLHOST:-unset}"

php artisan config:clear

php artisan migrate --force

exec php artisan serve --host=0.0.0.0 --port="${PORT:-8000}"
