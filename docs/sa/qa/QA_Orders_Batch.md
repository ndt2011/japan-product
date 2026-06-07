# QA Test Cases — Orders & Shipment Batches

> **Ngày**: 2026-06-07 | **Liên quan**: Module 4 (Orders) + Module 5 (Shipment Batches)  
> **Cách dùng**: Tick ✅ khi pass, ghi [FAIL] + mô tả khi fail

---

## Chuẩn bị (Setup)

```bash
# Seed data test
php artisan db:seed --class=TestOrderSeeder

# Tài khoản test
Admin:   login_id=test_admin   / password=Admin@123
Company: login_id=test_company / password=Company@123
```

---

## ORDERS — Test Cases

### TC-ORD-001 — Tạo đơn hàng mới (DRAFT)

**Mục tiêu**: Company tạo đơn thành công  
**Role**: company

```http
POST /api/orders
Authorization: Bearer {company_token}
{
  "items": [
    { "product_id": 1, "quantity": 5 },
    { "product_id": 2, "quantity": 3 }
  ],
  "biko": "Giao trước ngày 30"
}
```

| # | Kiểm tra | Kỳ vọng | Kết quả |
|---|---------|---------|---------|
| 1 | HTTP status | 201 | |
| 2 | `data.status` | `"DRAFT"` | |
| 3 | `data.order_no` | Bắt đầu bằng `ORD-` | |
| 4 | `data.total_jpy` | > 0 | |
| 5 | `data.exchange_rate` | = tỷ giá hiện tại | |
| 6 | `inventories.reserved_qty` | Không thay đổi (chưa submit) | |

---

### TC-ORD-002 — Tạo đơn với `submit: true`

**Mục tiêu**: Tạo và gửi ngay, status phải là PENDING

```http
POST /api/orders
{ "items": [...], "submit": true }
```

| # | Kiểm tra | Kỳ vọng | Kết quả |
|---|---------|---------|---------|
| 1 | `data.status` | `"PENDING"` | |
| 2 | `inventories.reserved_qty` | Tăng đúng số lượng | |

---

### TC-ORD-003 — Vượt tồn kho

**Mục tiêu**: Từ chối nếu quantity > tồn kho khả dụng

```http
POST /api/orders
{ "items": [{ "product_id": 1, "quantity": 99999 }], "submit": true }
```

| # | Kiểm tra | Kỳ vọng | Kết quả |
|---|---------|---------|---------|
| 1 | HTTP status | 409 | |
| 2 | `message` | `"M0401"` | |

---

### TC-ORD-004 — Admin không tạo được đơn

**Role**: admin

```http
POST /api/orders
{ "items": [...] }
```

| # | Kiểm tra | Kỳ vọng | Kết quả |
|---|---------|---------|---------|
| 1 | HTTP status | 403 | |

---

### TC-ORD-005 — Submit đơn (DRAFT → PENDING)

**Mục tiêu**: Company submit đơn DRAFT thành công

```http
PUT /api/orders/{draft_order_id}/submit
Authorization: Bearer {company_token}
```

| # | Kiểm tra | Kỳ vọng | Kết quả |
|---|---------|---------|---------|
| 1 | HTTP status | 200 | |
| 2 | `data.status` | `"PENDING"` | |
| 3 | `inventories.reserved_qty` | Tăng đúng số lượng | |
| 4 | Submit đơn đã PENDING | 409 | |

---

### TC-ORD-006 — Submit đơn của company khác

**Mục tiêu**: IDOR — không submit được đơn của người khác

```http
PUT /api/orders/{other_company_order_id}/submit
Authorization: Bearer {company_token}
```

| # | Kiểm tra | Kỳ vọng | Kết quả |
|---|---------|---------|---------|
| 1 | HTTP status | 403 | |
| 2 | `message` | `"M0407"` | |

---

### TC-ORD-007 — Admin xác nhận đơn (PENDING → CONFIRMED)

**Role**: admin

```http
PUT /api/orders/{pending_order_id}/confirm
Authorization: Bearer {admin_token}
```

| # | Kiểm tra | Kỳ vọng | Kết quả |
|---|---------|---------|---------|
| 1 | HTTP status | 200 | |
| 2 | `data.status` | `"CONFIRMED"` | |
| 3 | `orders.exchange_rate` | Lock = tỷ giá hiện tại | |
| 4 | Company confirm | 403 | |
| 5 | Confirm đơn DRAFT | 409 | |

---

### TC-ORD-008 — Hủy đơn

**Case A**: Company hủy đơn DRAFT (của mình)

```http
PUT /api/orders/{draft_order_id}/cancel
Authorization: Bearer {company_token}
{ "reason": "Thay đổi kế hoạch" }
```

**Case B**: Company hủy đơn PENDING (của mình)  
**Case C**: Company hủy đơn của company khác → 403  
**Case D**: Admin hủy đơn bất kỳ (DRAFT/PENDING)

| # | Kiểm tra | Case A | Case B | Case C | Case D |
|---|---------|--------|--------|--------|--------|
| 1 | HTTP status | 200 | 200 | 403 | 200 |
| 2 | `data.status` | CANCELLED | CANCELLED | — | CANCELLED |
| 3 | `reserved_qty` release | Không đổi | Giảm về | — | Giảm về |

---

### TC-ORD-009 — Sửa đơn DRAFT

```http
PUT /api/orders/{draft_order_id}
{ "items": [...new items...] }
```

| # | Kiểm tra | Kỳ vọng | Kết quả |
|---|---------|---------|---------|
| 1 | HTTP status | 200 | |
| 2 | Sửa đơn PENDING | 409 | |
| 3 | Company sửa đơn của mình | 200 | |
| 4 | Company sửa đơn khác | 403 | |

---

### TC-ORD-010 — Xem danh sách đơn

```http
GET /api/orders
```

| # | Kiểm tra | Admin | Company |
|---|---------|-------|---------|
| 1 | Thấy đơn của mình | ✓ | ✓ |
| 2 | Thấy đơn của company khác | ✓ | ✗ |
| 3 | Filter `status=PENDING` | ✓ | ✓ |

---

### TC-ORD-011 — Email khi tạo đơn mới (BE-021)

**Mục tiêu**: Sau khi submit đơn → gửi email thông báo → log vào `mail_histories`

| # | Kiểm tra | Kỳ vọng | Kết quả |
|---|---------|---------|---------|
| 1 | `mail_histories` có record mới | Yes | |
| 2 | `send_status` | 1 (đã gửi) | |
| 3 | `to_address` | Email của admin | |
| 4 | Subject chứa order_no | Yes | |

---

### TC-ORD-012 — Email khi admin confirm đơn (BE-021)

| # | Kiểm tra | Kỳ vọng | Kết quả |
|---|---------|---------|---------|
| 1 | `mail_histories` có record mới | Yes | |
| 2 | `to_address` | Email company | |
| 3 | Subject chứa `CONFIRMED` + order_no | Yes | |
| 4 | `send_status` | 1 | |

---

## SHIPMENT BATCHES — Test Cases

### TC-BATCH-001 — Tạo chuyến hàng

**Role**: admin  
**Điều kiện**: Có ít nhất 1 đơn CONFIRMED

```http
POST /api/shipment-batches
Authorization: Bearer {admin_token}
{
  "batch_name": "Chuyến tháng 6",
  "order_ids": [confirmed_order_id_1, confirmed_order_id_2],
  "logistics_partner": "Yamato",
  "estimated_departure_date": "2026-06-20"
}
```

| # | Kiểm tra | Kỳ vọng | Kết quả |
|---|---------|---------|---------|
| 1 | HTTP status | 201 | |
| 2 | `data.status` | `"PREPARING"` | |
| 3 | `data.batch_no` | Bắt đầu `BAT-` | |
| 4 | Các đơn trong batch | status = PROCESSING | |
| 5 | Company tạo chuyến | 403 | |

---

### TC-BATCH-002 — Đơn không phải CONFIRMED

```http
POST /api/shipment-batches
{ "order_ids": [draft_order_id] }
```

| # | Kiểm tra | Kỳ vọng | Kết quả |
|---|---------|---------|---------|
| 1 | HTTP status | 409 | |
| 2 | `message` | `"M0501"` | |

---

### TC-BATCH-003 — Đơn đã thuộc chuyến khác

```http
POST /api/shipment-batches
{ "order_ids": [already_batched_order_id] }
```

| # | Kiểm tra | Kỳ vọng | Kết quả |
|---|---------|---------|---------|
| 1 | HTTP status | 409 | |
| 2 | `message` | `"M0502"` | |

---

### TC-BATCH-004 — Chuyển trạng thái chuyến (luồng hợp lệ)

```http
PUT /api/shipment-batches/{id}/status
{ "status": "CUSTOMS_JP" }
```

| # | Kiểm tra | Kỳ vọng | Kết quả |
|---|---------|---------|---------|
| 1 | PREPARING → CUSTOMS_JP | 200 | |
| 2 | CUSTOMS_JP → IN_TRANSIT | 200 | |
| 3 | IN_TRANSIT → CUSTOMS_VN | 200 | |
| 4 | CUSTOMS_VN → DELIVERED | 200 | |
| 5 | Đơn trong chuyến | status = DELIVERED | |

---

### TC-BATCH-005 — Chuyển trạng thái không hợp lệ

```http
PUT /api/shipment-batches/{id}/status
{ "status": "PREPARING" }  // đang là IN_TRANSIT
```

| # | Kiểm tra | Kỳ vọng | Kết quả |
|---|---------|---------|---------|
| 1 | HTTP status | 422 | |
| 2 | `message` | `"M0505"` | |

---

### TC-BATCH-006 — Sửa danh sách đơn khi < IN_TRANSIT

```http
PUT /api/shipment-batches/{preparing_batch_id}
{ "order_ids": [...new list...] }
```

| # | Kiểm tra | Kỳ vọng | Kết quả |
|---|---------|---------|---------|
| 1 | Batch PREPARING → sửa được | 200 | |
| 2 | Batch CUSTOMS_JP → sửa được | 200 | |
| 3 | Batch IN_TRANSIT → không sửa được | 409 / M0504 | |

---

### TC-BATCH-007 — Company xem chuyến hàng

**Mục tiêu**: Company chỉ thấy chuyến có đơn của mình

| # | Kiểm tra | Kỳ vọng | Kết quả |
|---|---------|---------|---------|
| 1 | GET `/shipment-batches` | Chỉ chuyến có đơn của mình | |
| 2 | GET `/shipment-batches/{id}` chuyến của mình | 200 | |
| 3 | GET `/shipment-batches/{id}` chuyến không có đơn mình | 403 / M0507 | |
| 4 | GET `/shipment-batches/available-orders` | 403 | |

---

## Regression Checklist sau khi merge

- [ ] TC-ORD-001 đến TC-ORD-012
- [ ] TC-BATCH-001 đến TC-BATCH-007
- [ ] Auth vẫn hoạt động (login admin + company)
- [ ] Products CRUD không bị ảnh hưởng
- [ ] `mail_histories` có đúng record sau các action (BE-021)
- [ ] `inventories.reserved_qty` đúng sau submit + cancel + delivered
