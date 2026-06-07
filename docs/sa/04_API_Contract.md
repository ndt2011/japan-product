# API Contract — Hệ thống Nhật-Việt

> **Phiên bản**: 1.0 | **Ngày**: 2026-06-07  
> **Ghi chú**: Bản markdown thay thế tạm `04_API_Contract.xlsx` (chưa có). Nguồn: HANDOFF + màn hình SA.

## Chuẩn chung

**Base URL**: `https://api.yourdomain.com/api`  
**Auth**: Bearer token (Sanctum), expiry 24h  
**Content-Type**: `application/json`

### Response envelope

```json
{
  "success": true,
  "data": {},
  "message": "M0301",
  "errors": null
}
```

---

## Module 1 — Auth

### POST `/auth/login`

**Mô tả**: Đăng nhập admin hoặc công ty VN (`1-001_Đăng_nhập.xlsx`)

**Request**:
```json
{
  "login_id": "admin",
  "password": "Admin@123",
  "remember_me": false
}
```

`remember_me` (boolean, optional): `true` → token TTL 30 ngày (RULE-AUTH-04); `false`/bỏ qua → 24 giờ (RULE-AUTH-03).

**Response 200** (`M0103`):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "login_id": "admin",
      "full_name": "Super Admin",
      "email": "admin@japan-product.local",
      "user_type": "admin"
    },
    "token": "1|xxxx",
    "token_type": "Bearer",
    "expires_at": "2026-06-08T10:00:00+00:00"
  },
  "message": "M0103",
  "errors": null
}
```

**Response 401** (`M0101`): Sai login_id/password  
**Response 403** (`M0102`): Tài khoản vô hiệu hóa

`user_type`: `admin` | `company`

**Company user example**:
```json
{
  "user": {
    "id": 1,
    "login_id": "vn_company01",
    "company_name": "Công ty ABC",
    "email": "contact@abc.vn",
    "user_type": "company"
  }
}
```

### POST `/auth/logout`

**Auth**: Required  
**Response 200**: `{ "success": true, "data": null, "message": "M0000" }`

### GET `/auth/me`

**Auth**: Required  
**Response 200**: `{ "success": true, "data": { "user": { ... } } }`

---

## Module 2 — Products

### GET `/products`

**Query**: `page`, `per_page`, `search`, `category_id`  
**Auth**: Required

**Response 200**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "product_cd": "P001",
        "product_name": "Vitamin C",
        "product_name_jp": "ビタミンC",
        "cost_jpy": 1500,
        "price_vnd": 350000,
        "supplier_name": "Supplier JP",
        "category_name": "Thực phẩm chức năng",
        "disabled_flag": false
      }
    ],
    "pagination": { "current_page": 1, "per_page": 20, "total": 1 }
  },
  "message": "M0000",
  "errors": null
}
```

### GET `/products/{id}`

**Response 200**: Chi tiết kèm category, supplier, exchange_rate, inventory_total

### POST `/products`

**Request** (theo `2-001`):
```json
{
  "product_category_id": 1,
  "product_cd": "P001",
  "product_name": "Vitamin C",
  "product_name_jp": "ビタミンC",
  "supplier_id": 1,
  "spec": "500mg x 60 viên",
  "unit": "hộp",
  "cost_jpy": 1500,
  "price_vnd": 350000,
  "import_tax_rate": 10.0,
  "origin": "Nhật Bản",
  "description": "...",
  "memo": "",
  "disabled_flag": false
}
```

**Response 201** (`M0301`) | **409** (`M0302`) mã trùng

### PUT `/products/{id}`

**Response 200** (`M0301`)

### DELETE `/products/{id}`

**Response 200** (`M0303`) | **409** (`M0304`) có đơn hàng liên quan

### GET `/products/{id}/images`

**Response 200**: `{ items: [{ id, product_id, image_path, is_primary, order_no }] }`

### POST `/products/{id}/images`

**Body** (multipart): `image` (file, max 5MB, jpeg/png/webp), `is_primary` (optional boolean)

**Response 201** (`M0301`)

### PUT `/products/{id}/images/{imageId}`

**Body**: `{ is_primary?: boolean, order_no?: number }`

**Response 200** (`M0301`)

### DELETE `/products/{id}/images/{imageId}`

**Response 200** (`M0303`) — soft delete + sync `products.image_path`

**Storage**: `PRODUCT_IMAGE_DISK=public` (local) | `r2` (Cloudflare R2 staging/prod)

---

## Module 3 — AI Product Search

### POST `/ai/search`

**Body**: `{ "keyword": "コラーゲン" }`  
**Response 202**: `{ session: { id, keyword, status: "processing" } }`

### GET `/ai/search/{id}`

**Response 200**:
- Đang xử lý: `status: "processing"`
- Có kết quả: `status: "completed"`, `items: [{ external_id, product_name_jp, image_url, price_jpy, source_url, source_platform, description }]`
- Không có kết quả: `message: M0201`, `items: []`
- Timeout: `message: M0202`, `status: "timeout"`

### POST `/ai/candidates`

**Body**: `{ session_id?: number, items: [{ product_name_jp, image_url?, price_jpy?, source_url?, source_platform?, description? }] }`  
**Response 201** (`M0203`)

### GET `/ai/candidates?status=PENDING`

**Response 200**: `{ items: [...], pagination }`

### PUT `/ai/candidates/{id}/approve`

**Body**: `{ product_category_id, product_name_vn?, price_vnd?, cost_jpy? }`  
**Response 200** (`M0204`) — tạo `products`

### PUT `/ai/candidates/{id}/reject`

**Body**: `{ reason: string (min 10) }`  
**Response 200** (`M0205`) | **422** nếu thiếu lý do

**Ghi chú**: Không có `OPENAI_API_KEY` → dùng mock catalog (local dev). Production: GPT-4o + scraper.

---

## Module 2 — Master data (hỗ trợ form)

### GET `/suppliers`

Danh sách `suppliers_jp` active (dropdown)

### GET `/product-categories`

Danh sách danh mục active

### GET `/exchange-rates/current`

Tỷ giá JPY→VND mới nhất: `{ "from_currency": "JPY", "to_currency": "VND", "rate": 170.5 }`
