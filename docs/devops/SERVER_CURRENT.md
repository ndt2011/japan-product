# Server hiện tại — Phiếu tra cứu nhanh (Staging)

> **Cập nhật**: 2026-06-08 · Commit `29fe4e8`  
> **Mục đích**: Lần sau deploy / nhập env / SSH Shell — mở file này copy-paste, không cần nhớ lại.

---

## 1. URL & dự án (điền sẵn — staging đang chạy)

| Mục | Giá trị |
|-----|---------|
| **GitHub repo** | https://github.com/ndt2011/japan-product |
| **Branch deploy** | `main` |
| **Railway project** | `japan-product-staging` (hoặc tên bạn đặt trên dashboard) |
| **Railway service API** | `product` |
| **API public URL** | https://product-production-7e4e.up.railway.app |
| **API base (Laravel)** | https://product-production-7e4e.up.railway.app/api |
| **Health check** | https://product-production-7e4e.up.railway.app/api/health |
| **Health + IP Rakuten** | https://product-production-7e4e.up.railway.app/api/health?ip=1 |
| **Vercel project** | `japan-product` |
| **Frontend URL** | https://japan-product.vercel.app |
| **Login staging** | https://japan-product.vercel.app/login |

### Trạng thái health (kiểm tra 2026-06-08)

```json
{
  "status": "ok",
  "env": "staging",
  "db": "mysql",
  "queue_connection": "sync",
  "rakuten_configured": true,
  "openai_configured": true,
  "product_image_disk": "r2",
  "r2_configured": true
}
```

---

## 2. Kiến trúc (nhớ 1 lần)

```
Browser
  → Vercel (Next.js)     https://japan-product.vercel.app
       Cookie: auth_token (httpOnly)
       BFF: /api/auth/* , /api/proxy/*
  → Railway (Laravel)    https://product-production-7e4e.up.railway.app/api/*
       MySQL 8 + Redis 7 (Railway plugins)
       Ảnh SP: Cloudflare R2 (PRODUCT_IMAGE_DISK=r2)
```

**Quan trọng:** Browser **không** gọi Railway trực tiếp. Chỉ Vercel server gọi qua biến `API_URL`.

---

## 3. Tài khoản demo (sau seed)

| Login ID | Mật khẩu | Vai trò | Ghi chú |
|----------|----------|---------|---------|
| `admin` | `Admin@123` | Admin (JP) | Super Admin — quản trị toàn hệ thống |
| `vn_company01` | `Company@123` | Công ty VN | Đại lý B2B — đặt hàng, xem HĐ |
| `hn_manager` | `Manager@123` | Branch Manager | Cần `BranchSeeder` trên Railway |
| `hn_staff` | `Staff@123` | Branch Staff | Cần `BranchSeeder` trên Railway |

**Tạo user mới:** `/admin` → tab Người Dùng → + Thêm (Admin / Công ty VN).  
**User chi nhánh:** `/admin/branches` → chọn CN → Quản lý NV.

---

## 4. Vercel — copy env (Settings → Environment Variables)

Áp dụng **Production** (và nên thêm Preview):

```env
API_URL=https://product-production-7e4e.up.railway.app/api
NEXT_PUBLIC_APP_NAME=Hệ thống quản lý hàng hóa Nhật-Việt
```

| Cài đặt build | Giá trị |
|---------------|---------|
| Root Directory | `project/frontend` |
| Install Command | `npm install` |
| Build Command | `npm run build` |
| Framework | Next.js |

File: `project/frontend/vercel.json`

**Sau khi đổi `API_URL`:** Redeploy Vercel (Deployments → ⋮ → Redeploy).

---

## 5. Railway — service `product` (Variables RAW Editor)

### 5.1 Bắt buộc (không thiếu)

```env
APP_NAME=JapanProductAPI
APP_ENV=staging
APP_DEBUG=false
APP_TIMEZONE=Asia/Tokyo
APP_URL=https://product-production-7e4e.up.railway.app

# Tạo trên MÁY LOCAL — KHÔNG chạy key:generate trong Railway Shell
APP_KEY=base64:THAY_BANG_php_artisan_key_generate_show

LOG_CHANNEL=stderr
LOG_LEVEL=info

# BẮT BUỘC — copy MYSQL_URL từ service MySQL → dán vào service product
DB_CONNECTION=mysql
DB_URL=mysql://root:PASSWORD@mysql.railway.internal:3306/railway

CACHE_STORE=database
QUEUE_CONNECTION=sync
SESSION_DRIVER=database

SANCTUM_TOKEN_EXPIRATION=1440
SANCTUM_STATEFUL_DOMAINS=japan-product.vercel.app

MAIL_MAILER=log
MAIL_FROM_ADDRESS=noreply@staging.local
MAIL_FROM_NAME=JapanProduct Staging
```

### 5.2 Ảnh sản phẩm — R2 (đang bật trên staging)

```env
PRODUCT_IMAGE_DISK=r2
R2_ACCESS_KEY_ID=THAY_TU_CLOUDFLARE
R2_SECRET_ACCESS_KEY=THAY_TU_CLOUDFLARE
R2_DEFAULT_REGION=auto
R2_BUCKET=tt-product-images
R2_ENDPOINT=https://THAY_ACCOUNT_ID.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://pub-THAY_SUBDOMAIN.r2.dev
```

Chi tiết: [r2-cloudflare-setup.md](./r2-cloudflare-setup.md)

### 5.3 AI Search

```env
OPENAI_API_KEY=sk-THAY
OPENAI_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
AI_SEARCH_LIMIT=15
AI_SEARCH_HYBRID_ENABLED=true
PRODUCT_MARKUP_PERCENT=30

RAKUTEN_APPLICATION_ID=THAY
RAKUTEN_ACCESS_KEY=pk_THAY
# RAKUTEN_AFFILIATE_ID=
RAKUTEN_ORIGIN_URL=https://japan-product.vercel.app
```

Rakuten: whitelist **IP outbound Railway** + URL Vercel → [rakuten-api-setup.md](./rakuten-api-setup.md)

```bash
# Railway Shell — lấy IP whitelist Rakuten
curl -s https://api.ipify.org
# hoặc
curl -s "https://product-production-7e4e.up.railway.app/api/health?ip=1"
```

### 5.4 Redis (tùy chọn — hiện dùng database cache)

```env
REDIS_URL=${{Redis.REDIS_URL}}
REDIS_CLIENT=phpredis
```

### 5.5 Build & start (repo)

| Mục | File / giá trị |
|-----|----------------|
| Dockerfile | `/Dockerfile` (repo root) |
| Start command | `project/api/railway/start.sh` |
| Auto migrate | Có — trong `start.sh` (`migrate --force`) |

**Lưu ý:**
- Nếu log `stock_movements already exists` — migration đã chạy, **không** migrate thủ công lại.
- Patch migrations `100070`–`100072` **idempotent** — an toàn khi Railway `migrate --force` chạy lại.
- Cần `doctrine/dbal` (đã có trong `composer.json`) cho `renameColumn` / `change()` trên MySQL.

---

## 6. Local dev — env nhanh

**API** `project/api/.env`:

```env
APP_URL=http://localhost:8000
DB_CONNECTION=sqlite
# hoặc MySQL local — xem ENV_LOCAL.md
PRODUCT_IMAGE_DISK=public
QUEUE_CONNECTION=sync
```

**FE** `project/frontend/.env.local`:

```env
API_URL=http://127.0.0.1:8000/api
NEXT_PUBLIC_APP_NAME=Hệ thống quản lý hàng hóa Nhật-Việt
```

```powershell
# Terminal 1
cd project\api
php artisan migrate --seed
php artisan serve

# Terminal 2
cd project\frontend
npm install
npm run dev
# → http://localhost:3000/login
```

---

## 7. Railway Shell — lệnh sau mỗi lần deploy lớn

```bash
# 1. Kiểm tra DB (không migrate lại nếu đã Ran hết)
php artisan migrate:status

# 2. User chi nhánh demo (hn_manager, hn_staff)
php artisan db:seed --class=BranchSeeder

# 3. AI tiếng Việt + embedding catalog
php artisan products:generate-vi
php artisan products:embed --force

# 4. (Tùy chọn) Reset DB sạch — XÓA HẾT DỮ LIỆU
# php artisan migrate:fresh --force
# php artisan db:seed --force
```

### Reset chỉ tài khoản (giữ cấu trúc bảng)

```bash
php artisan migrate:fresh --force
php artisan db:seed --class=AuthOnlySeeder --force
php artisan db:seed --class=BranchSeeder
```

---

## 8. Test nhanh (PowerShell — máy dev)

```powershell
# Health
curl.exe -s "https://product-production-7e4e.up.railway.app/api/health"

# Login API (dùng file JSON — tránh lỗi escape PowerShell)
Set-Content -Path "$env:TEMP\login.json" -Value '{"login_id":"admin","password":"Admin@123"}' -NoNewline
curl.exe -s -X POST "https://product-production-7e4e.up.railway.app/api/auth/login" `
  -H "Content-Type: application/json" --data-binary "@$env:TEMP\login.json"

# Frontend
start https://japan-product.vercel.app/login
```

### Checklist UI sau deploy

| # | URL | Tài khoản |
|---|-----|-----------|
| 1 | `/login` | admin |
| 2 | `/admin` | admin — danh sách **tất cả user** |
| 3 | `/admin/branches` | admin — tạo CN + NV |
| 4 | `/products` | admin / vn_company01 |
| 5 | `/orders` | vn_company01 |
| 6 | `/dashboard` | admin |
| 7 | `/invoices` | admin |
| 8 | `/ai-center` | admin — tab Khám phá web |
| 9 | `/my-branch` | hn_manager |

---

## 9. Sự cố thường gặp → fix nhanh

| Triệu chứng | Nguyên nhân | Cách xử lý |
|-------------|-------------|------------|
| UI `API_OFFLINE` | Sai `API_URL` Vercel | Sửa env + Redeploy Vercel |
| Health `db: sqlite` | Thiếu `DB_URL` trên service **product** | Copy `MYSQL_URL` → Redeploy Railway |
| Login 401 | Chưa seed | `db:seed` hoặc `AuthOnlySeeder` |
| Login 502 | Railway restart | Đợi 1–2 phút, thử lại |
| `hn_manager` fail | Chưa BranchSeeder | Shell: `db:seed --class=BranchSeeder` |
| AI M0206 | IP Railway chưa whitelist Rakuten | `health?ip=1` → thêm IP Rakuten Developers |
| AI M0207 | `RAKUTEN_ORIGIN_URL` sai | = `https://japan-product.vercel.app` |
| Vercel build fail | ESLint / TypeScript | `cd project/frontend && npm run build` local trước khi push |
| `stock_movements exists` | Migrate chạy 2 lần | Bỏ qua — `start.sh` đã xử lý |
| Khóa login M0106 | Sai MK 5 lần | `php artisan cache:clear` trên Railway |
| `/admin` placeholder cũ | Vercel chưa deploy commit mới | Hard refresh Ctrl+Shift+R |

---

## 10. Commit gần đây (tham chiếu deploy)

| Commit | Nội dung |
|--------|----------|
| `29fe4e8` | Admin: tất cả user, form hint, ma trận quyền |
| `5599313` | Fix Vercel build (hooks, PageHeader) |
| `faee24a` | Admin screen list + search |
| `8285115` | Invoice, dual pricing, confirm-receipt |
| `55d7b9e` | Dashboard, hybrid AI, lockout |
| `08655f7` | User mgmt `/admin` API |

---

## 11. File liên quan trong repo

| File | Khi nào dùng |
|------|--------------|
| **SERVER_CURRENT.md** (file này) | Tra cứu URL + env + lệnh Shell |
| [ENV_STAGING.md](./ENV_STAGING.md) | Chi tiết deploy + timeline sự cố |
| [STAGING_DEPLOY_MEMO.md](./STAGING_DEPLOY_MEMO.md) | Checklist deploy lần đầu |
| [ENV_LOCAL.md](./ENV_LOCAL.md) | Dev Windows local |
| [staging-env-railway.template.env](./staging-env-railway.template.env) | Template RAW Railway |
| [staging-env-vercel.template.env](./staging-env-vercel.template.env) | Template Vercel |
| [rakuten-api-setup.md](./rakuten-api-setup.md) | Rakuten IP + quota |
| [r2-cloudflare-setup.md](./r2-cloudflare-setup.md) | Ảnh SP persistent |
| [railway-mysql-variables.md](./railway-mysql-variables.md) | Gắn MySQL + reset DB |

---

## 12. Checklist tái tạo server mới (từ đầu)

- [ ] Railway: tạo project → MySQL + Redis
- [ ] Railway: add service GitHub `ndt2011/japan-product`, branch `main`, Dockerfile root
- [ ] Railway Variables: mục **5.1** + **5.2** + **5.3** (điền secret thật)
- [ ] Generate domain API → cập nhật `APP_URL`
- [ ] Vercel: import repo, root `project/frontend`, env mục **4**
- [ ] Railway Shell: `BranchSeeder` + `products:generate-vi` + `products:embed --force`
- [ ] Rakuten: whitelist IP + `RAKUTEN_ORIGIN_URL`
- [ ] Test login + `/admin` + `/api/health`
