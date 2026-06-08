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

## 5. Luồng B — Catalog + quy trình dạy AI tiếng Việt

> **Quy trình đầy đủ (OPS / Admin):** [amendments/ai-catalog-teaching-process.md](./amendments/ai-catalog-teaching-process.md)

### Tóm tắt 3 bước dạy

| Bước | Lệnh / hành động | Dạy gì |
|------|------------------|--------|
| **1. Catalog** | `php artisan products:generate-vi` | GPT sinh `name_vi` + `description_vi` (few-shot dịch SP) |
| **2. Vector** | `php artisan products:embed --force` | Embed JP + EN + VN vào `products.embedding` |
| **3. Query** | (tự động khi search) | `QueryExpansionService` few-shot mở rộng query VN → Nhật/Anh |

```bash
cd project/api
php artisan migrate

php artisan products:generate-vi
php artisan products:embed --force
```

Mỗi lần user search: query → **mở rộng** → hybrid search → response có `expanded_query`, `search_mode` (`hybrid` | `keyword`).

**UI:** `/ai-center` → tab **Tìm catalog** — gợi ý *bổ gan*, *vitamin c nhật bản*, *collagen*.

Test API: `POST /api/ai/product-search` body `{"query":"bổ gan","limit":10}`.

---

## 6. Kiểm tra health / cấu hình AI

```bash
# Cơ bản
curl https://<api>/api/health

# + IP outbound (Rakuten whitelist)
curl "https://<api>/api/health?ip=1"
```

Fields: `rakuten_configured`, `openai_configured`, `queue_connection`, `ai_search_result_limit`, `product_image_disk`, `r2_configured`.

**R2 / Railway Bucket** (ảnh sản phẩm):

```env
PRODUCT_IMAGE_DISK=r2
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=...
R2_ENDPOINT=...
```

Chi tiết: [../devops/r2-cloudflare-setup.md](../devops/r2-cloudflare-setup.md)

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

## 9. Checklist staging OPS

```bash
# Railway Shell — KHÔNG chạy migrate thủ công nếu deploy đã auto-migrate
php artisan migrate:status   # tất cả Ran

# Sau migrate OK — embedding catalog (luồng B)
php artisan products:generate-vi
php artisan products:embed --force

# Seed chi nhánh (nếu DB mới)
php artisan db:seed --class=BranchSeeder
```

```
[ ] OPENAI_API_KEY + RAKUTEN_* trong Railway Variables
[ ] PRODUCT_IMAGE_DISK=r2 + R2_* (Railway Bucket)
[ ] /api/health → r2_configured: true, product_image_disk: "r2"
[ ] Rakuten: IP + URL đã đăng ký
[ ] QUEUE_CONNECTION=sync
[ ] products:generate-vi + products:embed --force
[ ] /ai-center → Khám phá web → có ảnh Rakuten
[ ] Login hn_manager / Manager@123 → tạo đơn chi nhánh OK
```

> **Lưu ý migrate**: `stock_movements already exists` khi chạy migrate thủ công là bình thường — `railway/start.sh` đã chạy migrate trên deploy. Dùng `migrate:status` để kiểm tra.
