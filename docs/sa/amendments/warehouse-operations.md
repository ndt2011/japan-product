# Amendment — Quản lý kho: Nhập / Xuất / Kiểm kê

> **Ngày**: 2026-06-07 | **Trạng thái**: Tạm áp dụng — chờ SA sync  
> **Liên quan**: `warehouses`, `inventories` (đã có) + `stock_movements` (mới)

---

## Phân tích hiện trạng

Bảng `inventories` hiện có:
- `quantity` — tồn kho hệ thống
- `reserved_qty` — đã đặt chưa xuất
- `actual_qty` — sau kiểm kê thực tế
- `last_check_date` — ngày kiểm kê cuối

**Thiếu**: Không có bảng lịch sử giao dịch kho → không biết tồn kho thay đổi như thế nào, ai làm, lý do gì.

---

## Bảng mới: `stock_movements`

| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | bigint PK | |
| movement_type | varchar(10) | `IN` / `OUT` / `ADJUST` |
| product_id | int FK → products | |
| warehouse_id | int FK → warehouses | |
| quantity | int | Số lượng thay đổi (luôn dương) |
| quantity_before | int | Tồn kho trước khi thay đổi |
| quantity_after | int | Tồn kho sau khi thay đổi |
| ref_type | varchar(30) nullable | `order` / `batch` / `manual` / `check` |
| ref_id | bigint nullable | ID của đơn hàng / batch liên quan |
| reason | varchar(500) nullable | Lý do (nhập từ Nhật, hàng lỗi...) |
| note | text nullable | Ghi chú thêm |
| created | datetime | |
| created_user_id | int | Admin thực hiện |

### Migration

**File**: `2026_06_07_200000_create_stock_movements_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->string('movement_type', 10)->comment('IN|OUT|ADJUST');
            $table->unsignedInteger('product_id');
            $table->unsignedInteger('warehouse_id');
            $table->integer('quantity');
            $table->integer('quantity_before')->default(0);
            $table->integer('quantity_after')->default(0);
            $table->string('ref_type', 30)->nullable()->comment('order|batch|manual|check');
            $table->unsignedBigInteger('ref_id')->nullable();
            $table->string('reason', 500)->nullable();
            $table->text('note')->nullable();
            $table->datetime('created');
            $table->unsignedInteger('created_user_id');

            $table->foreign('product_id')->references('id')->on('products');
            $table->foreign('warehouse_id')->references('id')->on('warehouses');

            $table->index(['product_id', 'warehouse_id']);
            $table->index(['movement_type', 'created']);
            $table->index(['ref_type', 'ref_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};
```

---

## Luồng nghiệp vụ

### Nhập kho (Stock IN)

```
Admin nhận hàng từ Nhật
  → POST /stock-movements (type=IN)
  → inventories.quantity += quantity
  → Tạo bản ghi stock_movements
```

Trigger tự động: khi `shipment_batches.status` → `DELIVERED`:
- Với mỗi đơn trong batch → mỗi `order_details` → xuất kho `reserved_qty` → `OUT`

### Xuất kho (Stock OUT)

```
Admin xác nhận xuất hàng cho đơn cụ thể
  → POST /stock-movements (type=OUT, ref_type=order, ref_id=order_id)
  → inventories.quantity -= quantity
  → inventories.reserved_qty -= quantity (release reserve)
```

### Kiểm kê kho (Inventory Check / ADJUST)

```
Admin đếm thực tế → nhập số thực
  → POST /inventory-checks
  → So sánh actual vs quantity
  → Tạo ADJUST movement với delta
  → inventories.actual_qty = actual
  → inventories.quantity = actual (đồng bộ)
  → inventories.last_check_date = today
```

---

## Service: InventoryService

**File**: `app/Services/InventoryService.php`

```php
<?php

namespace App\Services;

use App\Models\Inventory;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;

class InventoryService
{
    /**
     * Nhập kho (Stock IN)
     */
    public function stockIn(
        int $productId,
        int $warehouseId,
        int $quantity,
        string $reason = '',
        ?string $refType = null,
        ?int $refId = null,
        int $userId = 0
    ): StockMovement {
        return DB::transaction(function () use ($productId, $warehouseId, $quantity, $reason, $refType, $refId, $userId) {
            $inv = Inventory::firstOrCreate(
                ['product_id' => $productId, 'warehouse_id' => $warehouseId],
                ['quantity' => 0, 'reserved_qty' => 0, 'actual_qty' => 0, 'created' => now(), 'created_user_id' => $userId]
            );

            $before = $inv->quantity;
            $after  = $before + $quantity;

            $inv->update([
                'quantity' => $after,
                'modified' => now(),
                'modified_user_id' => $userId,
            ]);

            return StockMovement::create([
                'movement_type'   => 'IN',
                'product_id'      => $productId,
                'warehouse_id'    => $warehouseId,
                'quantity'        => $quantity,
                'quantity_before' => $before,
                'quantity_after'  => $after,
                'ref_type'        => $refType,
                'ref_id'          => $refId,
                'reason'          => $reason,
                'created'         => now(),
                'created_user_id' => $userId,
            ]);
        });
    }

    /**
     * Xuất kho (Stock OUT)
     */
    public function stockOut(
        int $productId,
        int $warehouseId,
        int $quantity,
        string $reason = '',
        ?string $refType = null,
        ?int $refId = null,
        int $userId = 0
    ): StockMovement {
        return DB::transaction(function () use ($productId, $warehouseId, $quantity, $reason, $refType, $refId, $userId) {
            $inv = Inventory::where('product_id', $productId)
                            ->where('warehouse_id', $warehouseId)
                            ->lockForUpdate()
                            ->firstOrFail();

            $available = $inv->quantity - $inv->reserved_qty;
            if ($available < $quantity) {
                throw new \Exception("Không đủ tồn kho: cần {$quantity}, khả dụng {$available}");
            }

            $before = $inv->quantity;
            $after  = $before - $quantity;

            $inv->update([
                'quantity'         => $after,
                'reserved_qty'     => max(0, $inv->reserved_qty - $quantity),
                'modified'         => now(),
                'modified_user_id' => $userId,
            ]);

            return StockMovement::create([
                'movement_type'   => 'OUT',
                'product_id'      => $productId,
                'warehouse_id'    => $warehouseId,
                'quantity'        => $quantity,
                'quantity_before' => $before,
                'quantity_after'  => $after,
                'ref_type'        => $refType,
                'ref_id'          => $refId,
                'reason'          => $reason,
                'created'         => now(),
                'created_user_id' => $userId,
            ]);
        });
    }

    /**
     * Kiểm kê kho (Adjust)
     * $actualQty: số lượng thực tế đếm được
     */
    public function adjust(
        int $productId,
        int $warehouseId,
        int $actualQty,
        string $reason = 'Kiểm kê định kỳ',
        int $userId = 0
    ): StockMovement {
        return DB::transaction(function () use ($productId, $warehouseId, $actualQty, $reason, $userId) {
            $inv = Inventory::where('product_id', $productId)
                            ->where('warehouse_id', $warehouseId)
                            ->lockForUpdate()
                            ->firstOrFail();

            $before = $inv->quantity;
            $delta  = abs($actualQty - $before);

            $inv->update([
                'quantity'         => $actualQty,
                'actual_qty'       => $actualQty,
                'last_check_date'  => now()->toDateString(),
                'modified'         => now(),
                'modified_user_id' => $userId,
            ]);

            return StockMovement::create([
                'movement_type'   => 'ADJUST',
                'product_id'      => $productId,
                'warehouse_id'    => $warehouseId,
                'quantity'        => $delta,
                'quantity_before' => $before,
                'quantity_after'  => $actualQty,
                'ref_type'        => 'check',
                'reason'          => $reason,
                'note'            => "Thực tế: {$actualQty}, hệ thống: {$before}, chênh lệch: " . ($actualQty - $before),
                'created'         => now(),
                'created_user_id' => $userId,
            ]);
        });
    }
}
```

---

## API Endpoints — Kho

### GET `/warehouses`
**Auth**: Required | **Query**: `search`, `country`, `page`

```json
{
  "data": {
    "items": [
      {
        "id": 1,
        "warehouse_cd": "WH-VN-01",
        "warehouse_name": "Kho Hà Nội",
        "country": "VN",
        "manager_name": "Nguyễn A",
        "total_products": 42,
        "total_quantity": 1250
      }
    ]
  }
}
```

### POST `/warehouses` *(Admin only)*

```json
{
  "warehouse_cd": "WH-VN-02",
  "warehouse_name": "Kho TP.HCM",
  "address": "123 Lê Lợi, Q1",
  "country": "VN",
  "manager_name": "Trần B",
  "tel": "028-xxx"
}
```

### GET `/inventories`
**Auth**: Required | **Query**: `warehouse_id`, `product_id`, `low_stock` (boolean), `page`

```json
{
  "data": {
    "items": [
      {
        "id": 1,
        "product_id": 3,
        "product_name": "Vitamin C",
        "product_cd": "P003",
        "warehouse_id": 1,
        "warehouse_name": "Kho Hà Nội",
        "quantity": 100,
        "reserved_qty": 20,
        "available_qty": 80,
        "actual_qty": 98,
        "last_check_date": "2026-06-01",
        "is_low_stock": false
      }
    ]
  }
}
```

### POST `/stock-movements` *(Admin only)*
**Mô tả**: Nhập kho thủ công hoặc xuất kho thủ công

```json
{
  "movement_type": "IN",
  "product_id": 3,
  "warehouse_id": 1,
  "quantity": 50,
  "reason": "Nhận hàng từ chuyến BAT-20260607-0001",
  "ref_type": "batch",
  "ref_id": 1
}
```

**Response 201**:
```json
{
  "success": true,
  "data": {
    "id": 10,
    "movement_type": "IN",
    "quantity_before": 50,
    "quantity_after": 100
  },
  "message": "M1001"
}
```

**Response 409**: Không đủ tồn kho (khi OUT) → `M1002`

### GET `/stock-movements`
**Auth**: Admin only | **Query**: `product_id`, `warehouse_id`, `movement_type`, `from_date`, `to_date`, `page`

```json
{
  "data": {
    "items": [
      {
        "id": 10,
        "movement_type": "IN",
        "product_name": "Vitamin C",
        "warehouse_name": "Kho HN",
        "quantity": 50,
        "quantity_before": 50,
        "quantity_after": 100,
        "ref_type": "batch",
        "ref_id": 1,
        "reason": "Nhận hàng từ chuyến BAT-...",
        "created_by": "Tanaka Admin",
        "created": "2026-06-07T10:00:00+00:00"
      }
    ]
  }
}
```

### POST `/inventory-checks` *(Admin only)*
**Mô tả**: Kiểm kê — nhập số thực tế

```json
{
  "warehouse_id": 1,
  "items": [
    { "product_id": 3, "actual_qty": 98, "note": "Hỏng 2 hộp" },
    { "product_id": 5, "actual_qty": 45, "note": "" }
  ],
  "reason": "Kiểm kê định kỳ tháng 6/2026"
}
```

**Response 200**:
```json
{
  "success": true,
  "data": {
    "checked_count": 2,
    "adjusted_count": 2,
    "movements": [
      { "product_id": 3, "before": 100, "after": 98, "delta": -2 },
      { "product_id": 5, "before": 50,  "after": 45, "delta": -5 }
    ]
  },
  "message": "M1003"
}
```

---

## Message Codes kho

| Code | Ý nghĩa |
|------|---------|
| M1001 | Nhập/xuất kho thành công |
| M1002 | Không đủ tồn kho để xuất |
| M1003 | Kiểm kê hoàn tất |
| M1004 | Kho không tìm thấy |
| M1005 | Sản phẩm chưa có tồn kho trong kho này |

---

## Tự động hóa (side effects)

### Khi `shipment_batches.status` → `DELIVERED`

```php
// Trong ShipmentBatchService::deliver($batch)
foreach ($batch->orders as $order) {
    foreach ($order->details as $detail) {
        $inventoryService->stockOut(
            productId:   $detail->product_id,
            warehouseId: $mainWarehouseId, // kho chính
            quantity:    $detail->quantity,
            reason:      "Xuất theo đơn {$order->order_no}",
            refType:     'order',
            refId:       $order->id,
            userId:      $adminId,
        );
    }
    $order->update(['status' => 'DELIVERED']);
}
```

### Khi `orders.status` → `PENDING` (submit đơn)

```php
// Trong OrderService::submit($order)
foreach ($order->details as $detail) {
    Inventory::where('product_id', $detail->product_id)
             ->where('warehouse_id', $mainWarehouseId)
             ->increment('reserved_qty', $detail->quantity);
}
```
