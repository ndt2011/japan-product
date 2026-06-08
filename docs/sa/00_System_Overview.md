# Tài liệu tổng quan hệ thống — TT Product Japan

> **Cập nhật**: 2026-06-08 | **Trạng thái**: Đang phát triển (Phase 1 — staging live)

---

## 1. Giới thiệu hệ thống

**TT Product Japan** là hệ thống B2B quản lý nhập khẩu hàng hóa Nhật Bản về Việt Nam. Kết nối giữa **Admin phía Nhật** (quản lý sản phẩm, đơn hàng, thông quan) và **Công ty VN** (đặt hàng, theo dõi giao hàng).

### Người dùng

| Vai trò | Mô tả | Bảng DB |
|---------|-------|---------|
| **Admin (JP)** | Quản lý toàn hệ thống, xác nhận đơn, xử lý thông quan | `admins` |
| **Công ty VN** | Đặt hàng sản phẩm Nhật, theo dõi đơn hàng | `companies_vn` |
| **Branch Manager / Staff** | Chi nhánh độc lập — đặt hàng, xem catalog | `branch_users` → `branches` |

### Tech Stack

| Tầng | Công nghệ |
|------|-----------|
| Backend API | Laravel (PHP) + Laravel Sanctum |
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| Database | MySQL |
| UI Design | SupplyFlow ERP (Figma Make export) |
| Auth | Bearer Token (24h / 30 ngày nếu remember_me) |

---

## 2. Kiến trúc tổng quan

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (Next.js 14)                  │
│  /login  /dashboard  /products  /orders  /shipments      │
│  /ai-center  /admin/ai-candidates  /suppliers  …         │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS / REST API
                     │ Bearer Token (Sanctum)
┌────────────────────▼────────────────────────────────────┐
│               Backend API (Laravel)                      │
│  Auth · Products · AI Search · Orders · Shipments        │
│  Suppliers · Exchange Rate · Mail                        │
└──────────┬──────────────────────────┬───────────────────┘
           │                          │
    ┌──────▼──────┐           ┌───────▼──────┐
    │    MySQL    │           │  File Storage │
    │ (18+ bảng) │           │ (ảnh, tờ khai)│
    └─────────────┘           └──────────────┘
```

---

## 3. Modules & Màn hình

| Module | Route | Docs SA | Code |
|--------|-------|---------|------|
| Đăng nhập | `/login` | `1-001_Đăng_nhập.xlsx` | ✅ BE+FE |
| Dashboard | `/dashboard` | upgrade-roadmap T1-002 | ✅ Stats API + FE |
| Hàng hóa | `/products` | `2-001_Thông_tin_hàng_hóa.xlsx` | ✅ BE+FE |
| AI Center | `/ai-center` | `2-101` (chờ xlsx) | ✅ Luồng A API+FE |
| AI Duyệt | `/admin/ai-candidates` | amendment | ✅ BE+FE |
| Đơn hàng | `/orders` | `3-001` (chờ xlsx) | ✅ BE+FE |
| Chuyến hàng | `/shipments` | `4-001` (chờ xlsx) | ✅ BE+FE |
| Kho / Nhập / Xuất / Kiểm kê | `/stock-in` … `/inventory` | `warehouse-operations.md` | ✅ BE+FE (admin) |
| Báo cáo | `/reports` | `reports-module.md` | ✅ BE+FE |
| Chi nhánh | `/admin/branches`, `/my-branch` | `branch-system.md` | ✅ Phase 1 |
| Quản trị user | `/admin` | `5-001` | ✅ Tạo Admin + Công ty VN |
| SP theo CN | `/products/{id}` tab | `branch-system.md` | ✅ branch-stats |
| Nhà cung cấp | `/suppliers` | — | 🔄 UI demo |
| Đại lý | `/agents` | 5-001 | ✅ List Công ty VN (admin) |

---

## 4. API Overview

**Base URL**: `https://api.yourdomain.com/api`  
**Format**: JSON  
**Auth**: `Authorization: Bearer {token}`

### Response envelope chuẩn
```json
{
  "success": true,
  "data": {},
  "message": "M0000",
  "errors": null
}
```

### Endpoints đã thiết kế

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/auth/login` | Đăng nhập (admin/company) |
| POST | `/auth/logout` | Đăng xuất |
| GET | `/auth/me` | Thông tin user hiện tại |
| GET | `/products` | Danh sách hàng hóa (paginate) |
| GET | `/products/{id}` | Chi tiết hàng hóa |
| POST | `/products` | Tạo hàng hóa mới |
| PUT | `/products/{id}` | Cập nhật hàng hóa |
| DELETE | `/products/{id}` | Xóa hàng hóa |
| GET | `/suppliers` | Danh sách nhà cung cấp JP |
| GET | `/product-categories` | Danh sách danh mục |
| GET | `/exchange-rates/current` | Tỷ giá JPY→VND hiện tại |
| POST | `/ai/search` | Khởi tạo tìm kiếm AI (async) |
| GET | `/ai/search/{id}` | Poll kết quả tìm kiếm |
| POST/GET | `/ai/candidates` | Gửi / list sản phẩm chờ duyệt |
| PUT | `/ai/candidates/{id}/approve\|reject` | Duyệt / từ chối → tạo `products` |
| POST | `/ai/product-search` | Hybrid search catalog (embedding + keyword, `expanded_query`) ✅ |
| GET/POST | `/orders` … | CRUD đơn hàng |
| GET/POST | `/shipment-batches` … | Quản lý chuyến hàng |

Chi tiết: `04_API_Contract.md`

---

## 4b. AI Product Search — Hai luồng

```
Luồng A (đã code) — Khám phá sản phẩm mới từ web
  User nhập từ khóa → POST /ai/search → poll GET /ai/search/{id}
  → Chọn kết quả → POST /ai/candidates → Admin duyệt → products

Luồng B (đã code) — Tìm trong catalog có sẵn + dạy AI tiếng Việt
  User nhập câu hỏi (VN/JP) → POST /ai/product-search
  → QueryExpansionService (few-shot GPT) → expanded_query
  → Hybrid: embedding cosine + keyword (name_vi, product_name_jp)
  → Top 10–15 sản phẩm + ảnh + search_mode
  OPS: products:generate-vi → products:embed --force (xem quy trình dạy)
```

| Tài liệu | Nội dung |
|----------|----------|
| `04_API_Contract.md` Module 3 | Contract cả hai luồng |
| `amendments/ai_search-tables.md` | Schema `ai_*` (luồng A) |
| `amendments/ai-catalog-teaching-process.md` | ★ Quy trình dạy AI catalog (OPS) |
| `amendments/ai-search-improvement.md` | Phase 1–4 kỹ thuật |
| `AI_Search_Implementation.md` | Hướng dẫn code embedding |
| `AI_Setup_Guide.md` | Cấu hình env + checklist |

---

## 5. Database Schema

### Danh sách bảng (14 bảng gốc + amendments)

| # | Bảng | Mô tả |
|---|------|-------|
| 1 | `admins` | Tài khoản admin phía Nhật |
| 2 | `companies_vn` | Công ty VN đặt hàng |
| 3 | `suppliers_jp` | Nhà cung cấp Nhật Bản |
| 4 | `product_categories` | Danh mục hàng hóa |
| 5 | `products` | Hàng hóa Nhật Bản |
| 6 | `product_images` | Ảnh hàng hóa (multi-image) ⚠️ |
| 7 | `warehouses` | Kho hàng (JP hoặc VN) |
| 8 | `inventories` | Tồn kho theo kho + sản phẩm |
| 9 | `orders` | Đơn đặt hàng |
| 10 | `order_details` | Chi tiết từng dòng hàng trong đơn |
| 11 | `exchange_rates` | Lịch sử tỷ giá JPY/VND |
| 12 | `import_declarations` | Tờ khai hải quan |
| 13 | `mail_templates` | Mẫu email hệ thống |
| 14 | `mail_histories` | Lịch sử gửi email |
| 15 | `ai_search_sessions` | Phiên tìm kiếm AI (luồng A) ✅ |
| 16 | `ai_product_candidates` | Sản phẩm chờ duyệt từ AI ✅ |
| 17 | `shipment_batches` | Chuyến hàng JP→VN ✅ |
| 18 | `batch_order_items` | Đơn trong chuyến ✅ |
| 19 | `stock_movements` | Lịch sử nhập/xuất/kiểm kê kho 📋 |
| — | `products.embedding` | Vector semantic search (luồng B) ✅ |
| — | `products.name_vi`, `description_vi` | Dạy catalog tiếng Việt ✅ |

> Amendments: `product_images`, `ai_*`, `shipment_*`, `orders.status`, `stock_movements` — chờ sync `03_Thiết_kế_CSDL.xlsx`

### Quan hệ chính giữa các bảng

```
admins ──────────────────────────────┐
  │                                  │ handler_admin_id
  │ branch_id                        ▼
  ▼                               orders ◄──── companies_vn
branches                             │              │
                                     │ order_id     │ company_vn_id
                                     ▼              │
                              order_details         │
                                     │              │
                             product_id│            │
                                     ▼              │
product_categories ──► products ◄────┘              │
                          │                         │
                 supplier_id│                       │
                          ▼                         │
                    suppliers_jp                     │
                          │                         │
                          ▼                         │
                    product_images                  │
                                                    │
inventories ──── product_id ──► products           │
     └────────── warehouse_id ──► warehouses        │
                                                    │
orders ──── order_id ──► import_declarations        │
                                                    │
exchange_rates (độc lập — lưu lịch sử tỷ giá)      │
mail_templates ──► mail_histories                   │
```

### Quy ước chung tất cả bảng

Mọi bảng đều có các cột audit:

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `created` | datetime | Ngày tạo |
| `created_user_id` | int | ID người tạo |
| `modified` | datetime | Ngày cập nhật |
| `modified_user_id` | int | ID người cập nhật |
| `deleted` | datetime | Ngày xóa (soft delete) |
| `deleted_flag` | tinyint(1) | 1 = đã xóa |

---

## 6. Amendments (thay đổi sau thiết kế gốc)

| File | Ngày | Nội dung | Trạng thái |
|------|------|----------|-----------|
| `companies_vn-auth-columns.md` | 2026-06-07 | `login_id`, `password` trên `companies_vn` | ✅ |
| `product_images-table.md` | 2026-06-07 | Bảng `product_images` | ✅ Code · chờ sync xlsx |
| `ai_search-tables.md` | 2026-06-07 | `ai_search_sessions`, `ai_product_candidates` | ✅ Luồng A |
| `orders-status.md` | 2026-06-07 | `orders.status` varchar workflow | ✅ |
| `shipment-batches-tables.md` | 2026-06-07 | `shipment_batches`, `batch_order_items` | ✅ |
| `rbac-req003.md` | 2026-06-07 | RBAC fix — model, controller, routes | ⏸ Chờ SA |
| `rbac-ui-permissions.md` | 2026-06-07 | UI permission matrix + FE hooks + sidebar | ✅ |
| `warehouse-operations.md` | 2026-06-07 | Nhập/Xuất/Kiểm kê kho + `stock_movements` + InventoryService | ✅ |
| `reports-module.md` | 2026-06-07 | Báo cáo tồn kho / đơn hàng / xuất nhập / doanh thu | ✅ |
| `branch-system.md` | 2026-06-07 | Chi nhánh + BranchUser auth + OrderController branch_id | ✅ |
| `upgrade-roadmap.md` | 2026-06-07 | Lộ trình 3 tier: Invoice, Dashboard, Auto Price, Notifications… | 📋 Kế hoạch |
| `ui-improvements.md` | 2026-06-07 | Phân tích UI cần sửa — 13 điểm, từng màn hình cụ thể | 📋 Kế hoạch |

---

## 7. Luồng nghiệp vụ chính

### Luồng đặt hàng (đã cập nhật)

```
[Công ty VN] → Tạo đơn DRAFT → Gửi PENDING (reserve tồn kho)
      → [Admin JP] CONFIRMED (lock tỷ giá)
      → Gom chuyến PROCESSING → … → DELIVERED
      [Hủy] DRAFT|PENDING → CANCELLED (release reserve)
```

### Trạng thái đơn hàng (`orders.status`)

| Status | Mô tả |
|--------|-------|
| DRAFT | Đang soạn |
| PENDING | Đã gửi, chờ xác nhận |
| CONFIRMED | Admin đã duyệt |
| PROCESSING | Đã gom vào chuyến |
| DELIVERED | Đã giao |
| CANCELLED | Đã hủy |

### Trạng thái thông quan

| Giá trị | Tên |
|---------|-----|
| 0 | Chờ khai báo |
| 1 | Đang xử lý |
| 2 | Thông quan |
| 3 | Từ chối |

---

## 8. Tiến độ phát triển

### ✅ Đã hoàn thành (code)
- DB 18+ bảng + migrations amendments
- API Contract markdown (`04_API_Contract.md`) — Auth, Products, AI, Orders, Shipments
- Auth, Products CRUD + images, **AI Search luồng A**, Orders, Shipment batches
- FE: 13+ routes (thêm `/shipments`, `/admin/ai-candidates`)
- PHPUnit **33 tests** pass · CI GitHub Actions

### 🔴 Đang fix — Ưu tiên cao nhất

**S1 RBAC** — Tạo user / phân quyền không hoạt động  
Root cause + fix đầy đủ: **`amendments/rbac-req003.md`**

3 điểm phải fix đúng thứ tự:
1. Model `Admin` + `CompanyVn` thêm `HasApiTokens` + accessor `getUserTypeAttribute()`
2. Password tạo user **dùng `Hash::make()`** — plain text thì không login được
3. Routes bọc đúng `role:admin` / `role:company` middleware

Verify nhanh bằng Tinker (xem cuối `rbac-req003.md`).

---

### 🔄 Trạng thái các ticket

| Ticket | Mô tả | Trạng thái |
|--------|-------|-----------|
| **BE-021** | Email đơn mới / confirm → `mail_histories` | ✅ Done |
| **DevOps** | Railway (BE) + Vercel (FE) | ✅ Done |
| **BE-016b** | AI product-search embedding (luồng B) | ✅ Done (fallback keyword nếu no key) |
| **S1 RBAC** | Tạo user + phân quyền Admin/Company | 🔴 Đang fix |
| **QA** | Test cases Orders + Batch | 📋 Sau khi RBAC xong |

### 📋 Ưu tiên tiếp theo (sau RBAC)

1. **Kho hàng** — migration `stock_movements` + WarehouseController + InventoryService + InventoryController  
   Docs: `amendments/warehouse-operations.md`

2. **Báo cáo** — ReportController (4 endpoints)  
   Docs: `amendments/reports-module.md`

3. **FE RBAC** — sidebar filter + ProtectedRoute + usePermission hook  
   Docs: `amendments/rbac-ui-permissions.md`

4. **UI sửa gấp** (đợt 1 ngay sau RBAC):
   - Sidebar filter theo role (`amendments/ui-improvements.md` → UI-008)
   - Product Form thêm `name_vi` + image upload (UI-004)
   - Product List hiển thị ảnh + filter (UI-005)

5. **Phase 2 nâng cấp** (xem chi tiết `amendments/upgrade-roadmap.md`):
   - T1-001 Invoice & Payment
   - T1-002 Dashboard Analytics thật
   - T1-003 Auto Price Calculation

6. **Chưa bắt đầu**:
   - Scraper Rakuten/Amazon thật (luồng A production)
   - Suppliers CRUD API hoàn chỉnh
   - SA màn hình xlsx: `2-101`, `3-001`, `4-001`, `5-001`

### 📁 Tài liệu đầy đủ

| File | Nội dung |
|------|----------|
| `amendments/rbac-req003.md` | **Fix RBAC** — model, controller, routes, tinker test |
| `qa/QA_Orders_Batch.md` | 19 test cases Orders + Shipment Batch |
| `devops/deploy_guide.md` | Deploy Railway + Vercel + GitHub Actions |
| `migrations_guide.md` | 8 migration files + thứ tự chạy |
| `AI_Search_Implementation.md` | Code Laravel AI Search (Luồng B) |
| `AI_Setup_Guide.md` | Cấu hình .env local + production |

---

## 9. File tài liệu SA

| File | Nội dung |
|------|----------|
| `02_Thiết_kế_triển_khai.xlsx` | Kế hoạch triển khai |
| `03_Thiết_kế_CSDL.xlsx` | Thiết kế database chi tiết |
| `04_API_Contract.md` | Đặc tả API |
| `05_Sơ_đồ_nghiệp_vụ.xlsx` | Sơ đồ nghiệp vụ |
| `06_Hằng_số_thông_báo.xlsx` | Message code (M0000...) |
| `1-001_Đăng_nhập.xlsx` | SA màn hình đăng nhập |
| `2-001_Thông_tin_hàng_hóa.xlsx` | SA màn hình hàng hóa |
| `_schema.json` | Dump JSON schema từ 03_CSDL |
| `amendments/` | Thay đổi bổ sung sau thiết kế gốc |
