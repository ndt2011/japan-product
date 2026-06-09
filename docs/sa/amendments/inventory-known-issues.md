# Inventory — Known Issues & Dev Tasks

> spec amendment — ngày 2026-06-09 (cập nhật: INV-001 partial fix + INV-003 mới)
> liên quan: docs/sa/amendments/product-tier-model.md, docs/tasks/backend-tasks.md

---

## Tóm tắt

Flow kho hiện tại **đúng với 1 kho**. Có 3 điểm cần dev xử lý khi hệ thống mở rộng:

| # | Vấn đề | Mức độ | Blocking? | Trạng thái |
|---|--------|--------|-----------|------------|
| INV-001 | reserve/release không nhận warehouseId | ⚠️ P2 | Không — chỉ ảnh hưởng khi có ≥2 kho | ✅ `defaultWarehouseId()` |
| INV-002 | Pre-order bị chặn hoàn toàn | ⚠️ P2 | Không — đúng design hiện tại | 📋 Pending BA |
| INV-003 | StockInScreen dùng product_id số (UX kém) | ⚠️ P1 | UX blocker hàng ngày | ✅ Fixed 2026-06-09 |

---

## INV-001 — reserve/release không nhất quán warehouseId

### Vấn đề

Khi đại lý tạo đơn PENDING, hệ thống gọi `reserve()` để giữ chỗ hàng.  
Khi đại lý hủy đơn, hệ thống gọi `release()` để trả lại.

Hiện tại hai hàm này **không nhận `warehouseId`** — chúng tìm kho bằng cách lấy record `inventories` có `quantity` cao nhất theo `product_id`.

```php
// InventoryRepository.php — hiện tại
public function findByProduct(int $productId): ?Inventory
{
    return Inventory::query()
        ->active()
        ->where('product_id', $productId)
        ->orderByDesc('quantity')   // ← lấy kho có nhiều hàng nhất
        ->first();
}
```

Trong khi đó `stockOut()` (khi giao hàng) lại dùng `findForWarehouse()` có `warehouseId` cụ thể.

**Ví dụ bug khi có 2 kho:**
- Kho HN: product A, qty=10
- Kho SG: product A, qty=3
- Đại lý đặt 3 cái → `reserve()` giữ chỗ ở Kho HN (vì qty cao hơn)
- Nhưng hàng được giao từ Kho SG → `stockOut()` trừ Kho SG
- Kết quả: Kho HN vẫn có `reserved_qty=3` dư thừa → available_qty sai

### Trạng thái hiện tại

Hệ thống hiện chỉ có **1 kho VN** (`defaultWarehouse()`) → không ảnh hưởng.

### Việc cần làm (khi mở kho thứ 2)

**File cần sửa:**

`app/Services/InventoryService.php`
```php
// Thêm warehouseId vào reserve() và release()
public function reserve(int $productId, int $warehouseId, int $qty): void
{
    $inventory = $this->inventoryRepository->findForWarehouse($productId, $warehouseId);
    // ...
}

public function release(int $productId, int $warehouseId, int $qty): void
{
    $inventory = $this->inventoryRepository->findForWarehouse($productId, $warehouseId);
    // ...
}

public function assertCanReserve(int $productId, int $warehouseId, int $qty): void
{
    $inventory = $this->inventoryRepository->findForWarehouse($productId, $warehouseId);
    // ...
}
```

`app/Services/OrderService.php`
```php
// Truyền warehouseId vào reserve/assertCanReserve
// Cần biết warehouseId trước khi reserve → thêm field warehouse_id vào order
// HOẶC luôn dùng defaultWarehouse khi reserve (đơn giản hơn)
$warehouseId = $this->warehouseRepository->defaultWarehouse()?->id;
$this->inventoryService->assertCanReserve($productId, $warehouseId, $qty);
$this->inventoryService->reserve($productId, $warehouseId, $qty);
```

**Estimate:** BE 4h · QA 2h

---

## INV-002 — Pre-order không được phép

### Vấn đề

Hiện tại khi đại lý tạo đơn PENDING, `assertCanReserve()` kiểm tra:

```php
if (!$inventory || $inventory->availableQty() < $qty) {
    throw new OrderException('M0401', 409);  // "Không đủ tồn kho"
}
```

Điều này có nghĩa: **đại lý chỉ đặt được hàng đang có trong kho VN**.  
Hàng chưa về từ Nhật (available_qty = 0) → không thể đặt.

### Trạng thái hiện tại

Đây là **behavior đúng** theo thiết kế hiện tại (Phase 1 + 2).  
Chưa có yêu cầu pre-order từ BA/BRD.

### Nếu muốn cho phép pre-order trong tương lai

**Cần làm:**

1. Thêm field `order_type ENUM('normal','preorder')` vào bảng `orders`
2. Bỏ `assertCanReserve()` khi `order_type = 'preorder'`
3. Bỏ `reserve()` khi pre-order (không có hàng để giữ chỗ)
4. Thêm business rule: pre-order chỉ cho phép với product có `status = active` và admin đã xác nhận có thể order trước
5. Frontend: hiển thị badge "Pre-order" và thông báo thời gian dự kiến

**File cần sửa:**
- Migration: `alter orders add column order_type`
- `app/Services/OrderService.php` — bỏ assertCanReserve khi pre-order
- `app/Http/Requests/Product/StoreOrderRequest.php` — thêm `order_type`
- `app/Http/Resources/OrderResource.php` — expose `order_type`
- Frontend: `OrderForm.tsx`, `OrderDetailScreen.tsx`

**Estimate:** BE 8h · FE 6h · QA 4h

---

## Checklist cho Dev

### INV-001 (làm khi có kho thứ 2)

- [ ] Thêm `warehouseId` parameter vào `InventoryService::reserve()`
- [ ] Thêm `warehouseId` parameter vào `InventoryService::release()`
- [ ] Thêm `warehouseId` parameter vào `InventoryService::assertCanReserve()`
- [ ] Cập nhật `OrderService::store()` — truyền warehouseId
- [ ] Cập nhật `OrderService::submit()` — truyền warehouseId
- [ ] Cập nhật `OrderService::cancel()` — truyền warehouseId
- [ ] Viết unit test: reserve đúng kho, release đúng kho
- [ ] Viết unit test: 2 kho, đặt hàng từ kho A, hủy giải phóng đúng kho A

### INV-002 (làm khi có yêu cầu pre-order)

- [ ] BA xác nhận yêu cầu nghiệp vụ pre-order
- [ ] Cập nhật BRD + User Stories
- [ ] Tạo migration thêm `order_type`
- [ ] Cập nhật OrderService bỏ assertCanReserve cho pre-order
- [ ] FE hiển thị badge + thông báo pre-order
- [ ] QA: test case pre-order → nhập kho → giao hàng

---

## Tham khảo

| File | Dòng | Nội dung |
|------|------|---------|
| `app/Services/InventoryService.php` | `assertCanReserve()` | Kiểm tra tồn kho trước khi reserve |
| `app/Services/InventoryService.php` | `reserve()` | Tăng reserved_qty |
| `app/Services/InventoryService.php` | `release()` | Giảm reserved_qty |
| `app/Repositories/InventoryRepository.php` | `findByProduct()` | Tìm kho không theo warehouseId — cần sửa INV-001 |
| `app/Repositories/InventoryRepository.php` | `findForWarehouse()` | Tìm kho có warehouseId — đúng |
| `app/Services/OrderService.php` | `store()`, `submit()`, `cancel()` | Nơi gọi reserve/release |
| `app/Services/ShipmentBatchService.php` | `advanceStatus()` DELIVERED | Gọi stockIn ✅ · nhận `warehouse_id` optional từ request ✅ |
| `app/Services/OrderService.php` | `confirmReceipt()` | Gọi stockOut ✅ |
| `components/screens/StockInScreen.tsx` | form | Autocomplete sản phẩm theo tên ✅ (INV-003 fixed) |

---

## INV-003 — StockInScreen UX: nhập product_id số thủ công ✅ FIXED

**Vấn đề cũ**: Form nhập kho thủ công yêu cầu nhập `product_id` (số nguyên) — nhân viên kho không biết ID.

**Fix 2026-06-09**:
- `StockInScreen.tsx` — thay `Input[type=number]` bằng Combobox autocomplete
- Gõ tên hoặc mã sản phẩm → dropdown gợi ý (debounce 300ms)
- Gọi `GET /api/proxy/products?search=&per_page=10` (endpoint đã có)
- Hiển thị: ảnh thumbnail + product_cd + name_vi/name_jp
- Sau khi chọn: lưu `product.id` ngầm vào form state

**INV-001 Partial Fix 2026-06-09**:
- `AdvanceShipmentBatchStatusRequest` — thêm `warehouse_id` optional
- `ShipmentBatchService::advanceStatus()` — nhận `?int $warehouseId`
- Khi advance → DELIVERED: ưu tiên `warehouse_id` từ request, fallback `defaultWarehouse()`
- Chưa fix `reserve()/release()` (cần khi có kho thứ 2 thực sự)
