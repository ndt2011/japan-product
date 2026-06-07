# Hướng dẫn cấu hình AI — Local & Staging

> **Cập nhật**: 2026-06-08  
> **Luồng A** ưu tiên **Rakuten Ichiba API** (ảnh + link thật) → GPT enrich. **Luồng B** tìm catalog nội bộ (embedding/keyword).

---

## 1. Hai luồng AI

| Luồng | Màn hình | API | Rakuten | OpenAI |
|-------|----------|-----|---------|--------|
| **A — Khám phá web** | `/ai-center` tab *Khám phá web* | `POST/GET /ai/search` | **Bắt buộc** (ảnh, giá, link) | Bắt buộc (enrich tên VN, category) |
| **B — Catalog nội bộ** | `/ai-center` tab *Tìm catalog* | `POST /ai/product-search` | Không dùng | Tùy chọn (semantic); không key → keyword |

Frontend **không** cần OpenAI/Rakuten key — chỉ gọi BFF → Laravel API.

---

## 2. Local — `project/api/.env`

```env
QUEUE_CONNECTION=sync

OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
AI_SEARCH_LIMIT=15

RAKUTEN_APPLICATION_ID=...
RAKUTEN_ACCESS_KEY=pk_...
RAKUTEN_ORIGIN_URL=http://localhost:3000
PRODUCT_MARKUP_PERCENT=30
```

**Rakuten local:** whitelist IP máy (`curl api.ipify.org`) + URL `http://localhost:3000` trên Rakuten Developers.

Chi tiết: [../devops/rakuten-api-setup.md](../devops/rakuten-api-setup.md)

---

## 3. Staging — Railway Variables

Service **`product`** → Variables → RAW Editor (không file `.env` trong container):

```env
QUEUE_CONNECTION=sync
OPENAI_API_KEY=sk-...
RAKUTEN_APPLICATION_ID=...
RAKUTEN_ACCESS_KEY=pk_...
RAKUTEN_ORIGIN_URL=https://japan-product.vercel.app
PRODUCT_MARKUP_PERCENT=30
```

**Lấy IP whitelist Rakuten:**

```
GET https://product-production-7e4e.up.railway.app/api/health?ip=1
→ data.outbound_ip
```

Template: [../devops/staging-env-railway.template.env](../devops/staging-env-railway.template.env)

---

## 4. Luồng A — Kiến trúc

```
POST /ai/search → session processing → job (afterResponse)
    → Rakuten Ichiba Search API (tối đa 10 SP)
    → OpenAI enrich (tên VN, category, cách dùng, mô tả)
    → GET /ai/search/{id} poll → completed
```

| Trường hợp | Kết quả |
|------------|---------|
| Rakuten OK | SP + ảnh + link + badge **Rakuten (giá thật)** |
| Rakuten IP chưa whitelist | **M0206** — không trả link/ảnh giả |
| Rakuten Origin sai | **M0207** |
| Job > 90s | **M0202** |
| Không có SP | **M0201** |

---

## 5. Luồng B — Catalog embedding

```bash
cd project/api
php artisan migrate
php artisan products:embed        # Cần OPENAI_API_KEY
php artisan products:embed --id=1
```

Test: tab **Tìm catalog nội bộ** hoặc `POST /api/ai/product-search`.

---

## 6. Kiểm tra health / cấu hình AI

```bash
# Cơ bản
curl https://<api>/api/health

# + IP outbound (Rakuten whitelist)
curl "https://<api>/api/health?ip=1"
```

Fields: `rakuten_configured`, `openai_configured`, `queue_connection`, `ai_search_result_limit`.

---

## 7. Hạn mức

- **10** sản phẩm / lần tìm (luồng A)
- **Không** giới hạn số lần tìm / ngày trong app
- Rakuten: **1 req/giây** / Application ID
- OpenAI: theo billing account

---

## 8. Lỗi thường gặp

| Triệu chứng | Cách sửa |
|-------------|----------|
| M0206 | `/api/health?ip=1` → whitelist IP trên Rakuten |
| M0207 | `RAKUTEN_ORIGIN_URL` khớp Vercel đã đăng ký |
| M0202 | `QUEUE_CONNECTION=sync`; đợi 90s |
| Treo processing | Queue database không worker → đổi `sync` |
| Amazon JP | **Chưa triển khai** — chỉ Rakuten thật |

---

## 9. Checklist

```
[ ] OPENAI_API_KEY + RAKUTEN_* trong .env / Railway
[ ] Rakuten: IP + URL đã đăng ký
[ ] QUEUE_CONNECTION=sync
[ ] /api/health?ip=1 → outbound_ip đã whitelist
[ ] /ai-center → Khám phá web → コラーゲン → có ảnh Rakuten
```
