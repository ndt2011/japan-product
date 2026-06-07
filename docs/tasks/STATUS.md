# Trạng thái dự án & Việc cần làm tiếp

> **Cập nhật**: 2026-06-08  
> **Repo**: https://github.com/ndt2011/japan-product  
> **Staging**: https://japan-product.vercel.app · API https://product-production-7e4e.up.railway.app

---

## Tóm tắt nhanh

| Sprint | Mục tiêu | Tiến độ | Ghi chú |
|--------|----------|---------|---------|
| **S1** Auth & RBAC | Login, Remember Me, RBAC | **~65%** | REQ-003 RBAC schema |
| **S2** Sản phẩm | CRUD + ảnh | **~90%** | + name_vi cho AI search |
| **UI shell** | 13+ route SupplyFlow | **~85%** | StockIn/Inventory demo |
| **DevOps** | Railway + Vercel staging | **~85%** | ✅ Login + AI Rakuten OK |
| **S3** AI Search | Luồng A Rakuten + B catalog VN | **~95%** | Phase 1+2 amendment ✅ |
| **S4** Đơn hàng | CRUD + confirm + email | **~85%** | Resend production |
| **S5** Chuyến hàng | Gom đơn + status flow | **~75%** | Email batch chưa có |
| **S6–S7** | Chưa bắt đầu | **0%** | REQ-002 |

---

## ✅ Đã làm (2026-06-08)

### Luồng A — Rakuten (Khám phá web)
- Rakuten API + GPT enrich + auto pricing VND
- Staging OK sau whitelist IP
- `GET /api/health?ip=1` — lấy outbound IP

### Luồng B — Catalog search tiếng Việt (amendment Phase 1+2)
- Migration `name_vi`, `description_vi` trên `products`
- `QueryExpansionService` — GPT mở rộng query VN → đa ngôn ngữ
- `products:generate-vi` — sinh tên/mô tả VN bằng GPT
- API `POST /ai/product-search` trả `expanded_query`, `name_vi`, `ai_score`
- FE: form SP có field AI search; catalog panel hiện expanded query

### Chưa làm (theo docs amendment)
- **Phase 3** Hybrid FULLTEXT search
- **Phase 4** GPT re-ranking
- **Amazon JP** PA-API (DEV-28)
- **DEV-27** IP cố định production

---

## 📋 Việc DEV tiếp theo

| ID | Việc | Priority |
|----|------|----------|
| **OPS-01** | Staging: `php artisan migrate` + `products:generate-vi` + `products:embed --force` | P0 |
| **DEV-27** | Railway Pro Static IP hoặc VPS | P1 |
| **DEV-28** | Amazon JP PA-API | P1 |
| **DEV-29** | Inventory / StockIn API thật | P1 |
| **DEV-14** | Auto-deploy CI | P2 |
| **BE-030** | Phase 3 hybrid FULLTEXT (nếu cần) | P2 |

---

## 🔴 Chờ SA/PM

| REQ | Nội dung |
|-----|----------|
| **REQ-003** | Schema RBAC |
| **REQ-007** | M0104 lockout |
| **REQ-002** | API Contract xlsx |

---

## Liên kết docs

| File | Nội dung |
|------|----------|
| [ai-search-improvement.md](../sa/amendments/ai-search-improvement.md) | Phase 1+2 ✅ · Phase 3+4 📋 |
| [rakuten-api-setup.md](../devops/rakuten-api-setup.md) | Rakuten staging |
| [AI_Setup_Guide.md](../sa/AI_Setup_Guide.md) | Cấu hình AI |
| [backend-tasks.md](./backend-tasks.md) | Task BE |
