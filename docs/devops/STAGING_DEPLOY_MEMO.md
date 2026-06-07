# Memo — Deploy Staging (Railway + Vercel)

> **Task**: DEV-12, DEV-13 · DO-001, DO-002  
> **Cập nhật**: 2026-06-08  
> **Repo**: https://github.com/ndt2011/japan-product  
> **Đọc khi**: Sau khi login local OK, trước khi lên cloud

Tài liệu này là **hướng dẫn từng bước + phiếu ghi nhớ** — điền URL/thông tin vào bảng memo bên dưới để tra cứu sau.

---

## Memo của bạn (điền sau khi deploy)

| Mục | Giá trị (điền tay) | Ghi chú |
|-----|-------------------|---------|
| Railway Project | | Tên project trên dashboard |
| API public URL | `https://` | Tab Settings → Networking → Generate Domain |
| MySQL service | | Tên service MySQL trên Railway |
| Redis service | | Tên service Redis trên Railway |
| Vercel project | | Tên project Vercel |
| Frontend URL | `https://` | Domain production Vercel |
| `APP_KEY` đã tạo | ☐ Có | `php artisan key:generate --show` |
| `db:seed` đã chạy | ☐ Có | Railway Shell hoặc CLI |
| Login staging OK | ☐ Có | `admin` / `Admin@123` |
| Health check OK | ☐ Có | `GET .../api/health` |
| Rakuten env Railway | ☐ Có | `RAKUTEN_*`, `OPENAI_API_KEY` — RAW Editor |
| Rakuten IP whitelist | ☐ Có | `curl api.ipify.org` trong Railway Shell |
| AI Rakuten search OK | ☐ Có | /ai-center → Khám phá web |
| R2 ảnh SP OK | ☐ Có | health `r2_configured: true` |
| Branch seed OK | ☐ Có | `db:seed --class=BranchSeeder` |
| Tạo user `/admin` OK | ☐ Có | Tab Admin / Công ty VN |
| Chi nhánh `/admin/branches` OK | ☐ Có | Tạo CN + nhân viên |
| SP tab "Theo chi nhánh" OK | ☐ Có | `/products/{id}` admin only |
| AI embed OK | ☐ Có | `products:generate-vi` + `products:embed --force` |
| Ngày deploy | | |
| Người deploy | | |

**Tài khoản demo** (sau `db:seed`):

| Login ID | Mật khẩu | Role |
|----------|----------|------|
| `admin` | `Admin@123` | Admin |
| `vn_company01` | `Company@123` | Công ty VN |
| `hn_manager` | `Manager@123` | Branch Manager |
| `hn_staff` | `Staff@123` | Branch Staff |

---

## Tổng quan luồng deploy

```
Bước 0  Smoke test local (đã login OK)
   ↓
Bước 1  Railway: MySQL + Redis
   ↓
Bước 2  Railway: Laravel API (project/api)
   ↓
Bước 3  Seed dữ liệu demo trên Railway
   ↓
Bước 4  Vercel: Next.js (project/frontend)
   ↓
Bước 5  Kiểm tra login + các module trên staging
   ↓
Bước 5b Rakuten AI: env Railway + whitelist IP Rakuten Developers
   ↓
Bước 6  (Tùy chọn) CI auto-deploy + branch protection
```

**Kiến trúc staging:**

```
Browser → Vercel (Next.js BFF /api/*)
              ↓ server-side fetch
         Railway (Laravel /api/*)
              ↓
         MySQL 8 + Redis 7 (Railway plugins)
```

Frontend **không** gọi Laravel trực tiếp từ browser — Next.js route (`/api/auth/login`, `/api/proxy/*`) gọi Railway bằng biến `API_URL` trên Vercel.

---

## Bước 0 — Chuẩn bị & smoke test local

### 0.1 Tài khoản cần có

- [ ] GitHub: quyền repo `ndt2011/japan-product`
- [ ] [Railway](https://railway.app) — đăng nhập bằng GitHub
- [ ] [Vercel](https://vercel.com) — đăng nhập bằng GitHub

### 0.2 Local đang chạy ổn

**Terminal 1 — API:**

```powershell
cd c:\WORK\05_THUY_PROJECT\project_alone\TT_product_japan\project\api
php artisan db:seed
php artisan serve
```

**Terminal 2 — Frontend:**

```powershell
cd c:\WORK\05_THUY_PROJECT\project_alone\TT_product_japan\project\frontend
npm run dev
```

**File env local:**

| File | Biến quan trọng |
|------|-----------------|
| `project/api/.env` | SQLite hoặc MySQL local |
| `project/frontend/.env.local` | `API_URL=http://127.0.0.1:8000/api` |

### 0.3 Smoke test trước deploy (checklist)

| # | Việc | URL local | ☐ |
|---|------|-----------|---|
| 1 | Đăng nhập | http://localhost:3000/login | |
| 2 | Danh sách sản phẩm | /products | |
| 3 | AI center (2 tab) | /ai-center | |
| 4 | Tạo đơn hàng | /orders/new | |
| 5 | Chuyến hàng | /shipments | |
| 6 | Health API | http://127.0.0.1:8000/api/health | |

Chỉ deploy staging khi **ít nhất mục 1 và 6** pass.

---

## Bước 1 — Railway: MySQL + Redis

### 1.1 Tạo project

1. Vào https://railway.app/dashboard
2. **New Project** → **Empty Project**
3. Đặt tên ví dụ: `japan-product-staging`

### 1.2 Thêm MySQL 8

1. Trong project → **+ New** → **Database** → **Add MySQL**
2. Đợi service **Active**
3. Mở service MySQL → tab **Variables** — ghi lại (hoặc dùng reference `${{MySQL.MYSQLHOST}}` sau):

| Biến Railway | Dùng cho Laravel |
|--------------|------------------|
| `MYSQLHOST` | `DB_HOST` |
| `MYSQLPORT` | `DB_PORT` |
| `MYSQLDATABASE` | `DB_DATABASE` |
| `MYSQLUSER` | `DB_USERNAME` |
| `MYSQLPASSWORD` | `DB_PASSWORD` |

### 1.3 Thêm Redis 7

1. **+ New** → **Database** → **Add Redis**
2. Tab **Variables** → copy `REDIS_URL` (hoặc reference `${{Redis.REDIS_URL}}`)

### 1.4 Ghi memo

- [ ] Điền tên MySQL / Redis vào bảng memo đầu file

---

## Không thấy Root Directory? (đọc trước)

Railway có **2 loại Settings** — hay nhầm:

| Loại | Mở bằng | Có Root Directory? |
|------|---------|-------------------|
| **Project Settings** | Bánh răng góc project / tên project trên đầu | ❌ Không |
| **Service Settings** | **Click ô `japan-product`** trên canvas → tab **Settings** | ✅ Có |

**Tìm Root Directory (Service Settings):**

```
Canvas (màn hình có MySQL, Redis, japan-product)
    │
    └── CLICK ô "japan-product" (icon GitHub)  ← không click MySQL/Redis
            │
            └── Thanh trên: Deployments | Metrics | Settings | Variables
                    │
                    └── Settings
                            │
                            ├── Ô "Filter Settings..." → gõ: root
                            │
                            └── Mục Source
                                    └── Source Repo: ndt2011/japan-product
                                    └── Link: "Add Root Directory"  ← CLICK vào đây
                                            └── Gõ: project/api
```

Nếu **vẫn không thấy** → dùng **Cách B** (Bước 2.1): không cần Root Directory, repo đã có `Dockerfile` ở **thư mục gốc**.

---

## Bước 2 — Railway: Deploy Laravel API

### 2.1 Thêm service từ GitHub

1. Trong cùng project Railway → **+ New** → **GitHub Repo**
2. Chọn repo **`ndt2011/japan-product`**
3. Service mới tạo → **Settings** → mục **Source** (xem mục **“Không thấy Root Directory?”** bên dưới nếu UI khác)

**Cách A — có Root Directory (ưu tiên):**

- **Root Directory**: `project/api`

**Cách B — không tìm thấy Root Directory:**

- Để trống Root Directory (build từ repo gốc)
- Repo có `Dockerfile` + `railway.toml` **ở thư mục gốc** — Railway tự build Laravel trong `project/api`
- **Build** → Builder = **Dockerfile**

Repo đã có `project/api/railway.toml`:

```toml
startCommand = "php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=${PORT:-8000}"
healthcheckPath = "/api/health"
```

> **Lưu ý**: `migrate --force` chạy mỗi lần deploy. **Không** tự seed — phải chạy `db:seed` thủ công (Bước 3).

### 2.2 Generate domain public

1. Service API → **Settings** → **Networking**
2. **Generate Domain** → copy URL, ví dụ `https://japan-product-api-production-xxxx.up.railway.app`
3. Điền vào memo → cột **API public URL**

### 2.3 Tạo APP_KEY (trên máy local)

```powershell
cd project\api
php artisan key:generate --show
```

Copy chuỗi `base64:...` — **không commit** vào git.

### 2.4 Biến môi trường Railway (service API)

Vào service API → **Variables** → **RAW Editor** — dán và **sửa placeholder**:

```env
APP_NAME=JapanProductAPI
APP_ENV=staging
APP_KEY=base64:THAY_BANG_KEY_TU_BUOC_2_3
APP_DEBUG=false
APP_TIMEZONE=Asia/Tokyo
APP_URL=https://THAY-BANG-API-DOMAIN.up.railway.app

LOG_CHANNEL=stderr
LOG_LEVEL=info

DB_CONNECTION=mysql
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_DATABASE=${{MySQL.MYSQLDATABASE}}
DB_USERNAME=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}

CACHE_STORE=database
QUEUE_CONNECTION=sync
SESSION_DRIVER=database
REDIS_URL=${{Redis.REDIS_URL}}

SANCTUM_TOKEN_EXPIRATION=1440
SANCTUM_STATEFUL_DOMAINS=THAY-BANG-VERCEL-DOMAIN.vercel.app

FILESYSTEM_DISK=local
PRODUCT_IMAGE_DISK=public
# Ảnh persistent trên Railway → PRODUCT_IMAGE_DISK=r2 + R2_* (xem r2-cloudflare-setup.md)

MAIL_MAILER=log
MAIL_FROM_ADDRESS=noreply@staging.local
MAIL_FROM_NAME=JapanProduct Staging

OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
AI_SEARCH_LIMIT=15

# Rakuten Ichiba — AI Khám phá web (docs/devops/rakuten-api-setup.md)
RAKUTEN_APPLICATION_ID=
RAKUTEN_ACCESS_KEY=
RAKUTEN_ORIGIN_URL=https://japan-product.vercel.app
PRODUCT_MARKUP_PERCENT=30
```

**Cách reference biến Railway:** tên service MySQL/Redis trên dashboard phải khớp — nếu đổi tên service, sửa `${{TênService.MYSQLHOST}}` cho đúng. Railway UI có nút **Add Reference** để chọn tự động.

> **`APP_KEY`**: tạo trên máy local (`php artisan key:generate --show`), **không** chạy `key:generate` trong Railway Shell — container không có file `.env`.

| Biến | Khi nào điền |
|------|--------------|
| `SANCTUM_STATEFUL_DOMAINS` | Sau Bước 4 (domain Vercel), **không** có `https://` |
| `OPENAI_API_KEY` | Bắt buộc nếu dùng AI (enrichment + catalog search) |
| `RAKUTEN_*` | Bắt buộc nếu dùng tab **Khám phá web** |
| `RAKUTEN_ORIGIN_URL` | Khớp domain Vercel đã đăng ký Rakuten — **không** đặt trên Vercel |

### 2.5 Deploy & kiểm tra health

1. **Deployments** → đợi build **Success**
2. Mở trình duyệt hoặc PowerShell:

```powershell
curl https://THAY-BANG-API-DOMAIN.up.railway.app/api/health
```

Kỳ vọng JSON có `status` ok / success.

- [ ] Health check pass → tick memo

**Lỗi thường gặp:**

| Triệu chứng | Cách xử lý |
|-------------|------------|
| **`railpack process exited with an error`** | Xem **Deploy Logs** (Build hay Start?). Thường do: (1) Root ≠ `project/api`, (2) thiếu `APP_KEY`, (3) `migrate` fail vì DB chưa link, (4) Railpack/Nixpacks lỗi → repo dùng **Dockerfile** (`project/api/Dockerfile`) |
| Build fail composer | Root = `project/api`; xem log `composer install` |
| 502 / crash loop | Thiếu `APP_KEY` hoặc DB reference sai |
| Migration fail | MySQL Active; `DB_HOST` = reference `${{MySQL.MYSQLHOST}}` |
| Redis / ext-redis | Staging dùng `CACHE_STORE=database`, `QUEUE_CONNECTION=sync`, `SESSION_DRIVER=database` (template đã cập nhật) |
| Seed lỗi `Connection: sqlite` | Thiếu `DB_CONNECTION=mysql` + `DB_*` reference MySQL trên Railway → Redeploy → seed lại |
| Seed lỗi `admins.password NOT NULL` | Pull code mới (AdminSeeder đã sửa) hoặc set password trong seeder |

**Sửa nhanh trên Railway (không đợi code):**

1. Service API → **Settings** → **Root Directory** = `project/api`
2. **Build** → Builder = **Dockerfile** (sau khi pull code mới) hoặc tạm **Railpack** + Custom Start Command:
   ```
   php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=$PORT
   ```
3. **Variables** — bắt buộc có `APP_KEY`, `APP_URL`, `DB_*` (reference MySQL)
4. **Redeploy**

---

## Bước 3 — Seed dữ liệu trên Railway

`railway.toml` chỉ chạy `migrate`, **chưa seed** → login staging sẽ **401** nếu bỏ qua bước này.

### Cách A — Railway Dashboard (khuyến nghị)

1. Service API → tab **Settings** hoặc **Deployments**
2. Mở **Shell** / **Run command** (tùy UI Railway)
3. Chạy:

```bash
php artisan db:seed --force
```

### Cách B — Railway CLI

```powershell
npm install -g @railway/cli
railway login
cd project\api
railway link    # chọn project + service API
railway run php artisan db:seed --force
```

### Cách C — Embed sản phẩm (khi có OpenAI key)

```bash
railway run php artisan products:embed
```

- [ ] Seed xong → thử login API trực tiếp:

```powershell
$body = '{"login_id":"admin","password":"Admin@123"}'
Invoke-RestMethod -Uri "https://API-DOMAIN.up.railway.app/api/auth/login" -Method POST -Body $body -ContentType "application/json"
```

Kỳ vọng: `success: true` + có `token`.

---

## Bước 4 — Vercel: Deploy Frontend

### 4.1 Import project

1. https://vercel.com/new
2. **Import** repo `ndt2011/japan-product`
3. **Configure Project**:

| Cài đặt | Giá trị |
|---------|---------|
| Framework Preset | Next.js |
| Root Directory | `project/frontend` |
| Build Command | `npm run build` (mặc định) |
| Install Command | `npm ci` |

Repo root có `vercel.json` hỗ trợ build — Vercel vẫn cần **Root Directory** = `project/frontend`.

### 4.2 Environment Variables

**Settings** → **Environment Variables** → thêm:

| Key | Value | Environment |
|-----|-------|-------------|
| `API_URL` | `https://API-DOMAIN.up.railway.app/api` | Production, Preview, Development |
| `NEXT_PUBLIC_APP_NAME` | `Hệ thống quản lý hàng hóa Nhật-Việt` | Production (tùy chọn) |

> **Quan trọng**: `API_URL` phải có `/api` ở cuối, khớp route Laravel.

### 4.3 Deploy

1. **Deploy** (lần đầu) hoặc **Redeploy** sau khi thêm env
2. Copy domain, ví dụ `https://japan-product.vercel.app`
3. Điền **Frontend URL** vào memo

### 4.4 Cập nhật lại Railway (nếu chưa set Vercel domain)

Quay lại Railway service API → Variables:

```env
SANCTUM_STATEFUL_DOMAINS=japan-product.vercel.app
```

(Redploy API nếu Railway yêu cầu restart.)

---

## Bước 5 — Kiểm tra staging end-to-end

### 5.1 Login trên Vercel

1. Mở `https://<vercel-app>.vercel.app/login`
2. Đăng nhập: `admin` / `Admin@123`

| Lỗi UI | Nguyên nhân | Fix |
|--------|-------------|-----|
| **API_OFFLINE (503)** | Sai `API_URL` trên Vercel hoặc API Railway down | Kiểm tra env + health |
| **401** | Chưa seed trên Railway | Bước 3 |
| **CORS** (hiếm) | BFF gọi server-side — thường không lỗi CORS | Kiểm tra `API_URL` |

### 5.2 Checklist module staging

| # | Module | URL staging | ☐ |
|---|--------|-------------|---|
| 1 | Login / logout | /login | |
| 2 | Products | /products | |
| 3 | AI center — Khám phá web Rakuten | /ai-center | Từ khóa `コラーゲン`, có ảnh |
| 4 | AI candidates (admin) | /admin/ai-candidates | |
| 5 | Orders | /orders | |
| 6 | Shipments | /shipments | |

### 5.3 Ghi nhận kết quả

Cập nhật bảng memo đầu file: ngày deploy, URL, tick các mục OK.

---

## Bước 6 — Tùy chọn sau staging

### 6.1 GitHub Actions CI (đã có)

File: `.github/workflows/ci.yml` — chạy khi push/PR `main`:

- PHPUnit (sqlite `:memory:`)
- `npm run build` frontend

Xem: https://github.com/ndt2011/japan-product/actions

### 6.2 Auto-deploy (DEV-14)

Cần secrets GitHub:

| Secret | Lấy từ đâu |
|--------|------------|
| `RAILWAY_TOKEN` | Railway → Account Settings → Tokens |
| `VERCEL_TOKEN` | Vercel → Account → Tokens |
| `VERCEL_ORG_ID` | Vercel project Settings |
| `VERCEL_PROJECT_ID` | Vercel project Settings |

Chi tiết mẫu workflow: `docs/sa/devops/deploy_guide.md` PHẦN 4.

### 6.3 Branch protection (DEV-15)

GitHub repo → **Settings** → **Branches** → Add rule `main`:

- [ ] Require pull request before merging
- [ ] Require status checks: `Laravel API Tests`, `Next.js Build`

---

## File template env (copy nhanh)

| File | Mục đích |
|------|----------|
| [staging-env-railway.template.env](./staging-env-railway.template.env) | Dán vào Railway RAW editor |
| [staging-env-vercel.template.env](./staging-env-vercel.template.env) | Tham chiếu biến Vercel |

---

## Troubleshooting tổng hợp

### Local

| Vấn đề | Giải pháp |
|--------|-----------|
| Login 401 local | `php artisan db:seed` — xem `project/api/README.md` |
| Login 503 local | Chạy `php artisan serve`; kiểm tra `API_URL` trong `.env.local` |
| Mất user sau `php artisan test` | Đã fix — test dùng `:memory:`; nếu cũ: seed lại |

### Staging

| Vấn đề | Giải pháp |
|--------|-----------|
| API 502 | Logs Railway; `APP_KEY`, DB |
| FE 503 | `API_URL` trên Vercel; redeploy FE sau đổi env |
| FE 401 | `db:seed` trên Railway |
| Ảnh SP mất sau redeploy | Bật R2: `PRODUCT_IMAGE_DISK=r2` — [r2-cloudflare-setup.md](./r2-cloudflare-setup.md) |
| Ảnh SP không hiện | Kiểm tra `GET /api/health` → `r2_configured`; upload lại sau khi bật R2 |
| Email không gửi | Staging dùng `MAIL_MAILER=log` — xem Railway logs |
| AI M0206 — IP Rakuten | Railway Shell: `curl -s https://api.ipify.org` → thêm IP vào Rakuten Developers |
| AI M0207 — Origin | `RAKUTEN_ORIGIN_URL=https://japan-product.vercel.app` trên Railway |
| AI M0202 — timeout | `QUEUE_CONNECTION=sync`; đợi ~90s |
| `key:generate` lỗi Shell | Tạo `APP_KEY` local → dán Railway Variables |

---

## Bước 5b — Rakuten AI (sau login OK)

Chi tiết: [rakuten-api-setup.md](./rakuten-api-setup.md)

1. Railway → service API → **Variables → RAW Editor** — thêm `RAKUTEN_*`, `OPENAI_API_KEY` (copy từ `project/api/.env` local)
2. Rakuten Developers → **許可されたWebサイト**: `https://japan-product.vercel.app`
3. Railway Shell: `curl -s https://api.ipify.org` → thêm IP vào **許可IPアドレス**
4. **Redeploy** API (sau đổi Variables)
5. Test: `/ai-center` → Khám phá web → `オメガ3` hoặc `コラーゲン`

- [ ] AI trả sản phẩm + ảnh + badge **Rakuten (giá thật)**

---

## Bước 5c — Cloudflare R2 (ảnh sản phẩm persistent)

Chi tiết: [r2-cloudflare-setup.md](./r2-cloudflare-setup.md)

1. Cloudflare → R2 → tạo bucket + API Token + bật **R2.dev public URL**
2. Railway → Variables:

```env
PRODUCT_IMAGE_DISK=r2
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_DEFAULT_REGION=auto
R2_BUCKET=tt-product-images
R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://pub-xxxxxxxx.r2.dev
```

3. **Redeploy** API
4. `GET /api/health` → `r2_configured: true`, `product_image_disk: "r2"`
5. Upload ảnh SP trên staging → URL bắt đầu bằng `R2_PUBLIC_URL`
6. Redeploy lại → ảnh vẫn hiển thị

- [ ] Ảnh không mất sau Railway redeploy

---

## Liên kết tài liệu liên quan

| File | Nội dung |
|------|----------|
| [staging-setup.md](./staging-setup.md) | Tóm tắt nhanh |
| [../tasks/devops-tasks.md](../tasks/devops-tasks.md) | Task DO-001 … DO-004 |
| [../tasks/STATUS.md](../tasks/STATUS.md) | Tiến độ dự án |
| [../sa/AI_Setup_Guide.md](../sa/AI_Setup_Guide.md) | OpenAI key staging |
| [rakuten-api-setup.md](./rakuten-api-setup.md) | Rakuten IP + env Railway/Vercel |
| [r2-cloudflare-setup.md](./r2-cloudflare-setup.md) | Cloudflare R2 ảnh SP trên Railway |
| [../../project/api/README.md](../../project/api/README.md) | API local + login |
| [../../project/api/railway.toml](../../project/api/railway.toml) | Start command Railway |

---

## Lịch sử memo

| Ngày | Hành động | Ghi chú |
|------|-----------|---------|
| 2026-06-07 | Tạo tài liệu | Sau login local OK, chuẩn bị DEV-12/13 |
| 2026-06-08 | Deploy staging + Rakuten AI | Login OK, AI Khám phá web Rakuten OK sau whitelist IP |
