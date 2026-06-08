# Backend Tasks — Laravel 11

**Dự án**: Hệ thống quản lý hàng hóa Nhật-Việt  
**Cập nhật**: 2026-06-08 | **Assignee**: Backend Developer  
**Repo**: https://github.com/ndt2011/japan-product (`project/api/`)  
**Trạng thái tổng**: Xem [STATUS.md](./STATUS.md)

**Legend**: ✅ Done | 🔄 Partial | ⏸ Blocked | 📋 Todo

---

## SPRINT 1 — Auth & RBAC

| ID | Mô tả | P | Dep | Est | Trạng thái |
|----|-------|---|-----|-----|------------|
| BE-001 | Khởi tạo Laravel 11, cấu hình MySQL + Redis | P0 | — | 0.5d | ✅ Local OK · Railway 📋 |
| BE-002 | Migration: `admins`, `companies_vn`, `branches`, `branch_users` | P0 | BE-001 | 0.5d | ✅ 2-role approach (không dùng role/permission tables) |
| BE-003 | Seeder: admin + company + branch users | P0 | BE-002 | 0.5d | ✅ BranchSeeder ✅ |
| BE-004 | `POST /auth/login` — `login_id`, `password`, `remember_me` (24h/30d) | P0 | BE-001 | 1d | ✅ |
| BE-005 | `POST /auth/logout` — revoke token | P0 | BE-004 | 0.5d | ✅ |
| BE-006 | Account lockout: Cache 5 lần fail → khóa 30 phút (M0106) | P0 | BE-004 | 1d | ✅ |
| BE-007 | Middleware `RoleMiddleware` (admin/company/branch) | P0 | BE-002 | 1d | ✅ via `rbac-req003.md` |
| BE-008 | API CRUD: AdminManagement + CompanyManagement + BranchManagement | P0 | BE-007 | 1d | ✅ |
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
| BE-013 | OpenAI GPT-4o service + enrichment | P0 | BE-012 | 2d | ✅ |
| BE-014 | Rakuten Ichiba API (Amazon JP chưa có) | P0 | BE-013 | 2d | ✅ Rakuten · 📋 Amazon |
| BE-015 | Queue `AiProductSearchJob` + poll status API | P0 | BE-013 | 1d | ✅ |
| BE-016 | API: `/ai/search`, candidates approve/reject | P0 | BE-015 | 1d | ✅ |
| BE-016b | `POST /ai/product-search` — embedding semantic search | P1 | BE-011 | 2d | ✅ + `products:embed` |
| BE-016c | Catalog VN: name_vi + QueryExpansion (amendment Ph1–2) | P1 | BE-016b | 1d | ✅ |
| BE-030 | Hybrid FULLTEXT search (amendment Phase 3) | P2 | BE-016c | 3d | ✅ `AI_SEARCH_HYBRID_ENABLED` |

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
| BE-024 | API permission matrix (full role/permission tables) | P3 | — | 1d | 📋 Future — không cần cho MVP |

---

## PHASE 2 — Invoice, Dual Pricing & Delivery (2026-06-08)

> Spec đầy đủ: `docs/sa/amendments/invoice-payment.md`

| ID | Mô tả | P | Dep | Est | Trạng thái |
|----|-------|---|-----|-----|------------|
| BE-P2-001 | Migration: `products` thêm `cost_price_jpy`, `selling_price_jpy`, `fee_rate` | P0 | — | 2h | ✅ migration 100060 |
| BE-P2-002 | Migration: `invoices` + `invoice_items` + patch 100070/100071 | P0 | — | 3h | ✅ |
| BE-P2-002b | Migration: `order_costs` + model `OrderCost` | P0 | — | 2h | ✅ · CRUD API ⏳ |
| BE-P2-003 | Migration: `orders` tracking + status `DELIVERED_ADMIN` | P0 | — | 1h | ✅ migration 100061 |
| BE-P2-004 | `InvoiceService::createFromOrder()` — fee + snapshot | P0 | BE-P2-001~003 | 1d | ✅ |
| BE-P2-005 | `InvoiceController`: CRUD + `send` + `pay` + `pdf` | P0 | BE-P2-004 | 1.5d | ✅ pdf=HTML ⏳ |
| BE-P2-006 | DomPDF — PDF thật (`dompdf/dompdf`) | P1 | BE-P2-005 | 1d | ✅ · `pdf_path` persist ⏳ |
| BE-P2-007 | `PUT /orders/{id}/confirm-receipt` (company + branch) | P0 | BE-P2-003 | 0.5d | ✅ |
| BE-P2-008 | Scheduler `invoices:check-overdue` 9h JST | P0 | BE-P2-005 | 3h | ✅ |
| BE-P2-009 | Scheduler `orders:auto-complete` 8h JST | P0 | BE-P2-007 | 3h | ✅ |
| BE-P2-010 | `GET /reports/profit` (Admin) | P1 | BE-P2-004 | 1d | ✅ · by-product ⏳ |
| BE-P2-011 | `ProductResource` ẩn `cost_price_jpy` non-admin | P0 | BE-P2-001 | 2h | ✅ |
| BE-P2-012 | API `order_costs` list/create/delete | P1 | BE-P2-002b | 0.5d | ✅ |

**Việc tiếp**: BE-P2-006 (DomPDF) → BE-P2-012 (order_costs API) → BE-P2-010 by-product

---

## Coding Standards

- PSR-12 · Repository + Service · Form Request · API Resource
- Response: `{ success, data, message, errors }`
- Message codes: `docs/sa/06_Hằng_số_thông_báo.xlsx`
- Unit test PHPUnit cho Service layer
