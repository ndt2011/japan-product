# Backend Tasks — Laravel 11

**Dự án**: Hệ thống quản lý hàng hóa Nhật-Việt  
**Cập nhật**: 2026-06-07 | **Assignee**: Backend Developer  
**Repo**: https://github.com/ndt2011/japan-product (`project/api/`)  
**Trạng thái tổng**: Xem [STATUS.md](./STATUS.md)

**Legend**: ✅ Done | 🔄 Partial | ⏸ Blocked | 📋 Todo

---

## SPRINT 1 — Auth & RBAC

| ID | Mô tả | P | Dep | Est | Trạng thái |
|----|-------|---|-----|-----|------------|
| BE-001 | Khởi tạo Laravel 11, cấu hình MySQL + Redis | P0 | — | 0.5d | ✅ Local OK · Railway 📋 |
| BE-002 | Migration: `users`, `roles`, `permissions`, `role_permissions`, `user_permissions` | P0 | BE-001 | 0.5d | ⏸ REQ-003 |
| BE-003 | Seeder: 5 roles, permissions, SUPER_ADMIN | P0 | BE-002 | 0.5d | ⏸ REQ-003 |
| BE-004 | `POST /auth/login` — `login_id`, `password`, `remember_me` (24h/30d) | P0 | BE-001 | 1d | ✅ |
| BE-005 | `POST /auth/logout` — revoke token | P0 | BE-004 | 0.5d | ✅ |
| BE-006 | Account lockout: Redis 5 lần fail → khóa 30 phút | P0 | BE-004 | 1d | ⏸ REQ-007 |
| BE-007 | Middleware `CheckPermission` + Redis cache 5 phút | P0 | BE-002 | 1d | ⏸ REQ-003 |
| BE-008 | API CRUD users | P0 | BE-007 | 1d | ⏸ REQ-003 |
| BE-008b | `GET /health` — health check monitoring | P1 | BE-001 | 0.5h | ✅ |

**Ghi chú BE-004**: Dùng `login_id` theo `1-001` + `04_API_Contract.md` (không `email` — xem REQ-008).

---

## SPRINT 2 — Sản phẩm

| ID | Mô tả | P | Dep | Est | Trạng thái |
|----|-------|---|-----|-----|------------|
| BE-009 | Migration: categories, suppliers, products, inventories, warehouses | P0 | BE-001 | 0.5d | ✅ Thiếu `product_images` |
| BE-009b | Migration `product_images` | P0 | BE-009 | 2h | ✅ |
| BE-010 | Cloudflare R2 upload ảnh | P0 | BE-009b | 1d | ✅ Local `public` · R2 config sẵn |
| BE-011 | CRUD `/products` + soft delete + images endpoints | P0 | BE-009 | 1.5d | ✅ |
| BE-011b | `GET /products` filter + pagination đầy đủ | P0 | BE-011 | 3h | ✅ |

---

## SPRINT 3 — AI Search

| ID | Mô tả | P | Dep | Est | Trạng thái |
|----|-------|---|-----|-----|------------|
| BE-012 | Migration: `ai_search_sessions`, `ai_product_candidates` | P0 | — | 0.5d | ✅ amendment |
| BE-013 | OpenAI GPT-4o service | P0 | BE-012 | 2d | 🔄 Mock khi không có key |
| BE-014 | Scraper Rakuten/Amazon JP | P0 | BE-013 | 2d | 🔄 Mock catalog |
| BE-015 | Queue `AiProductSearchJob` + poll status API | P0 | BE-013 | 1d | ✅ |
| BE-016 | API: `/ai/search`, candidates approve/reject | P0 | BE-015 | 1d | ✅ |
| BE-016b | `POST /ai/product-search` — embedding semantic search | P1 | BE-011 | 2d | ✅ + `products:embed` |

---

## SPRINT 4 — Đơn hàng

| ID | Mô tả | P | Dep | Est | Trạng thái |
|----|-------|---|-----|-----|------------|
| BE-017 | Migration: orders, order_details, exchange_rates | P0 | — | 0.5d | ✅ + amendment `status` |
| BE-018 | Tỷ giá JPY/VND + Scheduler 7h JST | P0 | BE-017 | 1d | 🔄 GET current ✅ |
| BE-019 | API CRUD orders + reserve tồn kho | P0 | BE-017 | 2d | ✅ |
| BE-020 | `PUT /orders/{id}/confirm` — lock tỷ giá | P0 | BE-019 | 1d | ✅ |
| BE-021 | Email — đơn mới, confirm → `mail_histories` | P0 | BE-019 | 1d | ✅ |

---

## SPRINT 5 — Chuyến hàng & Permission

| ID | Mô tả | P | Dep | Est | Trạng thái |
|----|-------|---|-----|-----|------------|
| BE-022 | Migration: `shipment_batches`, `batch_order_items` | P0 | — | 0.5d | ✅ |
| BE-023 | API CRUD chuyến hàng | P0 | BE-022 | 2d | ✅ |
| BE-024 | API permission matrix | P1 | BE-007 | 1d | ⏸ REQ-003 |

---

## Coding Standards

- PSR-12 · Repository + Service · Form Request · API Resource
- Response: `{ success, data, message, errors }`
- Message codes: `docs/sa/06_Hằng_số_thông_báo.xlsx`
- Unit test PHPUnit cho Service layer
