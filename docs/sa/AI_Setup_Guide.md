# Hướng dẫn cấu hình AI — Local & Production

> **Cập nhật**: 2026-06-07  
> **Không cần OpenAI key** để dev cơ bản — hệ thống tự dùng mock/keyword fallback.

---

## 1. Hai luồng AI cần gì?

| Luồng | Màn hình | API | Cần `OPENAI_API_KEY`? |
|-------|----------|-----|------------------------|
| **A — Khám phá web** | `/ai-center` tab *Khám phá web* | `POST /ai/search` | Không bắt buộc (mock catalog) · Có key → GPT gợi ý SP |
| **B — Catalog nội bộ** | `/ai-center` tab *Tìm catalog* | `POST /ai/product-search` | Không bắt buộc (tìm theo từ khóa) · Có key + embed → semantic |

**Frontend không cần OpenAI key** — chỉ gọi BFF → Laravel API.

---

## 2. Local — File cần sửa

### Backend (bắt buộc chạy API)

**File**: `project/api/.env`

```env
# === AI (thêm vào cuối file) ===
OPENAI_API_KEY=sk-proj-xxxxxxxx          # Để TRỐNG = mock/keyword (dev OK)
OPENAI_MODEL=gpt-4o-mini                 # Luồng A — chat tìm SP
OPENAI_EMBEDDING_MODEL=text-embedding-3-small   # Luồng B — vector
AI_SEARCH_LIMIT=15

# Queue — luồng A chạy job tìm kiếm
QUEUE_CONNECTION=sync                    # Đơn giản nhất local (job chạy ngay)
# Hoặc: database + php artisan queue:work
```

| Giá trị `QUEUE_CONNECTION` | Khi nào dùng |
|----------------------------|--------------|
| `sync` | **Khuyến nghị local** — không cần Redis, job AI chạy đồng bộ |
| `database` | Cần `php artisan queue:work` terminal riêng |
| `redis` | Cần Redis chạy trên máy |

### Frontend (chỉ URL API)

**File**: `project/frontend/.env.local`

```env
API_URL=http://localhost:8000/api
```

Không có biến OpenAI ở frontend.

---

## 3. Lấy OpenAI API Key

1. Đăng nhập https://platform.openai.com  
2. **API keys** → **Create new secret key**  
3. Copy key dạng `sk-proj-...`  
4. Dán vào `project/api/.env` → `OPENAI_API_KEY=sk-proj-...`  
5. Restart API: `Ctrl+C` rồi `php artisan serve`

> **Không commit** `.env` lên Git. Key chỉ nằm local hoặc Railway Secrets.

---

## 4. Sau khi có key — Luồng B (semantic search)

```bash
cd project/api

# 1. Migrate (cột embedding trên products)
php artisan migrate

# 2. Tạo vector cho toàn bộ sản phẩm (tốn ~$0.0001/SP)
php artisan products:embed

# 3. Embed lại 1 sản phẩm
php artisan products:embed --id=1

# 4. Embed lại tất cả
php artisan products:embed --force
```

Test API:

```bash
# Lấy token sau login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"login_id":"admin","password":"Admin@123"}'

curl -X POST http://localhost:8000/api/ai/product-search \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"query":"collagen nhật bản","limit":15}'
```

---

## 5. Luồng A — Khám phá web

| `OPENAI_API_KEY` | Hành vi |
|------------------|---------|
| Trống | Mock catalog (collagen, vitamin, v.v.) — đủ test UI |
| Có key | Gọi GPT-4o-mini, fallback mock nếu lỗi |

`QUEUE_CONNECTION=sync` → không cần `queue:work`.

Test trên UI: http://localhost:3000/ai-center → tab **Khám phá web** → gõ `コラーゲン`.

---

## 6. Production (Railway)

**Railway** → project API → **Variables**:

```
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
AI_SEARCH_LIMIT=15
QUEUE_CONNECTION=database   # hoặc redis
```

Sau deploy:

```bash
railway run php artisan migrate --force
railway run php artisan products:embed
```

**Vercel** (frontend) chỉ cần:

```
API_URL=https://tt-api.railway.app/api
```

Chi tiết: `docs/sa/devops/deploy_guide.md`

---

## 7. Checklist nhanh

```
[ ] project/api/.env có APP_KEY (php artisan key:generate)
[ ] DB migrate --seed
[ ] php artisan serve → :8000
[ ] project/frontend/.env.local → API_URL=http://localhost:8000/api
[ ] npm run dev → :3000
[ ] (Tùy chọn) OPENAI_API_KEY trong .env
[ ] (Tùy chọn) php artisan products:embed
```

---

## 8. Lỗi thường gặp

| Triệu chứng | Nguyên nhân | Cách sửa |
|-------------|-------------|----------|
| AI Center "API_OFFLINE" | Backend không chạy | `php artisan serve` |
| **Đăng nhập 401** | DB mất user sau `php artisan test` (cũ) | `php artisan db:seed` |
| **Đăng nhập 503** | API không chạy | `php artisan serve` |
| Login OK nhưng AI 401 | Cookie/token | Đăng nhập lại |
| Catalog luôn M0201 | Không có SP khớp từ khóa | `php artisan db:seed` · thử `collagen` |
| `products:embed` báo lỗi | Chưa có OPENAI_API_KEY | Thêm key vào `.env` |
| Luồng A treo "Đang tìm" | Queue database nhưng không có worker | Đổi `QUEUE_CONNECTION=sync` |
| Embedding tốn tiền | Gọi embed nhiều lần | Chỉ `--force` khi cần |
