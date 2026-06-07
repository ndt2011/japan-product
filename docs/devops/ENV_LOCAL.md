# Môi trường Local — Tổng hợp DevOps & Dev

> **Cập nhật**: 2026-06-07  
> **Repo**: https://github.com/ndt2011/japan-product  
> **Mục đích**: Phát triển trên máy Windows trước khi deploy staging

Tài liệu **một file** cho setup local, cấu hình, chạy app, test và đồng bộ với staging.

---

## 1. Tổng quan

```
Máy dev (Windows)
├── Terminal 1: Laravel API  → http://127.0.0.1:8000
├── Terminal 2: Next.js FE     → http://localhost:3000
└── Database: SQLite (mặc định) hoặc MySQL 8 local
```

| Thành phần | Thư mục | Port |
|------------|---------|------|
| API | `project/api` | 8000 |
| Frontend | `project/frontend` | 3000 |
| Docs | `docs/` | — |

---

## 2. Yêu cầu phần mềm

| Phần mềm | Phiên bản | Kiểm tra |
|----------|-----------|----------|
| PHP | 8.3+ | `php -v` |
| Composer | 2.x | `composer -V` |
| Node.js | 20+ | `node -v` |
| npm | 10+ | `npm -v` |
| Git | 2.x | `git --version` |

**PHP extensions:** `openssl`, `pdo`, `pdo_sqlite`, `pdo_mysql`, `mbstring`, `tokenizer`, `xml`, `ctype`, `json`, `bcmath`

**Tùy chọn:** MySQL 8, Redis 7 (giống staging)

---

## 3. Clone & cài đặt lần đầu

```powershell
git clone https://github.com/ndt2011/japan-product.git
cd japan-product
```

### 3.1 Backend (`project/api`)

```powershell
cd project\api
composer install
copy .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

→ http://127.0.0.1:8000

### 3.2 Frontend (`project/frontend`)

Terminal mới:

```powershell
cd project\frontend
copy .env.local.example .env.local
npm install
npm run dev
```

→ http://localhost:3000

---

## 4. File môi trường local

### 4.1 API — `project/api/.env`

**SQLite (dev nhanh — khuyến nghị):**

```env
APP_ENV=local
APP_DEBUG=true
APP_URL=http://127.0.0.1:8000

DB_CONNECTION=sqlite
DB_DATABASE=database/database.sqlite

QUEUE_CONNECTION=sync
CACHE_STORE=database
SESSION_DRIVER=file

# AI — để trống = mock
OPENAI_API_KEY=
```

**MySQL (giống staging hơn):**

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=japan_product_db
DB_USERNAME=root
DB_PASSWORD=
```

### 4.2 Frontend — `project/frontend/.env.local`

```env
API_URL=http://127.0.0.1:8000/api
NEXT_PUBLIC_APP_NAME=Hệ thống quản lý hàng hóa Nhật-Việt
```

> Dùng `127.0.0.1` thay `localhost` nếu Windows resolve lỗi.

---

## 5. Tài khoản demo

| Login ID | Mật khẩu | URL |
|----------|----------|-----|
| `admin` | `Admin@123` | http://localhost:3000/login |
| `vn_company01` | `Company@123` | |

Sau `php artisan migrate --seed` hoặc:

```powershell
php artisan db:seed --class=AuthOnlySeeder --force
```

---

## 6. Lệnh thường dùng

### API

```powershell
cd project\api

php artisan serve                    # Chạy API
php artisan migrate --seed           # Migrate + seed đầy đủ
php artisan migrate:fresh --seed     # Reset DB + seed
php artisan db:seed --class=AuthOnlySeeder --force   # Chỉ account
php artisan test                     # 39 tests (DB :memory: — không xóa sqlite dev)
php artisan route:list --path=api
```

### Frontend

```powershell
cd project\frontend

npm run dev          # Dev server
npm run build        # Build production (giống Vercel)
npm run lint
```

### Git

```powershell
git pull origin main
git status
```

---

## 7. Kiểm tra hoạt động

| # | Kiểm tra | URL / lệnh |
|---|----------|------------|
| 1 | API health | http://127.0.0.1:8000/api/health |
| 2 | Login UI | http://localhost:3000/login |
| 3 | Products | /products |
| 4 | AI | /ai-center |
| 5 | Orders | /orders |
| 6 | PHPUnit | `php artisan test` |

**Test login API (PowerShell):**

```powershell
$body = '{"login_id":"admin","password":"Admin@123"}'
$r = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/auth/login" -Method POST -Body $body -ContentType "application/json"
$r | ConvertTo-Json -Depth 5
```

Hoặc `curl.exe` (ổn định hơn):

```powershell
curl.exe -s -X POST "http://127.0.0.1:8000/api/auth/login" -H "Content-Type: application/json" -d "{\"login_id\":\"admin\",\"password\":\"Admin@123\"}"
```

---

## 8. Xử lý sự cố local

### 8.1 Login 503 — API_OFFLINE

| Nguyên nhân | Fix |
|-------------|-----|
| Chưa chạy `php artisan serve` | Terminal 1: `php artisan serve` |
| Sai `API_URL` trong `.env.local` | `http://127.0.0.1:8000/api` |

### 8.2 Login 401

| Nguyên nhân | Fix |
|-------------|-----|
| Chưa seed | `php artisan db:seed --force` |
| Mất user sau `php artisan test` | Đã fix — test dùng `:memory:`; nếu cũ: seed lại |

### 8.3 `php artisan test` xóa dữ liệu

- `phpunit.xml` dùng `DB_CONNECTION=sqlite` + `DB_DATABASE=:memory:`
- Không ảnh hưởng `database/database.sqlite` dev

### 8.4 Port 8000 / 3000 bận

```powershell
# Đổi port API
php artisan serve --port=8001
# Cập nhật .env.local: API_URL=http://127.0.0.1:8001/api
```

### 8.5 OpenAI / AI

- Key chỉ trong `project/api/.env` → `OPENAI_API_KEY=sk-...`
- Không key: mock (luồng A) + keyword (luồng B)
- Chi tiết: `docs/sa/AI_Setup_Guide.md`

---

## 9. Reset DB local — chỉ account

```powershell
cd project\api
php artisan migrate:fresh --force
php artisan db:seed --class=AuthOnlySeeder --force
```

**Seed đầy đủ** (1 SP demo + kho):

```powershell
php artisan migrate:fresh --seed --force
```

---

## 10. Local vs Staging

| Mục | Local | Staging |
|-----|-------|---------|
| API URL | http://127.0.0.1:8000 | https://product-production-7e4e.up.railway.app |
| FE URL | http://localhost:3000 | https://*.vercel.app |
| DB | SQLite / MySQL local | Railway MySQL |
| `API_URL` (FE) | `.env.local` | Vercel env |
| Deploy | `php artisan serve` + `npm run dev` | Railway + Vercel auto |
| Debug | `APP_DEBUG=true` | `APP_DEBUG=false` |

**Quy trình khuyến nghị:**

```
1. Dev + test local (login, module chính)
2. Push main → Railway/Vercel auto deploy
3. Kiểm tra staging health + login UI
```

---

## 11. Cấu trúc repo liên quan dev

```
TT_product_japan/
├── project/
│   ├── api/                 Laravel — đọc README.md trong thư mục
│   └── frontend/            Next.js
├── docs/
│   ├── devops/
│   │   ├── ENV_LOCAL.md     ← File này
│   │   └── ENV_STAGING.md   ← Môi trường cloud
│   └── sa/AI_Setup_Guide.md
├── .github/workflows/ci.yml
├── Dockerfile               # Chỉ dùng Railway (không cần local)
└── README.md
```

---

## 12. CI local (tùy chọn)

Chạy giống GitHub Actions trước khi push:

```powershell
cd project\api
php artisan test

cd ..\frontend
npm run build
```

---

## 13. Liên kết

| Tài liệu | Mục đích |
|----------|----------|
| [ENV_STAGING.md](./ENV_STAGING.md) | Railway + Vercel |
| [project/api/README.md](../../project/api/README.md) | API chi tiết |
| [docs/sa/AI_Setup_Guide.md](../sa/AI_Setup_Guide.md) | Cấu hình OpenAI |
| [docs/tasks/STATUS.md](../tasks/STATUS.md) | Tiến độ sprint |
