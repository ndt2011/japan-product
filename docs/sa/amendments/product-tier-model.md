# Product Tier Model — Hàng hóa / Hàng kho / Hàng order

> spec amendment — ngày 2026-06-08
> liên quan: docs/ba/BRD.md, docs/sa/Database Design.md, docs/sa/API Contract.md

---

## 1. Ba khái niệm cốt lõi

Hệ thống phân biệt 3 tầng **hoàn toàn khác nhau**:

| Tầng | Tên nghiệp vụ | Table | Ý nghĩa |
|------|--------------|-------|---------|
| 1 | **Hàng hóa** (Product catalog) | `products` | Danh mục sản phẩm Nhật được admin duyệt vào hệ thống. Đây là **định nghĩa** của sản phẩm (tên, giá, ảnh, mô tả). Chưa chắc có trong kho. |
| 2 | **Hàng kho** (Warehouse stock) | `inventories` | Số lượng sản phẩm **đang có mặt vật lý tại kho Việt Nam**. Ghi nhận qua stockIn / stockOut. Có thể = 0 nếu chưa về hàng. |
| 3 | **Hàng order** (Orderable) | `inventories` (available_qty) | Số lượng **có thể đặt hàng** = `quantity − reserved_qty`. Đây là con số agent/branch nhìn thấy khi muốn order. |

---

## 2. Lifecycle của từng tầng

### Tầng 1 — Hàng hóa (products)

```
AI search Rakuten → AiProductCandidate (chờ duyệt)
    ↓ admin approve
products (active = true, product_cd được sinh tự động)
    ↓
Hiển thị danh sách sản phẩm cho toàn bộ user
```

**product_cd format:** `JP-{CAT3}-{SEQ5}` — ví dụ `JP-FOD-00012`
- CAT3: 3 ký tự đầu của category slug (viết hoa, strip dấu)
- SEQ5: số thứ tự tự tăng toàn cục, zero-padded 5 chữ số

---

### Tầng 2 — Hàng kho (inventories)

```
Batch DELIVERED → stockIn() tự động (ShipmentBatchService)
    ↓ hàng vào inventory
inventories.quantity tăng
    ↓
Đại lý xác nhận nhận hàng → stockOut() (OrderService::confirmReceipt)
    ↓
inventories.quantity giảm
```

**Các trường key:**
- `quantity` — tổng số lượng vật lý trong kho
- `reserved_qty` — số đang giữ chỗ cho order đã PENDING/PROCESSING
- `available_qty` (computed) = `quantity − reserved_qty`

---

### Tầng 3 — Hàng order (available_qty)

- Khi agent/branch xem GET /products → response bao gồm `available_qty` từ inventory
- Khi `available_qty > 0`: có thể order ngay, hàng đã ở kho VN
- Khi `available_qty = 0`: có thể pre-order (tùy business rule), hàng chưa về hoặc đang reserved hết

**Trạng thái kho hiển thị cho user:**

| available_qty | stock_status | Hiển thị FE |
|--------------|--------------|-------------|
| ≥ 10 | `IN_STOCK` | 🟢 Còn hàng |
| 1–9 | `LOW_STOCK` | 🟡 Sắp hết ({n} còn) |
| 0 | `OUT_OF_STOCK` | 🔴 Hết hàng / Pre-order |

---

## 3. API Contract — GET /products

### Response (có thêm inventory info)

```json
{
  "id": 1,
  "product_cd": "JP-FOD-00012",
  "name": "Natto Hokkaido Premium",
  "category": "Thực phẩm",
  "selling_price_jpy": 1500,
  "price_vnd": 270000,
  "primary_image_url": "https://cdn.r2.../products/1/main.jpg",
  "available_qty": 24,
  "stock_status": "IN_STOCK",
  "status": "active"
}
```

### Fields mới (so với trước)

| Field | Source | Mô tả |
|-------|--------|-------|
| `primary_image_url` | `product_images` WHERE `is_primary=1` | URL ảnh chính |
| `available_qty` | `inventories.quantity - inventories.reserved_qty` | Số có thể order |
| `stock_status` | computed | `IN_STOCK` / `LOW_STOCK` / `OUT_OF_STOCK` |

---

## 4. Database — inventory lot code (mã hàng hóa)

Mỗi lô nhập kho (`stock_movements` với `movement_type = IN`) ghi nhận:

```
ref_type = 'shipment_batch'
ref_id   = {shipment_batch.id}
note     = "Nhập kho theo chuyến hàng #{batch_id} — đơn {order_no}"
```

Để tra cứu nguồn gốc lô hàng: query `stock_movements` theo `product_id` + `movement_type = IN`.

Nếu cần barcode/lot riêng trong tương lai → thêm column `lot_code` vào `inventories` (Phase 3).

---

## 5. Impact lên các service

| Service | Thay đổi |
|---------|---------|
| `ProductController::index()` | Thêm eager load `primaryImage`, join `inventories` để lấy available_qty |
| `ProductController::store()` | Gọi `CodeGeneratorService::productCode($categorySlug)` |
| `OrderRepository::generateOrderNo()` | Gọi `CodeGeneratorService::orderNo($companyCode)` |
| `AiChatService` | Trả `available_qty` khi trả lời câu hỏi tồn kho |

---

## 6. Sơ đồ tổng thể

```
[Rakuten / AI Search]
        ↓
[ai_product_candidates] → (admin approve)
        ↓
[products] ←────────────────── Hàng hóa (catalog)
        ↓ (hàng đặt từ Nhật về)
[shipment_batches → DELIVERED]
        ↓ stockIn()
[inventories] ←───────────────── Hàng kho (vật lý tại VN)
        ↓ available_qty
[orders] ←────────────────────── Hàng order (agent đặt mua)
        ↓ confirmReceipt → stockOut()
[Hàng giao đến tay đại lý]
```
