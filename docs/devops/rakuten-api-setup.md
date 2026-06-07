# Rakuten Ichiba API — Cấu hình (Local + Staging)

> **Cập nhật**: 2026-06-08 · Đã xác nhận OK trên staging Railway + Vercel  
> Đăng ký app: https://webservice.rakuten.co.jp/

---

## 1. Tổng quan

Luồng **AI Center → Khám phá web**:

```
Browser (Vercel) → Railway API → Rakuten Ichiba API (ảnh + link thật)
                              → OpenAI GPT (enrich: tên VN, category, cách dùng)
```

| Thành phần | Vai trò |
|------------|---------|
| **Rakuten API** | Tìm sản phẩm, giá JPY, ảnh, link `item.rakuten.co.jp` |
| **OpenAI** | Bổ sung mô tả tiếng Việt — **không** tạo link/ảnh giả |
| **Railway API** | Gọi Rakuten — cần whitelist **IP outbound Railway** |

`RAKUTEN_ORIGIN_URL` đặt trên **backend API** (`project/api/.env` hoặc Railway Variables), **không** đặt trên Vercel.

---

## 2. Lấy key từ Rakuten Developers

| Key | Vị trí |
|-----|--------|
| **Application ID** | App detail → Application ID (UUID) |
| **Access Key** | App detail → Access Key (`pk_...`) |
| **Affiliate ID** | Tùy chọn |

---

## 3. Đăng ký trên Rakuten (bắt buộc)

Rakuten API **2026** chỉ chấp nhận request từ **IP** và **website** đã đăng ký.

### 3.1 Website / Application URL

Trong app settings trên https://webservice.rakuten.co.jp/:

| Mục (tiếng Nhật) | Giá trị staging |
|------------------|-----------------|
| **Application URL** | `https://japan-product.vercel.app/` |
| **許可されたWebサイト** (Allowed website) | `https://japan-product.vercel.app` |

Local dev thêm:

```
http://localhost:3000
```

### 3.2 IP public (許可IPアドレス)

**Staging Railway** — lấy IP outbound:

**Cách 1 (khuyến nghị):**

```
GET https://product-production-7e4e.up.railway.app/api/health?ip=1
→ data.outbound_ip
```

**Cách 2 — Railway Shell:**

```bash
curl -s https://api.ipify.org
```

Copy IP → Rakuten Developers → **許可IPアドレス** → Thêm → Lưu.

> **Tìm kiếm nhiều lần không đổi IP** — chỉ **redeploy/restart** mới có thể đổi (→ M0206).  
> Muốn IP cố định: Railway **Pro** Static Outbound IP hoặc VPS production.

**Local dev** — lấy IP máy bạn:

```powershell
(Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing).Content
```

> Mỗi lần đổi WiFi / 4G, IP local có thể đổi.

---

## 4. Biến môi trường

### 4.1 Local — `project/api/.env`

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
AI_SEARCH_LIMIT=15

RAKUTEN_APPLICATION_ID=your_application_id
RAKUTEN_ACCESS_KEY=pk_...
# RAKUTEN_AFFILIATE_ID=
RAKUTEN_ORIGIN_URL=http://localhost:3000

PRODUCT_MARKUP_PERCENT=30
QUEUE_CONNECTION=sync
```

> **Không commit** `.env` lên Git. Tham chiếu: `project/api/.env.example`

Restart API sau khi sửa:

```powershell
cd project\api
php artisan serve
```

### 4.2 Staging — Railway Variables (RAW Editor)

Railway → service **`product`** (API Laravel) → **Variables** → tab **ENV** → dán thêm sau block DB:

```env
APP_KEY="base64:..."   # Tạo LOCAL: php artisan key:generate --show (KHÔNG chạy trong Railway Shell — container không có .env)

CACHE_STORE="database"
QUEUE_CONNECTION="sync"
SESSION_DRIVER="database"
LOG_CHANNEL="stderr"

SANCTUM_STATEFUL_DOMAINS="japan-product.vercel.app"

OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4o-mini"
OPENAI_EMBEDDING_MODEL="text-embedding-3-small"
AI_SEARCH_LIMIT="15"

RAKUTEN_APPLICATION_ID="..."
RAKUTEN_ACCESS_KEY="pk_..."
RAKUTEN_ORIGIN_URL="https://japan-product.vercel.app"
PRODUCT_MARKUP_PERCENT="30"
```

Copy `OPENAI_API_KEY`, `RAKUTEN_*` từ `project/api/.env` local.

→ **Update Variables** → **Redeploy** service API.

Template đầy đủ: [staging-env-railway.template.env](./staging-env-railway.template.env)

---

## 5. Kiểm tra sau cấu hình

### Staging

1. https://japan-product.vercel.app/login → `admin` / `Admin@123`
2. **AI Center** → tab **Khám phá web (Rakuten/Amazon)**
3. Gõ từ khóa tiếng Nhật: `コラーゲン`, `オメガ3`, `ビタミンC`
4. Đợi ~30–60 giây

**Kết quả OK:**

- Danh sách sản phẩm có **ảnh**
- Badge **Rakuten (giá thật)**
- Link `item.rakuten.co.jp` mở được
- Giá ¥ hiển thị

### Local

1. http://localhost:3000 → AI Center → Khám phá web
2. Cùng từ khóa như trên

---

## 6. Mã lỗi & xử lý

| Mã UI | Rakuten / nguyên nhân | Cách sửa |
|-------|----------------------|----------|
| **M0206** | `CLIENT_IP_NOT_ALLOWED` — IP server chưa whitelist | Shell Railway: `curl api.ipify.org` → thêm IP vào Rakuten |
| **M0207** | Origin/Referer sai | `RAKUTEN_ORIGIN_URL` khớp **許可されたWebサイト** |
| **M0202** | Job AI quá thời gian | Kiểm tra `QUEUE_CONNECTION=sync`; đợi tối đa 90s |
| **M0201** | Không có kết quả | Đổi từ khóa tiếng Nhật; kiểm tra key Rakuten |
| Không ảnh / link giả | Rakuten fail, GPT fallback cũ | Đã tắt — chỉ Rakuten trả ảnh/link thật |

---

## 7. Checklist nhanh (staging đã chạy OK)

- [x] Railway Variables: `RAKUTEN_*`, `OPENAI_API_KEY`, `QUEUE_CONNECTION=sync`
- [x] Rakuten: URL `https://japan-product.vercel.app` đã đăng ký
- [x] Rakuten: IP outbound Railway đã whitelist
- [x] Redeploy API sau khi đổi Variables
- [x] Test AI Center — có sản phẩm Rakuten + ảnh

---

## 8. Hạn mức tìm kiếm (quota)

| Lớp | Giới hạn | Reset |
|-----|----------|-------|
| **App** | Tối đa **10** SP / lần tìm; **không** giới hạn số lần/ngày | Mỗi lần bấm Tìm |
| **Chờ kết quả** | Poll tối đa **~90 giây** / lần (M0202) | Tìm lại ngay |
| **Rakuten API** | **1 request/giây** / Application ID | Quá nhanh → 429 → đợi ~1s |
| **Rakuten theo ngày** | Không có quota ngày chính thức | — |
| **OpenAI** | Theo tài khoản billing (credit + rate limit) | Xem platform.openai.com |

---

## 9. File liên quan

| File | Nội dung |
|------|----------|
| [ENV_STAGING.md](./ENV_STAGING.md) | Tổng hợp staging |
| [staging-env-railway.template.env](./staging-env-railway.template.env) | Template copy Railway |
| [../sa/AI_Setup_Guide.md](../sa/AI_Setup_Guide.md) | OpenAI + queue |
| `project/api/config/services.php` | Đọc `RAKUTEN_ORIGIN_URL` |
