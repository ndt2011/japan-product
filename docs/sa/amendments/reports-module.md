# Amendment — Báo Cáo (Reports Module)

> **Ngày**: 2026-06-07 | **Trạng thái**: Thiết kế — chờ code  
> **Phụ thuộc**: `warehouse-operations.md` (stock_movements), RBAC

---

## Tổng quan

4 loại báo cáo cần làm:

| Báo cáo | Route | Admin | Company |
|---------|-------|:-----:|:-------:|
| Tồn kho hiện tại | `/reports/inventory` | ✅ Tất cả kho | ❌ |
| Xuất nhập kho | `/reports/stock-movements` | ✅ | ❌ |
| Đơn hàng | `/reports/orders` | ✅ Tất cả | ✅ Đơn mình |
| Doanh thu | `/reports/revenue` | ✅ | ❌ |

---

## API Endpoints

### 1. Báo cáo tồn kho — GET `/reports/inventory`

**Auth**: Admin only  
**Query**: `warehouse_id?`, `category_id?`, `low_stock_only?` (bool), `export?` (csv)

```json
{
  "success": true,
  "data": {
    "generated_at": "2026-06-07T10:00:00+00:00",
    "summary": {
      "total_products": 85,
      "total_quantity": 12500,
      "low_stock_count": 5,
      "warehouses": 2
    },
    "items": [
      {
        "product_cd": "P003",
        "product_name": "Vitamin C Orihiro",
        "category": "Thực phẩm chức năng",
        "supplier": "Orihiro JP",
        "warehouse_name": "Kho Hà Nội",
        "quantity": 100,
        "reserved_qty": 20,
        "available_qty": 80,
        "actual_qty": 98,
        "last_check_date": "2026-06-01",
        "is_low_stock": false,
        "price_vnd": 650000,
        "total_value_vnd": 65000000
      }
    ]
  }
}
```

**Controller**:

```php
// app/Http/Controllers/Api/ReportController.php

public function inventory(Request $request): JsonResponse
{
    $query = Inventory::query()
        ->join('products', 'inventories.product_id', '=', 'products.id')
        ->join('warehouses', 'inventories.warehouse_id', '=', 'warehouses.id')
        ->leftJoin('product_categories', 'products.product_category_id', '=', 'product_categories.id')
        ->leftJoin('suppliers_jp', 'products.supplier_id', '=', 'suppliers_jp.id')
        ->where('products.disabled_flag', 0)
        ->where('products.deleted_flag', 0)
        ->select([
            'products.product_cd',
            'products.product_name',
            'product_categories.category_name',
            'suppliers_jp.supplier_name',
            'warehouses.warehouse_name',
            'inventories.quantity',
            'inventories.reserved_qty',
            'inventories.actual_qty',
            'inventories.last_check_date',
            'products.price_vnd',
            \DB::raw('(inventories.quantity - inventories.reserved_qty) as available_qty'),
            \DB::raw('(inventories.quantity * products.price_vnd) as total_value_vnd'),
        ]);

    if ($warehouseId = $request->input('warehouse_id')) {
        $query->where('inventories.warehouse_id', $warehouseId);
    }

    if ($categoryId = $request->input('category_id')) {
        $query->where('products.product_category_id', $categoryId);
    }

    if ($request->boolean('low_stock_only')) {
        $query->whereRaw('(inventories.quantity - inventories.reserved_qty) < 10');
    }

    $items = $query->get();

    $summary = [
        'total_products'  => $items->count(),
        'total_quantity'  => $items->sum('quantity'),
        'low_stock_count' => $items->filter(fn($i) => ($i->quantity - $i->reserved_qty) < 10)->count(),
    ];

    return response()->json([
        'success' => true,
        'data'    => [
            'generated_at' => now()->toIso8601String(),
            'summary'      => $summary,
            'items'        => $items,
        ],
        'message' => 'M0000',
    ]);
}
```

---

### 2. Báo cáo xuất nhập kho — GET `/reports/stock-movements`

**Auth**: Admin only  
**Query**: `warehouse_id?`, `product_id?`, `movement_type?` (IN/OUT/ADJUST), `from_date`, `to_date`, `page`

```json
{
  "success": true,
  "data": {
    "summary": {
      "total_in": 500,
      "total_out": 320,
      "total_adjust": 8,
      "net_change": 180
    },
    "items": [
      {
        "date": "2026-06-07",
        "movement_type": "IN",
        "product_cd": "P003",
        "product_name": "Vitamin C",
        "warehouse_name": "Kho Hà Nội",
        "quantity": 50,
        "quantity_before": 50,
        "quantity_after": 100,
        "ref_type": "batch",
        "ref_id": 1,
        "reason": "Nhận hàng BAT-20260607-0001",
        "created_by": "Tanaka Admin"
      }
    ],
    "pagination": { "page": 1, "per_page": 50, "total": 200 }
  }
}
```

---

### 3. Báo cáo đơn hàng — GET `/reports/orders`

**Auth**: Admin (tất cả) / Company (chỉ đơn mình)  
**Query**: `status?`, `company_id?` (Admin only), `from_date`, `to_date`, `page`

```json
{
  "success": true,
  "data": {
    "summary": {
      "total_orders": 150,
      "by_status": {
        "DRAFT": 5,
        "PENDING": 12,
        "CONFIRMED": 30,
        "PROCESSING": 45,
        "DELIVERED": 50,
        "CANCELLED": 8
      },
      "total_value_vnd": 450000000
    },
    "items": [
      {
        "order_no": "ORD-20260607-0001",
        "company_name": "Công ty ABC",
        "status": "DELIVERED",
        "order_date": "2026-06-01",
        "delivered_date": "2026-06-07",
        "items_count": 5,
        "total_qty": 120,
        "total_value_vnd": 3500000,
        "exchange_rate_jpy": 175.5
      }
    ]
  }
}
```

**Controller**:

```php
public function orders(Request $request): JsonResponse
{
    $user = auth()->user();

    $query = Order::query()
        ->join('companies_vn', 'orders.company_vn_id', '=', 'companies_vn.id')
        ->leftJoin('order_details', 'orders.id', '=', 'order_details.order_id')
        ->select([
            'orders.id',
            'orders.order_no',
            'companies_vn.company_name',
            'orders.status',
            'orders.created as order_date',
            \DB::raw('COUNT(DISTINCT order_details.id) as items_count'),
            \DB::raw('SUM(order_details.quantity) as total_qty'),
            \DB::raw('SUM(order_details.quantity * order_details.price_vnd) as total_value_vnd'),
            'orders.exchange_rate_jpy',
        ])
        ->groupBy('orders.id', 'orders.order_no', 'companies_vn.company_name',
                  'orders.status', 'orders.created', 'orders.exchange_rate_jpy');

    // Company chỉ thấy đơn mình
    if ($user->user_type === 'company') {
        $query->where('orders.company_vn_id', $user->id);
    } elseif ($companyId = $request->input('company_id')) {
        $query->where('orders.company_vn_id', $companyId);
    }

    if ($status = $request->input('status')) {
        $query->where('orders.status', $status);
    }

    if ($from = $request->input('from_date')) {
        $query->whereDate('orders.created', '>=', $from);
    }

    if ($to = $request->input('to_date')) {
        $query->whereDate('orders.created', '<=', $to);
    }

    $items = $query->paginate(50);

    // Summary
    $summaryQuery = clone $query;
    $byStatus = Order::query()
        ->when($user->user_type === 'company', fn($q) => $q->where('company_vn_id', $user->id))
        ->selectRaw('status, COUNT(*) as count')
        ->groupBy('status')
        ->pluck('count', 'status');

    return response()->json([
        'success' => true,
        'data'    => [
            'summary' => [
                'total_orders'    => $items->total(),
                'by_status'       => $byStatus,
                'total_value_vnd' => $items->sum('total_value_vnd'),
            ],
            'items'   => $items->items(),
            'pagination' => [
                'page'     => $items->currentPage(),
                'per_page' => $items->perPage(),
                'total'    => $items->total(),
            ],
        ],
        'message' => 'M0000',
    ]);
}
```

---

### 4. Báo cáo doanh thu — GET `/reports/revenue`

**Auth**: Admin only  
**Query**: `period` (daily/monthly/yearly), `from_date`, `to_date`

```json
{
  "success": true,
  "data": {
    "period": "monthly",
    "items": [
      {
        "period_label": "2026-06",
        "orders_count": 45,
        "total_value_vnd": 150000000,
        "delivered_count": 38,
        "delivered_value_vnd": 130000000
      }
    ]
  }
}
```

---

## Routes — thêm vào `routes/api.php`

```php
// Báo cáo — Admin thấy tất cả, Company thấy đơn mình
Route::middleware(['auth:sanctum'])->prefix('reports')->group(function () {
    Route::get('/orders', [ReportController::class, 'orders']);

    // Chỉ Admin
    Route::middleware(['role:admin'])->group(function () {
        Route::get('/inventory',        [ReportController::class, 'inventory']);
        Route::get('/stock-movements',  [ReportController::class, 'stockMovements']);
        Route::get('/revenue',          [ReportController::class, 'revenue']);
    });
});

// Kho hàng — Chỉ Admin
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::apiResource('warehouses', WarehouseController::class);
    Route::get('inventories',         [InventoryController::class, 'index']);
    Route::post('stock-movements',    [StockMovementController::class, 'store']);
    Route::get('stock-movements',     [StockMovementController::class, 'index']);
    Route::post('inventory-checks',   [InventoryController::class, 'check']);
});
```

---

## Message Codes báo cáo

| Code | Ý nghĩa |
|------|---------|
| M1100 | Báo cáo tạo thành công |
| M1101 | Không có dữ liệu trong khoảng thời gian |
| M1102 | Khoảng thời gian vượt quá 1 năm |

---

## FE — Trang báo cáo `/reports`

### Cấu trúc page

```
/reports
├─ Tổng quan (summary cards)
├─ Tab: Tồn kho          → GET /reports/inventory       (Admin only)
├─ Tab: Xuất nhập kho    → GET /reports/stock-movements (Admin only)
├─ Tab: Đơn hàng         → GET /reports/orders          (All)
└─ Tab: Doanh thu        → GET /reports/revenue         (Admin only)
```

### Company thấy gì trong `/reports`

- Chỉ thấy tab **Đơn hàng** (đơn của mình)
- 4 summary cards: Tổng đơn / Đang xử lý / Đã giao / Đã hủy
- Không thấy tabs Tồn kho, Xuất nhập, Doanh thu

### Admin thấy gì

- Tất cả 4 tabs
- Tồn kho: table với cột low stock highlight đỏ nếu `available_qty < 10`
- Đơn hàng: thêm filter `company_id` (dropdown)
- Doanh thu: chart theo tháng

---

## Export CSV (tùy chọn)

Thêm `?export=csv` vào bất kỳ report endpoint nào:

```php
if ($request->input('export') === 'csv') {
    $headers = [
        'Content-Type'        => 'text/csv; charset=UTF-8',
        'Content-Disposition' => 'attachment; filename="inventory-' . date('Ymd') . '.csv"',
    ];

    $callback = function () use ($items) {
        $f = fopen('php://output', 'w');
        fprintf($f, chr(0xEF).chr(0xBB).chr(0xBF)); // UTF-8 BOM for Excel
        fputcsv($f, ['Mã SP', 'Tên SP', 'Kho', 'Tồn kho', 'Đặt trước', 'Khả dụng', 'Giá trị VND']);
        foreach ($items as $item) {
            fputcsv($f, [
                $item->product_cd, $item->product_name, $item->warehouse_name,
                $item->quantity, $item->reserved_qty, $item->available_qty,
                $item->total_value_vnd,
            ]);
        }
        fclose($f);
    };

    return response()->stream($callback, 200, $headers);
}
```
