# Quy trình dạy AI tìm kiếm catalog (Luồng B)

> **Ngày**: 2026-06-08  
> **Trạng thái**: ✅ Đã triển khai code + FE  
> **Liên quan**: [ai-search-improvement.md](./ai-search-improvement.md) · [AI_Setup_Guide.md](../AI_Setup_Guide.md) · [AI_Search_Implementation.md](../AI_Search_Implementation.md)

---

## 1. Mục đích

User tìm bằng **tiếng Việt** (`"thuốc bổ gan"`, `"vitamin c nhật"`) nhưng catalog chủ yếu tên **Nhật/Anh**.  
**Dạy AI** = chuẩn bị dữ liệu + prompt để hệ thống hiểu cả hai phía:

| Lớp | Câu hỏi | Cách dạy |
|-----|---------|----------|
| **Catalog** | Sản phẩm có mô tả tiếng Việt chưa? | `name_vi`, `description_vi` + embed |
| **Query** | User gõ tiếng Việt — AI hiểu sang Nhật/Anh? | Few-shot trong `QueryExpansionService` |
| **UI** | User biết gõ gì? | Gợi ý tìm kiếm tab *Tìm catalog* |

---

## 2. Sơ đồ tổng thể

```
┌─────────────────────────────────────────────────────────────────┐
│  BƯỚC A — Dạy CATALOG (một lần / khi thêm SP mới)               │
├─────────────────────────────────────────────────────────────────┤
│  Sản phẩm JP/EN  →  products:generate-vi  →  name_vi + mô tả VN │
│                  →  (hoặc Admin nhập tay form "Tên VN")          │
│                  →  products:embed --force  →  vector embedding │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  BƯỚC B — Dạy QUERY (few-shot trong code, cache 1h)            │
├─────────────────────────────────────────────────────────────────┤
│  User: "thuốc bổ gan nhật"                                       │
│       → QueryExpansionService (GPT + ví dụ mẫu)                  │
│       → "thuốc bổ gan nhật liver supplement 肝臓サプリ ..."     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  BƯỚC C — TÌM KIẾM (mỗi lần user search)                        │
├─────────────────────────────────────────────────────────────────┤
│  Embed query đã mở rộng  +  cosine similarity trên products      │
│  + keyword LIKE trên name_vi / product_name_jp (hybrid 70/30)   │
│  → POST /api/ai/product-search → expanded_query + search_mode   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Quy trình chi tiết (OPS / Admin)

### Bước 0 — Điều kiện

- `OPENAI_API_KEY` trên Railway (service `product`)
- Đã có sản phẩm trong bảng `products` (từ seed, duyệt AI luồng A, hoặc nhập tay)
- Migration `name_vi`, `description_vi`, `embedding` đã chạy (`migrate:status` → Ran)

### Bước 1 — Dạy catalog: sinh tên tiếng Việt

**Mục tiêu:** Mỗi SP có `name_vi` + `description_vi` để embedding và keyword khớp query VN.

```bash
# Railway Shell hoặc local
cd project/api   # local only

php artisan products:generate-vi
# Chỉ SP chưa có name_vi. GPT dùng prompt có ví dụ:
#   肝臓サポート → "Viên uống bổ gan"
#   ビタミンC → "Vitamin C Nhật Bản"

# Một sản phẩm cụ thể:
php artisan products:generate-vi --id=5
```

**Cách thủ công (Admin):** Form sản phẩm → trường **Tên VN (AI search)** + mô tả VN.

### Bước 2 — Dạy catalog: embed vector

```bash
php artisan products:embed --force
# Gọi OpenAI text-embedding-3-small
# Text embed = JP + EN + name_vi + description_vi + category + ...
```

**Khi nào chạy lại `--force`:**

- Sau `products:generate-vi`
- Sau sửa `product_name`, `name_vi`, `description_vi`, category, supplier
- (Tùy chọn) Observer tự re-embed khi lưu SP — xem `ProductObserver` nếu bật

### Bước 3 — Dạy query (few-shot — không cần lệnh)

Prompt nằm trong code, deploy là có hiệu lực:

| File | Vai trò |
|------|---------|
| `project/api/app/Services/QueryExpansionService.php` | Few-shot: bổ gan, vitamin C, máy pha cà phê, collagen |
| `docs/sa/code/backend/Services/QueryExpansionService.php` | Bản tham chiếu trong docs |

Ví dụ few-shot trong system prompt:

```
Query: thuốc bổ gan nhật → ... liver supplement Japan 肝臓サプリ ...
Query: vitamin c nhật bản → ... ビタミンC DHC Fancl ...
```

Kết quả cache Redis/DB **1 giờ** theo `md5(query)`.

### Bước 4 — Kiểm tra trên UI

1. Login → **AI Product Center** → tab **Tìm catalog nội bộ**
2. Chọn gợi ý **Bổ gan** hoặc gõ `vitamin c nhật bản`
3. Xác nhận:
   - Có kết quả (`count > 0`)
   - Dòng **GPT mở rộng** khác query gốc
   - Badge **Hybrid** hoặc **Từ khóa**
   - Tên hiển thị ưu tiên `name_vi`

### Bước 5 — Kiểm tra API (tùy chọn)

```bash
# Lấy token admin
curl -s -X POST "https://product-production-7e4e.up.railway.app/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"login_id":"admin","password":"Admin@123"}'

curl -s -X POST "https://product-production-7e4e.up.railway.app/api/ai/product-search" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"query":"bổ gan","limit":10}'
```

Response mong đợi:

```json
{
  "success": true,
  "data": {
    "query": "bổ gan",
    "expanded_query": "bổ gan thuốc bổ gan nhật liver supplement 肝臓サプリ ...",
    "search_mode": "hybrid",
    "count": 1,
    "items": [{ "name_vi": "Viên uống bổ gan ...", ... }]
  }
}
```

---

## 4. Vai trò trong quy trình

| Vai trò | Việc |
|---------|------|
| **DevOps** | Set `OPENAI_API_KEY`, chạy Bước 1–2 trên Railway Shell sau deploy / khi có SP mới hàng loạt |
| **Admin JP** | Duyệt SP từ luồng A → sau đó OPS chạy `generate-vi` + `embed` |
| **Admin** | Sửa / bổ sung **Tên VN** trên form SP quan trọng |
| **User** | Dùng gợi ý tìm kiếm hoặc gõ tiếng Việt tự nhiên |

---

## 5. Luồng khi thêm sản phẩm mới

```
[Luồng A] Rakuten search → duyệt candidate → products
                    ↓
         products:generate-vi --id=<new_id>
                    ↓
         products:embed --id=<new_id>   # hoặc embed tự động nếu Observer bật
                    ↓
         User tìm catalog bằng tiếng Việt → OK
```

```
[Thủ công] Admin tạo SP → điền Tên VN → Lưu
                    ↓
         products:embed --id=<new_id>
```

---

## 6. Chế độ tìm kiếm (`search_mode`)

| Mode | Khi nào | Ghi chú |
|------|---------|---------|
| `hybrid` | Có `OPENAI_API_KEY` + SP đã embed | 70% semantic + 30% keyword |
| `keyword` | Không key hoặc chưa embed | LIKE trên `name_vi`, `product_name_jp`, ... |

Env: `AI_SEARCH_HYBRID_ENABLED=true` (mặc định).

---

## 7. Checklist hoàn tất “đã dạy AI”

```
[ ] OPENAI_API_KEY trên Railway
[ ] products:generate-vi (ít nhất 1 lần trên staging)
[ ] products:embed --force
[ ] /ai-center → Tìm catalog → "Bổ gan" có kết quả
[ ] Response có expanded_query ≠ query gốc (khi có OpenAI)
[ ] SP mới sau duyệt luồng A → chạy generate-vi + embed cho SP đó
```

---

## 8. File code tham chiếu

| Thành phần | File |
|------------|------|
| Sinh tên VN | `app/Console/Commands/GenerateVietnameseNames.php` |
| Embed | `app/Console/Commands/GenerateProductEmbeddings.php` |
| Mở rộng query | `app/Services/QueryExpansionService.php` |
| Tìm hybrid | `app/Services/ProductEmbeddingService.php` |
| API | `app/Http/Controllers/API/AiProductSearchController.php` |
| Gợi ý FE | `project/frontend/lib/ai-catalog-prompts.ts` |
| Panel FE | `project/frontend/components/screens/AICatalogSearchPanel.tsx` |
| Form Tên VN | `project/frontend/components/screens/ProductFormScreen.tsx` |

---

## 9. Lỗi thường gặp

| Triệu chứng | Nguyên nhân | Cách xử lý |
|-------------|-------------|------------|
| Luôn `search_mode: keyword` | Chưa embed hoặc không có OpenAI key | `products:embed --force` + kiểm tra env |
| `expanded_query` = query gốc | Không có `OPENAI_API_KEY` hoặc GPT lỗi | Health `openai_configured: true` |
| Tìm VN không ra SP Nhật | Chưa `generate-vi` | Chạy Bước 1 |
| Kết quả lệch | Catalog ít / chưa đủ `name_vi` | Admin bổ sung tên VN + re-embed |

---

## 10. Tài liệu liên quan

| Doc | Nội dung |
|-----|----------|
| [ai-search-improvement.md](./ai-search-improvement.md) | Phase 1–4 kỹ thuật, chi phí API |
| [AI_Setup_Guide.md](../AI_Setup_Guide.md) | Env local + staging, luồng A & B |
| [ENV_STAGING.md](../../devops/ENV_STAGING.md) | Lệnh Shell trên Railway |
| [SERVER_CURRENT.md](../../devops/SERVER_CURRENT.md) | Checklist deploy + test UI |
