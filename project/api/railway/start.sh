#!/bin/sh

echo "[start] Japan Product API — port ${PORT:-8000}"

# Railway: map MySQL plugin vars → Laravel
if [ -n "$DB_URL" ] || [ -n "$MYSQL_URL" ]; then
  export DB_CONNECTION=mysql
  export DB_URL="${DB_URL:-$MYSQL_URL}"
  echo "[start] DB: mysql via DB_URL/MYSQL_URL"
elif [ -z "$DB_CONNECTION" ] || [ "$DB_CONNECTION" = "sqlite" ]; then
  if [ -n "$MYSQLHOST" ]; then
    export DB_CONNECTION=mysql
    export DB_HOST="${DB_HOST:-$MYSQLHOST}"
    export DB_PORT="${DB_PORT:-$MYSQLPORT}"
    export DB_DATABASE="${DB_DATABASE:-$MYSQLDATABASE}"
    export DB_USERNAME="${DB_USERNAME:-$MYSQLUSER}"
    export DB_PASSWORD="${DB_PASSWORD:-$MYSQLPASSWORD}"
    echo "[start] DB: mysql via MYSQLHOST"
  elif [ -n "$DB_HOST" ]; then
    export DB_CONNECTION=mysql
    echo "[start] DB: mysql via DB_HOST"
  fi
fi

echo "[start] env DB_CONNECTION=${DB_CONNECTION:-unset}"
echo "[start] env DB_URL=${DB_URL:+set}"
echo "[start] env DB_HOST=${DB_HOST:-unset}"
echo "[start] env keys DB/MYSQL:"
printenv | grep -E '^(DB_|MYSQL)' | sed 's/\(PASSWORD\|PASS\)=.*/\1=***/' || true

php artisan config:clear

echo "[start] migrate..."
if php artisan migrate --force --no-ansi; then
  echo "[start] migrate OK"
else
  echo "[start] WARN: migrate FAILED — server starts anyway; fix DB_URL then: php artisan migrate --force"
fi

echo "[start] serve on 0.0.0.0:${PORT:-8000}"
exec php artisan serve --host=0.0.0.0 --port="${PORT:-8000}"
