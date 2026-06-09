# API Contract — Hệ thống Nhật-Việt

> **Phiên bản**: 2.0 | **Ngày**: 2026-06-07  
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

## Module 4 — Đơn hàng

### GET `/orders`

Query: `search`, `status`, `per_page` — Company chỉ thấy đơn của mình; Admin thấy tất cả

### POST `/orders`

**Body**: `{ items: [{ product_id, quantity, comment? }], biko?, submit?: boolean }`  
**Role**: Company only  
**Response 201** (`M0403`) — `submit=true` → `PENDING` + reserve tồn kho

### GET `/orders/{id}`

### PUT `/orders/{id}`

Chỉ `DRAFT`, Company owner

### PUT `/orders/{id}/submit`

`DRAFT → PENDING`

### PUT `/orders/{id}/confirm`

`PENDING → CONFIRMED`, lock `exchange_rate` — Admin only (`M0404`)

### PUT `/orders/{id}/cancel`

`DRAFT|PENDING → CANCELLED`, release reserve (`M0406`)

**Lỗi**: `M0401` vượt tồn kho · `M0407` IDOR

---

## Module 5 — Chuyến hàng (Shipment Batches)

### GET `/shipment-batches`

Query: `search`, `status`, `per_page` — Company chỉ thấy chuyến có đơn của mình

### GET `/shipment-batches/available-orders`

Đơn `CONFIRMED` chưa gom — Admin only

### POST `/shipment-batches`

**Body**: `{ batch_name, order_ids[], logistics_partner?, tracking_number?, estimated_departure_date? }`  
**Role**: Admin · **201** (`M0506`) — đơn → `PROCESSING`

### GET `/shipment-batches/{id}`

### PUT `/shipment-batches/{id}`

Sửa metadata / danh sách đơn (chỉ khi status &lt; IN_TRANSIT)

### PUT `/shipment-batches/{id}/status`

**Body**: `{ status }` — luồng: PREPARING → CUSTOMS_JP → IN_TRANSIT → CUSTOMS_VN → DELIVERED  
`DELIVERED` → tất cả đơn trong chuyến → `DELIVERED`

**Lỗi**: `M0501`–`M0507`

---

## Module 2 — Master data (hỗ trợ form)

### GET `/suppliers`

Danh sách `suppliers_jp` active (dropdown)

### GET `/product-categories`

Danh sách danh mục active

### GET `/exchange-rates/current`

Tỷ giá JPY→VND mới nhất: `{ "from_currency": "JPY", "to_currency": "VND", "rate": 170.5 }`

---

## ══════════════════════════════════════
## CHI TIẾT ĐẦY ĐỦ CÁC MODULE
## ══════════════════════════════════════

---

## Module 3 — AI Product Search (Chi tiết)

> Luồng 2 bước: (1) Tìm kiếm → nhận session_id → polling kết quả. (2) Admin duyệt candidate → tạo sản phẩm.

### POST `/ai/search`

**Auth**: Required (admin hoặc company)  
**Mô tả**: Khởi tạo phiên tìm kiếm AI. Trả về ngay session_id, xử lý bất đồng bộ.

**Request**:
```json
{ "keyword": "コラーゲン" }
```

**Response 202**:
```json
{
  "success": true,
  "data": {
    "session": {
      "id": 12,
      "keyword": "コラーゲン",
      "status": "processing"
    }
  },
  "message": "M0000"
}
```

---

### GET `/ai/search/{sessionId}`

**Mô tả**: Polling kết quả. Frontend gọi mỗi 2 giây cho đến khi status ≠ processing.

**Response 200 — Đang xử lý**:
```json
{
  "success": true,
  "data": { "status": "processing" },
  "message": "M0000"
}
```

**Response 200 — Có kết quả**:
```json
{
  "success": true,
  "data": {
    "status": "completed",
    "items": [
      {
        "product_name_jp": "森永 コラーゲンペプチド",
        "product_name_vn": null,
        "image_url": "https://thumbnail.image.rakuten.co.jp/xxx.jpg",
        "price_jpy": 2980,
        "source_url": "https://item.rakuten.co.jp/xxx",
        "source_platform": "rakuten",
        "description": "コラーゲンペプチド 200g..."
      }
    ]
  },
  "message": "M0000"
}
```

**Response 200 — Không có kết quả**: `message: "M0201"`, `items: []`  
**Response 200 — Timeout (>30s)**: `message: "M0202"`, `status: "timeout"`  
**Response 403**: Không phải session của mình (company)

---

### POST `/ai/candidates`

**Auth**: Admin only  
**Mô tả**: Gửi danh sách sản phẩm từ kết quả AI (hoặc nhập tay) lên để duyệt.

**Request**:
```json
{
  "session_id": 12,
  "items": [
    {
      "product_name_jp": "森永 コラーゲンペプチド",
      "product_name_vn": "Collagen Morinaga",
      "image_url": "https://...",
      "price_jpy": 2980,
      "source_url": "https://item.rakuten.co.jp/xxx",
      "source_platform": "rakuten",
      "description": "..."
    }
  ]
}
```

**Response 201** (`M0203`):
```json
{
  "success": true,
  "data": { "created_count": 3 },
  "message": "M0203"
}
```

---

### GET `/ai/candidates`

**Auth**: Admin only  
**Query**: `status=PENDING|APPROVED|REJECTED`, `page`, `per_page`

**Response 200**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 5,
        "product_name_jp": "森永 コラーゲンペプチド",
        "product_name_vn": "Collagen Morinaga",
        "image_url": "https://...",
        "price_jpy": 2980,
        "source_platform": "rakuten",
        "status": "PENDING",
        "created": "2026-06-07T10:00:00+00:00"
      }
    ],
    "pagination": { "current_page": 1, "per_page": 20, "total": 5 }
  },
  "message": "M0000"
}
```

---

### PUT `/ai/candidates/{id}/approve`

**Auth**: Admin only  
**Mô tả**: Duyệt candidate → tạo bản ghi trong `products`.

**Request**:
```json
{
  "product_category_id": 2,
  "product_name_vn": "Collagen Morinaga 200g",
  "cost_jpy": 2980,
  "price_vnd": 680000,
  "supplier_id": 3
}
```

**Response 200** (`M0204`):
```json
{
  "success": true,
  "data": {
    "product_id": 42,
    "candidate_status": "APPROVED"
  },
  "message": "M0204"
}
```

---

### PUT `/ai/candidates/{id}/reject`

**Auth**: Admin only

**Request**:
```json
{ "reason": "Sản phẩm này không phù hợp với danh mục kinh doanh" }
```

**Validation**: `reason` bắt buộc, tối thiểu 10 ký tự  
**Response 200** (`M0205`) | **422** nếu thiếu/quá ngắn lý do

---

### POST `/ai/product-search` *(Semantic search — tìm trong catalog nội bộ)*

**Auth**: Required  
**Mô tả**: Tìm kiếm sản phẩm đã có trong DB bằng AI embedding (cosine similarity).

**Request**:
```json
{
  "query": "thuốc bổ gan nhật bản",
  "limit": 15
}
```

**Validation**: `query` min:2 max:200, `limit` min:10 max:20

**Response 200**:
```json
{
  "success": true,
  "data": {
    "query": "thuốc bổ gan nhật bản",
    "count": 15,
    "items": [
      {
        "id": 3,
        "product_cd": "P003",
        "product_name": "Orihiro Liver Support",
        "product_name_jp": "肝臓サポート",
        "spec": "120 viên",
        "unit": "hộp",
        "cost_jpy": 2800,
        "price_vnd": 650000,
        "origin": "Nhật Bản",
        "import_tax_rate": "10.00",
        "category": "Thực phẩm chức năng",
        "supplier": "Orihiro JP",
        "image_url": "https://storage.../liver-support.jpg",
        "images": [
          { "url": "https://storage.../liver-1.jpg", "is_primary": true,  "order_no": 0 },
          { "url": "https://storage.../liver-2.jpg", "is_primary": false, "order_no": 1 }
        ]
      }
    ]
  },
  "message": "M0000"
}
```

---

## Module 4 — Đơn hàng (Chi tiết)

### Trạng thái đơn hàng

```
DRAFT → PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
                 ↘ CANCELLED (từ DRAFT hoặc PENDING)
```

| Status | Người đổi | Ghi chú |
|--------|-----------|---------|
| DRAFT | Company | Đang soạn, có thể sửa |
| PENDING | Company | Đã gửi, chờ JP xác nhận. Reserve tồn kho |
| CONFIRMED | Admin | Lock exchange_rate tại thời điểm này |
| PROCESSING | Admin/Batch | Gom vào chuyến hàng |
| SHIPPED | Batch | Chuyến → IN_TRANSIT |
| DELIVERED | Batch | Chuyến → DELIVERED |
| CANCELLED | Company/Admin | Từ DRAFT hoặc PENDING. Release reserve |

---

### GET `/orders`

**Auth**: Required  
**Query**: `search`, `status`, `company_vn_id` (admin only), `page`, `per_page`  
**Phân quyền**: Company chỉ thấy đơn của mình | Admin thấy tất cả

**Response 200**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "order_no": "ORD-20260607-0001",
        "status": "PENDING",
        "company_name": "Công ty ABC",
        "order_date": "2026-06-07",
        "expected_date": "2026-07-01",
        "total_jpy": 45000,
        "total_vnd": 7650000,
        "exchange_rate": "170.00",
        "item_count": 3
      }
    ],
    "pagination": { "current_page": 1, "per_page": 20, "total": 12 }
  },
  "message": "M0000"
}
```

---

### POST `/orders`

**Auth**: Company only  
**Mô tả**: Tạo đơn mới. `submit: true` → chuyển thẳng sang PENDING.

**Request**:
```json
{
  "items": [
    { "product_id": 1, "quantity": 10, "comment": "Giao trước Tết" },
    { "product_id": 3, "quantity": 5  }
  ],
  "biko": "Ghi chú chung đơn hàng",
  "submit": false
}
```

**Validation**:
- `items` required, ít nhất 1 dòng
- `quantity` ≥ `products.min_quantity`, ≤ `products.max_quantity` (nếu set)
- Số lượng không vượt tồn kho khả dụng (`quantity - reserved_qty`)

**Response 201** (`M0403`):
```json
{
  "success": true,
  "data": {
    "id": 10,
    "order_no": "ORD-20260607-0010",
    "status": "DRAFT",
    "total_jpy": 45000,
    "total_vnd": 7650000,
    "exchange_rate": "170.00"
  },
  "message": "M0403"
}
```

**Response 409** (`M0401`): Vượt tồn kho  
**Response 403** (`M0407`): Không có quyền

---

### GET `/orders/{id}`

**Auth**: Required | Company chỉ xem đơn của mình

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": 10,
    "order_no": "ORD-20260607-0010",
    "status": "PENDING",
    "company": { "id": 2, "company_name": "Công ty ABC" },
    "handler_admin": { "id": 1, "full_name": "Tanaka Admin" },
    "order_date": "2026-06-07",
    "expected_date": "2026-07-01",
    "exchange_rate": "170.00",
    "total_jpy": 45000,
    "total_vnd": 7650000,
    "shipping_fee": 500000,
    "import_tax": 765000,
    "biko": "Ghi chú chung",
    "items": [
      {
        "id": 1,
        "product_id": 1,
        "product_name": "Vitamin C",
        "product_name_jp": "ビタミンC",
        "image_url": "https://...",
        "quantity": 10,
        "unit_price_jpy": 1500,
        "unit_price_vnd": 255000,
        "subtotal_vnd": 2550000,
        "import_tax_rate": "10.00",
        "import_tax_amt": 255000,
        "comment": "Giao trước Tết"
      }
    ]
  },
  "message": "M0000"
}
```

---

### PUT `/orders/{id}`

**Auth**: Company owner | Chỉ khi status = DRAFT  
**Mô tả**: Cập nhật toàn bộ đơn (replace items).

**Request**: Giống POST `/orders`

**Response 200** (`M0403`) | **409** nếu không phải DRAFT

---

### PUT `/orders/{id}/submit`

**Auth**: Company owner | Chỉ khi status = DRAFT

**Response 200** (`M0404`):
```json
{
  "success": true,
  "data": { "status": "PENDING" },
  "message": "M0404"
}
```

**Side effect**: `inventories.reserved_qty += quantity` cho mỗi dòng

---

### PUT `/orders/{id}/confirm`

**Auth**: Admin only | Chỉ khi status = PENDING

**Response 200** (`M0404`):
```json
{
  "success": true,
  "data": {
    "status": "CONFIRMED",
    "exchange_rate": "170.50"
  },
  "message": "M0404"
}
```

**Side effect**: Lock `orders.exchange_rate` = tỷ giá hiện tại từ `exchange_rates`

---

### PUT `/orders/{id}/cancel`

**Auth**: Company owner (DRAFT/PENDING) | Admin (bất kỳ trạng thái trước SHIPPED)

**Request**:
```json
{ "reason": "Thay đổi kế hoạch nhập hàng" }
```

**Response 200** (`M0406`):
```json
{
  "success": true,
  "data": { "status": "CANCELLED" },
  "message": "M0406"
}
```

**Side effect**: `inventories.reserved_qty -= quantity` (release reserve)

---

## Module 5 — Chuyến hàng (Chi tiết)

### Trạng thái chuyến hàng

```
PREPARING → CUSTOMS_JP → IN_TRANSIT → CUSTOMS_VN → DELIVERED
```

| Status | Ý nghĩa | Side effect |
|--------|---------|-------------|
| PREPARING | Đang gom hàng | Đơn → PROCESSING |
| CUSTOMS_JP | Thông quan phía Nhật | — |
| IN_TRANSIT | Đang vận chuyển | Không sửa danh sách đơn nữa |
| CUSTOMS_VN | Thông quan phía VN | — |
| DELIVERED | Đã giao | Tất cả đơn → DELIVERED |

---

### GET `/shipment-batches`

**Auth**: Required  
**Query**: `search`, `status`, `page`, `per_page`  
**Phân quyền**: Company chỉ thấy chuyến có đơn của mình | Admin thấy tất cả

**Response 200**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "batch_no": "BAT-20260607-0001",
        "batch_name": "Chuyến tháng 6/2026",
        "status": "IN_TRANSIT",
        "logistics_partner": "Yamato Transport",
        "tracking_number": "YT123456789",
        "estimated_departure_date": "2026-06-15",
        "order_count": 5,
        "created_admin": "Tanaka Admin"
      }
    ],
    "pagination": { "current_page": 1, "per_page": 20, "total": 3 }
  },
  "message": "M0000"
}
```

---

### GET `/shipment-batches/available-orders`

**Auth**: Admin only  
**Mô tả**: Danh sách đơn status=CONFIRMED chưa thuộc chuyến nào, để Admin chọn khi tạo chuyến.

**Response 200**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 10,
        "order_no": "ORD-20260607-0010",
        "company_name": "Công ty ABC",
        "total_jpy": 45000,
        "order_date": "2026-06-07"
      }
    ]
  },
  "message": "M0000"
}
```

---

### POST `/shipment-batches`

**Auth**: Admin only  
**Validation**: `order_ids` tất cả phải status=CONFIRMED và chưa trong chuyến (RULE-BATCH-01, 02)

**Request**:
```json
{
  "batch_name": "Chuyến tháng 6/2026",
  "order_ids": [10, 11, 12],
  "logistics_partner": "Yamato Transport",
  "tracking_number": "YT123456789",
  "estimated_departure_date": "2026-06-15"
}
```

**Response 201** (`M0506`):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "batch_no": "BAT-20260607-0001",
    "status": "PREPARING"
  },
  "message": "M0506"
}
```

**Response 409** (`M0501`): Đơn không phải CONFIRMED  
**Response 409** (`M0502`): Đơn đã thuộc chuyến khác  
**Response 422** (`M0503`): Không có đơn nào

---

### GET `/shipment-batches/{id}`

**Auth**: Required

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "batch_no": "BAT-20260607-0001",
    "batch_name": "Chuyến tháng 6/2026",
    "status": "PREPARING",
    "logistics_partner": "Yamato Transport",
    "tracking_number": "YT123456789",
    "estimated_departure_date": "2026-06-15",
    "created_admin": { "id": 1, "full_name": "Tanaka Admin" },
    "orders": [
      {
        "id": 10,
        "order_no": "ORD-20260607-0010",
        "company_name": "Công ty ABC",
        "total_jpy": 45000,
        "status": "PROCESSING"
      }
    ]
  },
  "message": "M0000"
}
```

---

### PUT `/shipment-batches/{id}`

**Auth**: Admin only | Chỉ khi status < IN_TRANSIT (RULE-BATCH-04)

**Request**:
```json
{
  "batch_name": "Chuyến tháng 6/2026 (cập nhật)",
  "order_ids": [10, 11, 12, 13],
  "logistics_partner": "Yamato Transport",
  "tracking_number": "YT999999999",
  "estimated_departure_date": "2026-06-20"
}
```

**Response 200** (`M0506`) | **409** (`M0504`): Đã IN_TRANSIT+

---

### PUT `/shipment-batches/{id}/status`

**Auth**: Admin only

**Request**:
```json
{ "status": "CUSTOMS_JP" }
```

**Luồng hợp lệ**: PREPARING → CUSTOMS_JP → IN_TRANSIT → CUSTOMS_VN → DELIVERED  
**Response 200** (`M0506`)  
**Response 422** (`M0505`): Chuyển status không hợp lệ  

**Side effect khi DELIVERED**: Tất cả `orders` trong chuyến → status = DELIVERED

---

## Module 6 — Suppliers (Chi tiết)

### GET `/suppliers`

**Auth**: Required  
**Query**: `search`, `disabled_flag`, `page`, `per_page`

**Response 200**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "supplier_cd": "SUP001",
        "supplier_name": "Orihiro Co., Ltd",
        "supplier_name_jp": "オリヒロ株式会社",
        "address": "Gunma, Japan",
        "tel": "+81-27-xxx-xxxx",
        "email": "contact@orihiro.co.jp",
        "contact_name": "Yamamoto",
        "disabled_flag": false,
        "product_count": 12
      }
    ],
    "pagination": { "current_page": 1, "per_page": 20, "total": 8 }
  },
  "message": "M0000"
}
```

---

### GET `/suppliers/{id}`

**Response 200**: Chi tiết + danh sách sản phẩm của nhà cung cấp đó

---

### POST `/suppliers`

**Auth**: Admin only

**Request**:
```json
{
  "supplier_cd": "SUP002",
  "supplier_name": "DHC Co., Ltd",
  "supplier_name_jp": "株式会社DHC",
  "address": "Tokyo, Japan",
  "tel": "+81-3-xxx-xxxx",
  "email": "info@dhc.co.jp",
  "contact_name": "Sato",
  "memo": ""
}
```

**Response 201** (`M0601`) | **409** (`M0602`): Mã supplier trùng

---

### PUT `/suppliers/{id}`

**Auth**: Admin only  
**Response 200** (`M0601`) | **404** (`M0604`): Không tìm thấy

---

### DELETE `/suppliers/{id}`

**Auth**: Admin only  
**Response 200** (`M0603`) | **409** (`M0605`): Đang có sản phẩm liên kết

---

## Module 7 — Import Declarations (Tờ khai hải quan)

### Trạng thái thông quan

| Giá trị | Mô tả |
|---------|-------|
| 0 (PENDING) | Chờ khai báo |
| 1 (PROCESSING) | Đang xử lý |
| 2 (CLEARED) | Thông quan |
| 3 (REJECTED) | Từ chối |

---

### GET `/import-declarations`

**Auth**: Admin only  
**Query**: `order_id`, `customs_status`, `page`, `per_page`

**Response 200**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "order_id": 10,
        "order_no": "ORD-20260607-0010",
        "declaration_no": "VN-2026-00123",
        "declaration_date": "2026-06-20",
        "customs_status": 1,
        "port_of_entry": "Cảng Cát Lái",
        "declared_value_jpy": 45000,
        "total_tax_vnd": 765000,
        "declaration_file": "https://storage.../decl-001.pdf"
      }
    ],
    "pagination": { "current_page": 1, "per_page": 20, "total": 5 }
  },
  "message": "M0000"
}
```

---

### POST `/import-declarations`

**Auth**: Admin only

**Request**:
```json
{
  "order_id": 10,
  "declaration_no": "VN-2026-00123",
  "declaration_date": "2026-06-20",
  "customs_status": 0,
  "port_of_entry": "Cảng Cát Lái",
  "declared_value_jpy": 45000,
  "total_tax_vnd": 765000,
  "memo": ""
}
```

**Response 201** (`M0701`) | **409**: Đơn đã có tờ khai

---

### PUT `/import-declarations/{id}`

**Auth**: Admin only  
**Response 200** (`M0701`)

---

### POST `/import-declarations/{id}/upload-file`

**Auth**: Admin only  
**Content-Type**: `multipart/form-data`  
**Body**: `file` (PDF, max 10MB)

**Response 200**:
```json
{
  "success": true,
  "data": { "declaration_file": "https://storage.../decl-001.pdf" },
  "message": "M0000"
}
```

---

## Module 8 — Exchange Rates (Quản lý tỷ giá)

### GET `/exchange-rates`

**Auth**: Admin only  
**Query**: `page`, `per_page`  
**Mô tả**: Lịch sử tất cả tỷ giá

**Response 200**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 5,
        "from_currency": "JPY",
        "to_currency": "VND",
        "rate": "170.5000",
        "apply_date": "2026-06-07",
        "source": "Vietcombank",
        "memo": ""
      }
    ],
    "pagination": { "current_page": 1, "per_page": 30, "total": 45 }
  },
  "message": "M0000"
}
```

---

### GET `/exchange-rates/current`

**Auth**: Required  
**Mô tả**: Tỷ giá đang áp dụng (apply_date gần nhất ≤ hôm nay)

**Response 200**:
```json
{
  "success": true,
  "data": {
    "from_currency": "JPY",
    "to_currency": "VND",
    "rate": "170.5000",
    "apply_date": "2026-06-07",
    "source": "Vietcombank"
  },
  "message": "M0000"
}
```

---

### POST `/exchange-rates`

**Auth**: Admin only

**Request**:
```json
{
  "rate": 171.5,
  "apply_date": "2026-06-08",
  "source": "Vietcombank",
  "memo": "Cập nhật hàng tuần"
}
```

**Validation**: `apply_date` không được trước hôm nay  
**Response 201** (`M0801`) | **409** (`M0802`): Đã có tỷ giá cho ngày này

---

## Module 9 — Admin (Quản trị hệ thống)

### GET `/admin/admins`

**Auth**: Admin only  
**Query**: `search`, `disabled_flag`, `page`, `per_page`

**Response 200**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "login_id": "admin",
        "full_name": "Super Admin",
        "email": "admin@japan-product.local",
        "disabled_flag": false,
        "created": "2026-01-01T00:00:00+00:00"
      }
    ],
    "pagination": { "current_page": 1, "per_page": 20, "total": 3 }
  },
  "message": "M0000"
}
```

---

### POST `/admin/admins`

**Auth**: Admin only

**Request**:
```json
{
  "login_id": "admin02",
  "password": "Admin@123",
  "full_name": "Yamada Admin",
  "email": "yamada@japan-product.local"
}
```

**Response 201** (`M0901`) | **409** (`M0902`): login_id trùng

---

### PUT `/admin/admins/{id}`

**Auth**: Admin only  
**Request**: `full_name`, `email`, `disabled_flag`  
**Response 200** (`M0901`)

---

### PUT `/admin/admins/{id}/reset-password`

**Auth**: Admin only

**Request**:
```json
{ "new_password": "NewPass@456" }
```

**Response 200** (`M0000`)

---

### GET `/admin/companies`

**Auth**: Admin only  
**Query**: `search`, `disabled_flag`, `page`, `per_page`

**Response 200**: Danh sách `companies_vn` (giống format suppliers nhưng thêm `login_id`)

---

### POST `/admin/companies`

**Auth**: Admin only

**Request**:
```json
{
  "company_cd": "VN001",
  "company_name": "Công ty TNHH ABC",
  "login_id": "vn_abc",
  "password": "Abc@12345",
  "address": "123 Lê Lợi, Q1, TP.HCM",
  "province": "TP. Hồ Chí Minh",
  "tel": "028-xxxx-xxxx",
  "email": "contact@abc.vn",
  "tax_code": "0123456789",
  "contact_name": "Nguyễn Văn A",
  "memo": ""
}
```

**Response 201** (`M0903`) | **409** (`M0904`): login_id hoặc company_cd trùng

---

### PUT `/admin/companies/{id}`

**Auth**: Admin only  
**Response 200** (`M0903`)

---

### PUT `/admin/companies/{id}/toggle`

**Auth**: Admin only  
**Mô tả**: Kích hoạt / vô hiệu hóa tài khoản company.

**Response 200**:
```json
{
  "success": true,
  "data": { "disabled_flag": true },
  "message": "M0000"
}
```

---

## Bảng Message Codes đầy đủ

| Code | Module | Ý nghĩa |
|------|--------|---------|
| M0000 | All | Thành công chung |
| M0101 | Auth | Sai login_id/password |
| M0102 | Auth | Tài khoản vô hiệu hóa |
| M0103 | Auth | Đăng nhập thành công |
| M0201 | AI Search | Không có kết quả tìm kiếm |
| M0202 | AI Search | Timeout tìm kiếm (>30s) |
| M0203 | AI Search | Tạo candidates thành công |
| M0204 | AI Search | Duyệt candidate thành công |
| M0205 | AI Search | Từ chối candidate thành công |
| M0301 | Products | Tạo/cập nhật sản phẩm thành công |
| M0302 | Products | Mã sản phẩm đã tồn tại |
| M0303 | Products | Xóa sản phẩm thành công |
| M0304 | Products | Không xóa được (có đơn hàng liên quan) |
| M0401 | Orders | Vượt số lượng tồn kho khả dụng |
| M0403 | Orders | Tạo/cập nhật đơn thành công |
| M0404 | Orders | Chuyển trạng thái đơn thành công |
| M0406 | Orders | Hủy đơn thành công |
| M0407 | Orders | Không có quyền truy cập đơn này |
| M0501 | Batch | Đơn không ở trạng thái CONFIRMED |
| M0502 | Batch | Đơn đã thuộc chuyến khác |
| M0503 | Batch | Chuyến phải có ít nhất 1 đơn |
| M0504 | Batch | Không sửa đơn khi chuyến đã IN_TRANSIT+ |
| M0505 | Batch | Chuyển trạng thái chuyến không hợp lệ |
| M0506 | Batch | Tạo/cập nhật chuyến thành công |
| M0507 | Batch | Không có quyền truy cập chuyến |
| M0601 | Suppliers | Tạo/cập nhật NCC thành công |
| M0602 | Suppliers | Mã NCC đã tồn tại |
| M0603 | Suppliers | Xóa NCC thành công |
| M0604 | Suppliers | Không tìm thấy NCC |
| M0605 | Suppliers | NCC đang có sản phẩm liên kết |
| M0701 | Declarations | Tạo/cập nhật tờ khai thành công |
| M0702 | Declarations | Đơn đã có tờ khai |
| M0801 | Exchange | Tạo tỷ giá thành công |
| M0802 | Exchange | Đã có tỷ giá cho ngày này |
| M0901 | Admin | Tạo/cập nhật admin thành công |
| M0902 | Admin | login_id admin đã tồn tại |
| M0903 | Admin | Tạo/cập nhật company thành công |
| M0904 | Admin | login_id hoặc mã công ty đã tồn tại |

---

## Module 10 — Notifications (V3)

> Auth: `auth:sanctum` — tất cả role

### GET `/notifications`

Danh sách thông báo của user hiện tại (phân trang).

**Query params**: `per_page` (default 15), `unread_only` (boolean)

**Response 200**:
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": 1,
        "type": "order_status_changed",
        "title": "Đơn hàng ORD-202606-0001 đã được duyệt",
        "body": "Admin đã duyệt đơn hàng của bạn.",
        "is_read": false,
        "read_at": null,
        "created_at": "2026-06-08T10:00:00Z"
      }
    ],
    "total": 5,
    "unread_count": 3
  }
}
```

---

### GET `/notifications/count`

Số thông báo chưa đọc (dùng cho badge header — poll mỗi 60s).

**Response 200**:
```json
{ "success": true, "data": { "unread_count": 3 } }
```

---

### PUT `/notifications/{id}/read`

Đánh dấu 1 thông báo đã đọc.

**Response 200**: `{ "success": true, "message": "Marked as read" }`

---

### PUT `/notifications/read-all`

Đánh dấu tất cả thông báo đã đọc.

**Response 200**: `{ "success": true, "data": { "updated": 3 } }`

---

## Module 11 — Inventory CRUD (V3)

> Auth: `auth:sanctum` + `role:admin`

### PUT `/inventories/{id}`

Cập nhật thông tin kho của một inventory record.

**Request body**:
```json
{
  "min_stock_qty": 20,
  "restock_status": "LOW",
  "restock_eta": "2026-07-15",
  "notes": "Cần nhập thêm từ Osaka"
}
```

**Validation**:
- `restock_status`: enum `NORMAL|LOW|CRITICAL|ON_ORDER`
- `restock_eta`: nullable, date format `Y-m-d`

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "product_id": 12,
    "warehouse_id": 1,
    "quantity": 50,
    "reserved_qty": 5,
    "available_qty": 45,
    "min_stock_qty": 20,
    "restock_status": "LOW",
    "restock_eta": "2026-07-15",
    "notes": "Cần nhập thêm từ Osaka"
  }
}
```

---

### DELETE `/inventories/{id}`

Soft-delete một inventory record (đặt `deleted_flag = true`).

**Response 200**: `{ "success": true, "message": "Inventory deleted" }`

**Lỗi 422**: Nếu record có `reserved_qty > 0` (đang giữ hàng cho đơn).

---

### POST `/inventories/bulk-import`

Import hàng loạt từ file CSV.

**Request**: `multipart/form-data`
- `file`: file CSV (mimes: csv,txt, max 2MB)

**CSV format** (header row bắt buộc):
```
product_cd,warehouse_id,quantity,min_stock_qty,notes
JP-FOD-00012,1,100,20,Nhap tu Osaka
```

**Response 200**:
```json
{
  "success": true,
  "data": {
    "imported": 45,
    "total_rows": 47,
    "errors": [
      "Dong 3: product_cd 'JP-XYZ-99999' khong ton tai",
      "Dong 12: warehouse_id '99' khong hop le"
    ]
  }
}
```

---

## Module 12 — Profile (V3)

> Auth: `auth:sanctum` — tất cả role

### GET `/profile`

Thông tin profile của user đang đăng nhập.

**Response 200**:
```json
{
  "success": true,
  "data": {
    "user_type": "admin",
    "id": 1,
    "name": "Super Admin",
    "login_id": "admin",
    "email": "admin@example.com",
    "phone": "090-1234-5678",
    "avatar_url": "https://r2.example.com/avatars/admin.jpg",
    "role_display": "Admin (JP Agency)",
    "company_name": null,
    "branch_name": null,
    "created_at": "2026-06-07T00:00:00Z"
  }
}
```

---

### PUT `/profile`

Cập nhật thông tin profile (không thể đổi login_id, email, role).

**Request body**:
```json
{
  "name": "Nguyen Admin",
  "phone": "090-9999-8888",
  "avatar_url": "https://r2.example.com/avatars/new.jpg"
}
```

**Response 200**: `{ "success": true, "data": { /* updated profile */ } }`

---

## Module 13 — AI Purchasing Specialist (V3 + AI-P)

> Auth: `auth:sanctum` + `role:admin,company`

### POST `/ai/purchasing`

Phân tích và tư vấn sản phẩm thu mua dựa trên yêu cầu của user.

**Request body**:
```json
{
  "query": "Tìm kem dưỡng ẩm ban đêm cho da khô, ưu tiên thương hiệu Nhật",
  "budget_jpy": 3000,
  "qty": 50,
  "preferences": "Không paraben, có thể dùng cho da nhạy cảm"
}
```

**Validation**:
- `query`: required, string, max 500
- `budget_jpy`: nullable, integer, min 1
- `qty`: nullable, integer, min 1, max 10000
- `preferences`: nullable, string, max 500

**Xử lý (5 bước)**:
1. Dịch từ khóa VI → JP (RakutenKeywordTranslatorService)
2. Tìm kiếm Rakuten (10 kết quả) + catalog nội bộ (5 kết quả)
3. Merge & deduplicate (theo tên chuẩn hóa 20 ký tự đầu)
4. Chấm điểm từng sản phẩm theo 5 tiêu chí
5. Sinh báo cáo GPT (cache 1h)

**Response 200**:
```json
{
  "success": true,
  "data": {
    "query": "Kem dưỡng ẩm ban đêm",
    "keyword_jp": "夜間保湿クリーム 乾燥肌",
    "results": [
      {
        "rank": 1,
        "name": "DHC Olive Virgin Oil Moisturizer",
        "name_jp": "DHCオリーブバージンオイル",
        "price_jpy": 1980,
        "price_vnd_est": 330000,
        "brand": "DHC",
        "review_score": 4.5,
        "review_count": 1250,
        "image_url": "https://...",
        "url": "https://item.rakuten.co.jp/...",
        "source": "rakuten",
        "scores": {
          "price": 9.0,
          "quality": 9.0,
          "popularity": 10.0,
          "warranty": 5.0,
          "brand": 9.0,
          "total": 8.95
        }
      }
    ],
    "recommendation": "DHC Olive Virgin Oil Moisturizer — tổng điểm 8.95/10",
    "report": "Dựa trên phân tích 8 sản phẩm, DHC là lựa chọn tốt nhất..."
  }
}
```

**Scoring weights**:
| Tiêu chí | Trọng số | Thang điểm |
|----------|---------|-----------|
| Price (Giá) | 30% | JPY≤1000:10 / ≤2000:9 / ≤3500:8 / ≤5000:7 / ≤8000:6 / ≤15000:5 / else:4 |
| Quality (Chất lượng) | 30% | review_score × 2 |
| Popularity (Độ phổ biến) | 20% | ≥1000 reviews:10 / ≥500:9 / ≥100:8 / ≥50:7 / ≥10:6 / >0:5 |
| Warranty (Bảo hành) | 10% | ≥24th:10 / ≥12th:8 / khác:5 |
| Brand (Thương hiệu) | 10% | TRUSTED_BRANDS lookup (DHC,FANCL,Sony...) |

---

---

## Module 14 — Stock Movements (V3)

**Base URL**: `/api/stock-movements`  
**Auth**: Bearer token required  
**Phân quyền**: Admin / JP Agency

### GET /stock-movements

| Query param | Kiểu | Mô tả |
|-------------|------|-------|
| `movement_type` | string | `IN` hoặc `OUT` |
| `product_id` | integer | Lọc theo sản phẩm |
| `warehouse_id` | integer | Lọc theo kho |
| `from_date` | date | Y-m-d |
| `to_date` | date | Y-m-d |
| `per_page` | integer | max 100, default 50 |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "summary": { "total_in": 500, "total_out": 120, "net": 380 },
    "items": [{
      "id": 1, "movement_type": "IN",
      "product_id": 5, "product_name": "DHC Collagen",
      "warehouse_id": 1, "warehouse_name": "Kho HN",
      "quantity": 100, "quantity_before": 50, "quantity_after": 150,
      "ref_type": "shipment_batch", "ref_id": 3,
      "reason": "Nhập kho theo chuyến hàng #3",
      "created": "2026-06-09T10:00:00Z"
    }],
    "pagination": { "current_page": 1, "per_page": 50, "total": 80, "last_page": 2 }
  }
}
```

---

### POST /stock-movements

Nhập/xuất kho thủ công.

**Request body**:
```json
{
  "movement_type": "IN",
  "product_id": 5,
  "warehouse_id": 1,
  "quantity": 50,
  "reason": "Nhập kho thủ công từ nhà cung cấp",
  "ref_type": "manual",
  "note": "Lô hàng tháng 6"
}
```

| Field | Required | Ghi chú |
|-------|----------|---------|
| `movement_type` | ✅ | `IN` hoặc `OUT` |
| `product_id` | ✅ | exists:products |
| `warehouse_id` | ✅ | exists:warehouses |
| `quantity` | ✅ | integer ≥ 1 |
| `reason` | — | max 500 |
| `ref_type` | — | `manual` / `csv_import` / `shipment_batch` / `order` |
| `note` | — | Ghi chú thêm |

**Response 201**: `{ "success": true, "message": "M1001", "data": { "movement": { "id": 99, "quantity_before": 100, "quantity_after": 150 } } }`

**Lỗi**: `422` validation fail · `409` OUT khi available_qty không đủ (M1002) · `404` product/warehouse không tồn tại

> **INV-001 note**: `PUT /shipment-batches/{id}/advance-status` nay nhận thêm `warehouse_id` optional. Nếu không truyền → dùng `defaultWarehouse()`.

---

## Cập nhật Message Codes (V3)

| Code | Module | Mô tả |
|------|--------|-------|
| M1001 | Stock Movements | Nhập/xuất kho thành công |
| M1002 | Stock Movements | Tồn kho không đủ để xuất |
| M1101 | Notifications | Đánh dấu đã đọc thành công |
| M1102 | Notifications | Thông báo không tồn tại hoặc không phải của bạn |
| M1201 | Inventory | Cập nhật inventory thành công |
| M1202 | Inventory | Xóa inventory thành công |
| M1203 | Inventory | Không xóa được — đang có reserved_qty > 0 |
| M1204 | Inventory | CSV import: file không hợp lệ |
| M1301 | Profile | Cập nhật profile thành công |
| M1401 | AI Purchasing | Phân tích thành công |
| M1402 | AI Purchasing | Không tìm thấy sản phẩm phù hợp |
| M1403 | AI Purchasing | AI service chưa được cấu hình (thiếu API key) |
