# Tài liệu tổng quan hệ thống — TT Product Japan

> **Cập nhật**: 2026-06-07 | **Trạng thái**: Đang phát triển (Phase 1)

---

## 1. Giới thiệu hệ thống

**TT Product Japan** là hệ thống B2B quản lý nhập khẩu hàng hóa Nhật Bản về Việt Nam. Kết nối giữa **Admin phía Nhật** (quản lý sản phẩm, đơn hàng, thông quan) và **Công ty VN** (đặt hàng, theo dõi giao hàng).

### Người dùng

| Vai trò | Mô tả | Bảng DB |
|---------|-------|---------|
| **Admin (JP)** | Quản lý toàn hệ thống, xác nhận đơn, xử lý thông quan | `admins` |
| **Công ty VN** | Đặt hàng sản phẩm Nhật, theo dõi đơn hàng | `companies_vn` |

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
| Dashboard | `/dashboard` | — | 🔄 UI demo |
| Hàng hóa | `/products` | `2-001_Thông_tin_hàng_hóa.xlsx` | ✅ BE+FE |
| AI Center | `/ai-center` | `2-101` (chờ xlsx) | ✅ Luồng A API+FE |
| AI Duyệt | `/admin/ai-candidates` | amendment | ✅ BE+FE |
| Đơn hàng | `/orders` | `3-001` (chờ xlsx) | ✅ BE+FE |
| Chuyến hàng | `/shipments` | `4-001` (chờ xlsx) | ✅ BE+FE |
| Nhà cung cấp | `/suppliers` | — | 🔄 UI demo |
| Quản trị | `/admin` | `5-001` | 🔄 UI demo |

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
| POST | `/ai/product-search` | Semantic search catalog (📋 chưa code) |
| GET/POST | `/orders` … | CRUD đơn hàng |
| GET/POST | `/shipment-batches` … | Quản lý chuyến hàng |

Chi tiết: `04_API_Contract.md`

---

## 4b. AI Product Search — Hai luồng

```
Luồng A (đã code) — Khám phá sản phẩm mới từ web
  User nhập từ khóa → POST /ai/search → poll GET /ai/search/{id}
  → Chọn kết quả → POST /ai/candidates → Admin duyệt → products

Luồng B (chưa code) — Tìm trong catalog có sẵn
  User nhập câu hỏi → POST /ai/product-search
  → OpenAI embedding + cosine similarity trên products.embedding
  → Top 10–20 sản phẩm + ảnh
```

| Tài liệu | Nội dung |
|----------|----------|
| `04_API_Contract.md` Module 3 | Contract cả hai luồng |
| `amendments/ai_search-tables.md` | Schema `ai_*` (luồng A) |
| `AI_Search_Implementation.md` | Hướng dẫn code luồng B |

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
| — | `products.embedding` | Vector semantic search (luồng B) 📋 |

> Amendments: `product_images`, `ai_*`, `shipment_*`, `orders.status` — chờ sync `03_Thiết_kế_CSDL.xlsx`

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
| `rbac-req003.md` | 2026-06-07 | RBAC tạm + permission matrix | ⏸ Chờ SA |

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

### 🔄 Đang làm / tiếp theo

| Ticket | Mô tả | Trạng thái |
|--------|-------|-----------|
| **BE-016b** | `POST /ai/product-search` embedding (luồng B) | 📋 Có guide |
| **BE-021** | Email đơn mới / confirm → `mail_histories` | ✅ |
| **S1 RBAC** | Permission matrix | ⏸ REQ-003 |
| **DevOps** | Railway + Vercel staging | 📋 Cuối |

### 📋 Chưa bắt đầu
- Scraper Rakuten/Amazon thật (luồng A production)
- Dashboard / Reports / Suppliers API
- SA màn hình xlsx: `2-101`, `3-001`, `4-001`, `5-001`

### 📁 Tài liệu bổ sung mới
| File | Nội dung |
|------|----------|
| `amendments/rbac-req003.md` | RBAC tạm thời chờ SA |
| `qa/QA_Orders_Batch.md` | Test cases Orders + Shipment Batch |
| `devops/deploy_guide.md` | Deploy Railway + Vercel |
| `migrations_guide.md` | 8 migration files + thứ tự chạy |
| `AI_Search_Implementation.md` | Luồng B — embedding search (chưa code) |
| `../README.md` | Mục lục toàn bộ docs |

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
