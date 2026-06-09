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

## SPRINT AI-P — AI Purchasing Specialist

> Spec đầy đủ: `docs/sa/amendments/ai-purchasing-specialist.md`  
> Phụ thuộc: OpenAI API key + Rakuten App ID đã set

| ID | Mô tả | P | Dep | Est | Trạng thái |
|----|-------|---|-----|-----|------------|
| BE-AI-001 | Migration: `purchasing_sessions` + `purchasing_results` | P0 | — | 2h | ✅ |
| BE-AI-002 | `AiPurchasingService::analyze()` — parse + search + merge + score + report | P0 | BE-AI-001 | 3h | ✅ |
| BE-AI-003 | `AiPurchasingService` — search Rakuten (10) + catalog (5), merge & deduplicate | P0 | BE-AI-002 | 4h | ✅ |
| BE-AI-004 | `scoreItem()` — 5 tiêu chí weighted: price30%+quality30%+popular20%+warranty10%+brand10% | P0 | BE-AI-003 | 3h | ✅ |
| BE-AI-005 | `generateReport()` — GPT-4o-mini, max 400 tokens, cache 1h | P0 | BE-AI-004 | 2h | ✅ |
| BE-AI-006 | `AiPurchasingController::analyze()` — POST /ai/purchasing + validation | P0 | BE-AI-005 | 2h | ✅ |
| BE-AI-007 | Rate limiting: max 10 request/user/giờ (throttle middleware) | P1 | BE-AI-006 | 1h | 📋 P2 |
| BE-AI-008 | Cache: GPT report 1h (Laravel Cache), translation via service | P1 | BE-AI-003 | 2h | ✅ |

**Thứ tự implement**: BE-AI-001 → BE-AI-002 → BE-AI-003 → BE-AI-004 → BE-AI-005 → BE-AI-006

**System Prompts** (xem đầy đủ trong spec):
- Parse prompt: dịch yêu cầu VI/JP → JSON keywords
- Score prompt: chấm điểm 5 tiêu chí (Price 30%, Quality 30%, Review 20%, Warranty 10%, Brand 10%)
- Report prompt: sinh báo cáo tiếng Việt + đề xuất tối ưu

---

## SPRINT V3 — Giai đoạn 1: Critical (Order Flow + Pricing + Inventory + Notify)

> Spec đầy đủ: `docs/sa/amendments/upgrade-v3-analysis.md`

### V3-G1: Order Flow Redesign (#12)

| ID | Mô tả | P | Dep | Est | Trạng thái |
|----|-------|---|-----|-----|------------|
| BE-V3-001 | Migration: payment fields orders + status string APPROVED/PAID/SHIPPING | P0 | — | 2h | ✅ `100100` |
| BE-V3-002 | Migration: carrier_name, shipping_at vào shipment_batches | P0 | — | 1h | ✅ `100100` |
| BE-V3-003 | `OrderService::approve()` — PENDING → APPROVED, notify branch | P0 | BE-V3-001 | 2h | ✅ |
| BE-V3-004 | `OrderService::recordPayment()` — APPROVED → PAID + payment fields | P0 | BE-V3-001 | 2h | ✅ |
| BE-V3-005 | `ShipmentBatchService::autoCreateFromOrder()` — tự tạo khi PAID | P0 | BE-V3-002 | 2h | ✅ |
| BE-V3-006 | `ShipmentBatchService::setTracking()` — PROCESSING → SHIPPING + tracking | P0 | BE-V3-002 | 1h | ✅ |
| BE-V3-007 | `InvoiceService` — tự tạo invoice khi order PAID | P0 | BE-V3-004 | 2h | ✅ |
| BE-V3-008 | `OrderController` — thêm endpoint approve + recordPayment | P0 | BE-V3-003,004 | 1h | ✅ |
| BE-V3-009 | `ShipmentBatchController` — thêm endpoint setTracking | P0 | BE-V3-006 | 1h | ✅ |

### V3-G1: Pricing Permissions (#3)

| ID | Mô tả | P | Dep | Est | Trạng thái |
|----|-------|---|-----|-----|------------|
| BE-V3-010 | Migration: thêm `retail_price_vnd` vào products | P0 | — | 0.5h | ✅ `100100` |
| BE-V3-011 | `ProductResource` — phân quyền 3 tầng (admin/company/branch) cho price fields | P0 | BE-V3-010 | 2h | ✅ |
| BE-V3-012 | `StoreProductRequest` — thêm `retail_price_vnd` validation | P0 | BE-V3-010 | 0.5h | ✅ |

### V3-G1: Inventory Workflow (#6)

| ID | Mô tả | P | Dep | Est | Trạng thái |
|----|-------|---|-----|-----|------------|
| BE-V3-013 | Migration: `location_type`, `is_default` vào warehouses | P0 | — | 0.5h | ✅ `100100` |
| BE-V3-014 | Migration: `inventory_cd`, `restock_status`, `restock_eta`, `min_stock_qty` vào inventories | P0 | — | 1h | ✅ `100100` |
| BE-V3-015 | `InventoryService` — auto sinh `inventory_cd` (INV-{WH}-{PROD}-{SEQ}) | P0 | BE-V3-014 | 2h | ✅ |
| BE-V3-016 | `InventoryController` — PUT update + DELETE (soft) | P0 | BE-V3-015 | 2h | ✅ |
| BE-V3-017 | `POST /inventories/bulk-import` — CSV nhập kho hàng loạt | P1 | BE-V3-015 | 3h | ✅ |
| BE-V3-018 | Scheduler: kiểm tra tồn kho daily → auto set restock_status | P1 | BE-V3-014 | 2h | ✅ `inventories:sync-restock-status` 7h JST |

### V3-G1: Notification System (#4)

| ID | Mô tả | P | Dep | Est | Trạng thái |
|----|-------|---|-----|-----|------------|
| BE-V3-019 | Migration: bảng `notifications` | P1 | — | 1h | ✅ `100100` |
| BE-V3-020 | `NotificationService::send()` — tạo record + đánh dấu unread | P1 | BE-V3-019 | 2h | ✅ |
| BE-V3-021 | `NotificationController` — GET list, PUT read, PUT read-all, GET count | P1 | BE-V3-020 | 2h | ✅ |
| BE-V3-022 | Inject `NotificationService` vào OrderService + AiProductCandidateService | P1 | BE-V3-020 | 2h | ✅ |

---

## SPRINT V3 — Giai đoạn 2: Important (Dashboard + Product + Profile)

### V3-G2: Dashboard Financial (#8 + #9)

| ID | Mô tả | P | Dep | Est | Trạng thái |
|----|-------|---|-----|-----|------------|
| BE-V3-023 | `GET /dashboard/revenue?year&month` — doanh thu theo tháng | P1 | — | 4h | ✅ |
| BE-V3-024 | `GET /dashboard/cashflow?year&from_month&to_month` — cashflow theo tháng | P1 | — | 4h | ✅ |
| BE-V3-025 | `DashboardService` — phân quyền chặt theo role (`can_view_financial`) | P1 | — | 3h | ✅ |

### V3-G2: Product Improvements (#1 #2 #5 #7)

| ID | Mô tả | P | Dep | Est | Trạng thái |
|----|-------|---|-----|-----|------------|
| BE-V3-026 | Migration: `barcode`, `min_order_qty` vào products | P1 | — | 0.5h | ✅ `100100` |
| BE-V3-027 | `ProductResource` — thêm `created_by_name` (resolve Admin từ `created_user_id`) | P1 | — | 1h | ✅ |
| BE-V3-028 | `AiProductCandidateResource` — đảm bảo `image_url` trong response | P1 | — | 0.5h | ✅ |
| BE-V3-029 | Review + cập nhật required validation tất cả Form Requests | P2 | — | 2h | 📋 |

### V3-G2: Master Data + Profile (#10 #14)

| ID | Mô tả | P | Dep | Est | Trạng thái |
|----|-------|---|-----|-----|------------|
| BE-V3-030 | API CRUD `product_categories`; warehouses create/list; **suppliers CRUD** | P2 | — | 3h | ✅ |
| BE-V3-031 | Migration: `avatar_url`, `phone` vào admins + branch_users + companies_vn | P2 | — | 1h | ✅ `100110` |
| BE-V3-032 | `GET/PUT /profile` + `POST /profile/avatar` (upload R2) | P2 | BE-V3-031 | 3h | ⚠️ GET/PUT ✅ · avatar R2 📋 |

---

## Coding Standards

- PSR-12 · Repository + Service · Form Request · API Resource
- Response: `{ success, data, message, errors }`
- Message codes: `docs/sa/06_Hằng_số_thông_báo.xlsx`
- Unit test PHPUnit cho Service layer
