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
| Frontend | React + Tailwind CSS |
| Database | MySQL |
| UI Design | SupplyFlow ERP (Figma Make export) |
| Auth | Bearer Token (24h / 30 ngày nếu remember_me) |

---

## 2. Kiến trúc tổng quan

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend (React)                    │
│  /login  /dashboard  /products  /suppliers  /orders      │
│  /ai-center  /admin                                      │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS / REST API
                     │ Bearer Token (Sanctum)
┌────────────────────▼────────────────────────────────────┐
│               Backend API (Laravel)                      │
│  Auth · Products · Orders · Suppliers · Exchange Rate    │
│  Import Declaration · Mail · Admin                       │
└──────────┬──────────────────────────┬───────────────────┘
           │                          │
    ┌──────▼──────┐           ┌───────▼──────┐
    │    MySQL    │           │  File Storage │
    │  (14 bảng) │           │ (ảnh, tờ khai)│
    └─────────────┘           └──────────────┘
```

---

## 3. Modules & Màn hình

| Module | Route | Docs SA | Trạng thái |
|--------|-------|---------|-----------|
| Đăng nhập | `/login` | `1-001_Đăng_nhập.xlsx` | ✅ Có docs |
| Dashboard | `/dashboard` | — | 📋 Chờ docs |
| Hàng hóa | `/products` | `2-001_Thông_tin_hàng_hóa.xlsx` | ✅ Có docs |
| AI Center | `/ai-center` | `2-101` | 📋 Chờ docs |
| Nhà cung cấp | `/suppliers` | — | 📋 Chờ docs |
| Đơn hàng | `/orders` | `3-001` | 📋 Chờ docs |
| Quản trị | `/admin` | `5-001` | 📋 Chờ docs |

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

---

## 5. Database Schema

### Danh sách bảng (14 bảng)

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

> ⚠️ `product_images`: Amendment 2026-06-07 — chờ sync vào `03_Thiết_kế_CSDL.xlsx`

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
| `companies_vn-auth-columns.md` | 2026-06-07 | Thêm `login_id`, `password` vào `companies_vn` | ✅ Migration tạo xong |
| `product_images-table.md` | 2026-06-07 | Thêm bảng `product_images` (multi-image) | ⚠️ Chờ sync SA |

---

## 7. Luồng nghiệp vụ chính

### Luồng đặt hàng

```
[Công ty VN] → Đăng nhập → Chọn sản phẩm → Tạo đơn (draft)
      → Gửi đơn (status: 1) → [Admin JP] Xem đơn → Xác nhận (status: 2)
      → Tạo tờ khai hải quan → Thông quan → Giao hàng (status: 3)
      [Nếu hủy] → status: 4
```

### Trạng thái đơn hàng

| Giá trị | Tên | Mô tả |
|---------|-----|-------|
| 0 | Nháp | Công ty VN đang tạo |
| 1 | Đã gửi | Chờ admin xác nhận |
| 2 | Xác nhận | Admin đã duyệt |
| 3 | Hoàn thành | Đã giao hàng |
| 4 | Hủy | Đơn bị hủy |

### Trạng thái thông quan

| Giá trị | Tên |
|---------|-----|
| 0 | Chờ khai báo |
| 1 | Đang xử lý |
| 2 | Thông quan |
| 3 | Từ chối |

---

## 8. Tiến độ phát triển

### ✅ Đã hoàn thành
- Cấu trúc DB (13/14 bảng, chờ `product_images` sync)
- API Contract Module Auth + Products
- Shell frontend 12 routes
- UI layout từ SupplyFlow ERP

### 🔄 Đang làm
- Docs SA màn hình: Dashboard, Suppliers, Orders, Admin
- API endpoints cho Orders, Suppliers
- Module AI Center (2-101)

### 📋 Chưa bắt đầu
- CI/CD pipeline
- Deploy lên server (AWS/GCP)
- Testing strategy
- Module báo cáo / xuất Excel

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
