# Môi trường Staging (Cloud) — Tổng hợp DevOps

> **Cập nhật**: 2026-06-08  
> **Repo**: https://github.com/ndt2011/japan-product (branch `main`)  
> **Trạng thái**: ✅ Railway API + MySQL · ✅ Vercel FE · ✅ Login · ✅ AI Rakuten search

Tài liệu **một file** ghi lại toàn bộ quá trình deploy staging, cấu hình hiện tại, vận hành và xử lý sự cố.

---

## 1. Kiến trúc

```
Internet
   │
   ├── [Vercel] Next.js 14 — project/frontend
   │      URL: https://<vercel-project>.vercel.app
   │      BFF: /api/auth/*, /api/proxy/*
   │      Env: API_URL → Railway
   │
   └── [Railway] Laravel 11 API — Dockerfile repo root
          URL: https://product-production-7e4e.up.railway.app
          Path API: /api/*
          │
          ├── MySQL 8 (Railway plugin)
          └── Redis 7 (Railway plugin — có thể chưa dùng)
```

**Luồng đăng nhập:**

```
Browser → Vercel /login
       → POST Vercel /api/auth/login (BFF)
       → POST Railway /api/auth/login
       → Token httpOnly cookie trên Vercel
```

Frontend **không** gọi Railway trực tiếp từ browser.

---

## 2. Thông tin môi trường (điền / cập nhật)

| Mục | Giá trị hiện tại |
|-----|------------------|
| **Railway Project** | `japan-product-staging` |
| **Railway service API** | `product` (GitHub) |
| **API URL** | https://product-production-7e4e.up.railway.app |
| **Health** | https://product-production-7e4e.up.railway.app/api/health |
| **MySQL** | Service `MySQL` trên Railway |
| **Redis** | Service `Redis` trên Railway |
| **Vercel Project** | `japan-product` |
| **Vercel URL** | https://japan-product.vercel.app |
| **Rakuten Origin** | `RAKUTEN_ORIGIN_URL=https://japan-product.vercel.app` (Railway Variables) |
| **GitHub** | `ndt2011/japan-product` |

---

## 3. Tài khoản hệ thống (sau seed)

| Login ID | Mật khẩu | Vai trò |
|----------|----------|---------|
| `admin` | `Admin@123` | Super Admin |
| `vn_company01` | `Company@123` | Chi nhánh VN |

**Seed chỉ account (DB sạch):**

```bash
php artisan migrate:fresh --force
php artisan db:seed --class=AuthOnlySeeder --force
```

> Seed **không** tạo sản phẩm/kho mẫu — dữ liệu nghiệp vụ thêm qua UI hoặc API.

---

## 4. Railway — Cấu hình service `product`

### 4.1 Source & Build

| Cài đặt | Giá trị |
|---------|---------|
| Repo | `ndt2011/japan-product` |
| Branch | `main` |
| Root Directory | Để trống (build từ repo gốc) |
| Builder | **Dockerfile** |
| Dockerfile | `/Dockerfile` (repo root — build `project/api` bên trong) |
| Start | `project/api/railway/start.sh` |

File liên quan:

- `Dockerfile` (repo root)
- `railway.toml` (repo root)
- `project/api/railway/start.sh`
- `project/api/bootstrap/railway-env.php` — map `MYSQL_URL` → Laravel

### 4.2 Variables (service `product`) — bắt buộc

```env
APP_ENV=staging
APP_DEBUG=false
APP_URL=https://product-production-7e4e.up.railway.app
APP_KEY=base64:...          # php artisan key:generate --show (local)

DB_CONNECTION=mysql
DB_URL=mysql://...          # Copy NGUYÊN MYSQL_URL từ service MySQL
```

**Quan trọng:** Biến phải thêm trên service **`product`**, không phải service MySQL.

**Cách lấy `DB_URL`:**

1. Service **MySQL** → Variables → Reveal **`MYSQL_URL`**
2. Copy chuỗi `mysql://root:pass@mysql.railway.internal:3306/railway`
3. Dán vào service **product** → `DB_URL`

**Không dùng** `MYSQL_PUBLIC_URL` (tốn egress).

**Tùy chọn (cache/queue đơn giản):**

```env
CACHE_STORE=database
QUEUE_CONNECTION=sync
SESSION_DRIVER=database
LOG_CHANNEL=stderr
```

**AI + Rakuten (bắt buộc nếu dùng tab Khám phá web):**

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
AI_SEARCH_LIMIT=15

RAKUTEN_APPLICATION_ID=...          # từ Rakuten Developers
RAKUTEN_ACCESS_KEY=pk_...           # từ Rakuten Developers
RAKUTEN_ORIGIN_URL=https://japan-product.vercel.app
PRODUCT_MARKUP_PERCENT=30
```

> Copy từ `project/api/.env` local → Railway **Variables → RAW Editor** (service **product**).  
> **Không** tạo file `.env` trong Railway Shell — `php artisan key:generate` chạy trên **máy local**: `php artisan key:generate --show`  
> Trên [Rakuten Developers](https://webservice.rakuten.co.jp/) bắt buộc whitelist **IP outbound Railway** + URL Vercel.  
> Chi tiết từng bước: [rakuten-api-setup.md](./rakuten-api-setup.md)

**Lấy IP Railway để whitelist Rakuten:**

```bash
# Railway Shell (service product)
curl -s https://api.ipify.org
```

### 4.3 Kiểm tra health

```json
GET /api/health
{
  "env": "staging",
  "db": "mysql",
  "db_host_set": true,
  "db_connection_env": "mysql"
}
```

Nếu `"db":"sqlite"` → `DB_URL` chưa vào container → sửa Variables + **Redeploy**.

### 4.4 Console — lệnh thường dùng

```bash
# Reset DB sạch — chỉ account
php artisan migrate:fresh --force
php artisan db:seed --class=AuthOnlySeeder --force

# Kiểm tra DB
php artisan tinker --execute="echo config('database.default');"
```

---

## 5. Vercel — Cấu hình frontend

### 5.1 Project settings

| Cài đặt | Giá trị |
|---------|---------|
| Root Directory | `project/frontend` |
| Framework | Next.js |
| Install Command | `npm install` (không dùng `npm ci` — lock file cross-platform) |
| Build Command | `npm run build` |

File: `project/frontend/vercel.json`

### 5.2 Environment Variables

| Key | Value | Environment |
|-----|-------|-------------|
| `API_URL` | `https://product-production-7e4e.up.railway.app/api` | **Production** (tối thiểu) |

Có thể thêm cùng biến cho Preview / Development (thêm 3 lần hoặc tick All).

### 5.3 Domain

- URL mặc định: `https://<project>.vercel.app`
- URL preview dài: `japan-product-xxx-teams.vercel.app` — promote Production hoặc thêm domain trong **Settings → Domains**

### 5.4 Sau deploy

Mở: `https://<vercel-domain>/login` → `admin` / `Admin@123`

| Lỗi UI | Nguyên nhân | Fix |
|--------|-------------|-----|
| 503 API_OFFLINE | Sai `API_URL` | Sửa env + Redeploy Vercel |
| 401 | Chưa seed Railway | `AuthOnlySeeder` trên Console |

---

## 6. Quá trình deploy đã thực hiện (timeline)

| Bước | Việc | Kết quả |
|------|------|---------|
| 1 | Railway: MySQL + Redis + service GitHub | 3 service Online |
| 2 | Lỗi Railpack / Root Directory | Chuyển **Dockerfile** repo root |
| 3 | `db: sqlite` — thiếu env MySQL | `DB_URL` = copy `MYSQL_URL` |
| 4 | Healthcheck fail — migrate lỗi | `start.sh` vẫn start server khi migrate fail |
| 5 | Migration FK `integer` vs `bigint` | Sửa `unsignedBigInteger` — commit `0b9673d` |
| 6 | Seed / migrate lộn xộn | `migrate:fresh` + `AuthOnlySeeder` |
| 7 | Vercel `npm ci` fail | Đổi `npm install` — commit `8b250c1` |
| 8 | Vercel deploy + `API_URL` | Login UI staging OK |
| 9 | Rakuten + OpenAI env trên Railway | Variables RAW Editor |
| 10 | Rakuten whitelist IP Railway | Fix M0206 |
| 11 | AI Khám phá web — sản phẩm + ảnh Rakuten | ✅ OK |

---

## 7. Sự cố & cách xử lý

### 7.1 `railpack process exited`

- Set Root `project/api` **hoặc** dùng Dockerfile repo root
- Builder = Dockerfile

### 7.2 Health: `db: sqlite`, `db_host_set: false`

- Variables trên service **`product`**, không phải MySQL
- Dùng `DB_CONNECTION=mysql` + `DB_URL=<MYSQL_URL copy tay>`
- **Redeploy** sau khi save Variables

### 7.3 Healthcheck failure (~5 phút)

- Migrate MySQL lỗi → container không listen
- Xem **Deploy Logs** → sửa `DB_URL` → Redeploy
- Sau đó: `migrate:fresh` trên Console

### 7.4 `Table already exists` / `admins doesn't exist`

- DB lộn xộn → `php artisan migrate:fresh --force` rồi seed lại

### 7.5 FK incompatible (3780)

- Đã fix migration — pull `main` mới nhất

### 7.6 Login API 502

- Railway restart tạm thời — thử lại sau 1–2 phút
- Test: `curl` hoặc `/api/health`

### 7.7 Vercel build `npm ci` EUSAGE

- `installCommand`: `npm install` trong `vercel.json`

### 7.8 AI Rakuten — M0206 (IP chưa cho phép)

- Triệu chứng: *"Rakuten API chưa cho phép IP máy bạn"*
- Nguyên nhân: IP **outbound Railway** chưa có trong Rakuten **許可IPアドレス**
- Fix: Railway Shell → `curl -s https://api.ipify.org` → thêm IP vào Rakuten Developers → Lưu (không cần redeploy)

### 7.9 AI Rakuten — M0207 (Origin sai)

- `RAKUTEN_ORIGIN_URL=https://japan-product.vercel.app` trên Railway
- Khớp **許可されたWebサイト** trên Rakuten

### 7.10 AI — M0202 (quá thời gian)

- Đảm bảo `QUEUE_CONNECTION=sync` trên Railway
- Poll frontend chờ tối đa ~90s (Rakuten + GPT enrichment)

### 7.11 `php artisan key:generate` lỗi trong Railway Shell

- Container không có `/app/.env` — bình thường
- Tạo key trên máy dev → dán `APP_KEY` vào Railway Variables

---

## 8. Test nhanh (PowerShell — máy dev)

```powershell
# Health
Invoke-RestMethod -Uri "https://product-production-7e4e.up.railway.app/api/health"

# Login (dùng curl ổn định hơn trên Windows)
curl.exe -s -X POST "https://product-production-7e4e.up.railway.app/api/auth/login" `
  -H "Content-Type: application/json" `
  -d "{\"login_id\":\"admin\",\"password\":\"Admin@123\"}"
```

---

## 9. CI/CD & bước tiếp theo

| Task | Trạng thái |
|------|------------|
| `.github/workflows/ci.yml` | ✅ PHPUnit + FE build |
| Branch protection `main` | 📋 Chưa |
| Auto-deploy Railway/Vercel | 📋 Chưa (cần tokens) |
| Production VPS (ConoHa) | 📋 Sprint 7 |

---

## 10. File tham chiếu trong repo

| File | Mục đích |
|------|----------|
| [ENV_LOCAL.md](./ENV_LOCAL.md) | Môi trường local |
| [STAGING_DEPLOY_MEMO.md](./STAGING_DEPLOY_MEMO.md) | Checklist deploy từng bước |
| [railway-mysql-variables.md](./railway-mysql-variables.md) | Gắn MySQL + reset DB |
| [staging-env-railway.template.env](./staging-env-railway.template.env) | Template env Railway |
| [staging-env-vercel.template.env](./staging-env-vercel.template.env) | Template env Vercel |
| [rakuten-api-setup.md](./rakuten-api-setup.md) | Rakuten IP + env staging/local |
| `Dockerfile` | Build API monorepo |
| `project/frontend/vercel.json` | Build FE |

---

## 11. Lịch sử cập nhật memo

| Ngày | Sự kiện |
|------|---------|
| 2026-06-07 | Deploy Railway + Vercel staging lần đầu |
| 2026-06-07 | MySQL `DB_URL`, health `db:mysql` |
| 2026-06-07 | Vercel build + login UI |
| 2026-06-07 | `AuthOnlySeeder` — DB sạch chỉ account |
| 2026-06-08 | Rakuten AI search staging OK — IP Railway whitelist |
| 2026-06-08 | Railway Variables: RAKUTEN_*, OPENAI, QUEUE_CONNECTION=sync |
