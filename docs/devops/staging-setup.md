# Staging — Railway + Vercel

> **Task**: DO-001, DO-002 | **Repo**: https://github.com/ndt2011/japan-product

## 1. Railway (Backend API)

1. Tạo project mới trên [Railway](https://railway.app)
2. **Add Service** → Deploy from GitHub → chọn `japan-product`
3. **Root Directory**: `project/api`
4. Thêm services: **MySQL 8**, **Redis 7**
5. Variables (từ `project/api/.env.example`):

```env
APP_NAME=JapanProductAPI
APP_ENV=staging
APP_KEY=          # php artisan key:generate --show
APP_DEBUG=false
APP_URL=https://<api-service>.up.railway.app

DB_CONNECTION=mysql
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_DATABASE=${{MySQL.MYSQLDATABASE}}
DB_USERNAME=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}

CACHE_STORE=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis
REDIS_URL=${{Redis.REDIS_URL}}

SANCTUM_STATEFUL_DOMAINS=<vercel-domain>
FRONTEND_URL=https://<vercel-app>.vercel.app
```

6. **Deploy command** (hoặc dùng `railway.toml`):
   - Build: `composer install --no-dev --optimize-autoloader`
   - Start: `php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=$PORT`

7. Kiểm tra: `GET https://<api>/api/health`

## 2. Vercel (Frontend)

1. Import repo `ndt2011/japan-product`
2. **Root Directory**: `project/frontend`
3. Framework: Next.js (auto)
4. Environment:

```env
API_URL=https://<api-service>.up.railway.app/api
```

5. Deploy → mở `https://<app>.vercel.app/login`

## 3. GitHub Actions

- **CI**: `.github/workflows/ci.yml` — chạy khi push/PR `main`
- **Deploy** (tùy chọn): thêm secrets `RAILWAY_TOKEN`, `VERCEL_TOKEN` rồi bật job deploy

## 4. Branch protection (DO-004)

GitHub → Settings → Branches → `main`:
- Require PR before merge
- Require status check: `Laravel API Tests`, `Next.js Build`
