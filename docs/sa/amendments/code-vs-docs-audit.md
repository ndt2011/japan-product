# Code vs Docs Audit Report

> **Ngày**: 2026-06-09 (lần 5 — sau BE-V3-018 + suppliers CRUD) | **Tác giả**: SA  
> **Mục đích**: Kiểm tra code thực tế có phản ánh đúng tài liệu thiết kế không  
> **Trạng thái tổng**: [docs/tasks/STATUS.md](../../tasks/STATUS.md)

---

## Kết luận nhanh

| Câu hỏi | Trả lời |
|---------|---------|
| **Docs có khớp code không?** | **~96% khớp** — Phase 2 ✅ · V3 ~98% |
| **File nào là nguồn sự thật?** | `STATUS.md` + `backend-tasks.md` / `frontend-tasks.md` + code `project/` |
| **Còn lệch gì?** | P2: Form Requests · avatar R2 · pdf_path · profit chart |

---

## Kết quả tổng quan

| Mảng | ✅ Khớp | ⚠️ Lệch (chấp nhận) | ❌ Chưa làm |
|------|:-------:|:-------------------:|:-----------:|
| RBAC & Auth | 7 | 0 | 0 |
| Sản phẩm dual pricing | 6 | 0 | 0 |
| Đơn hàng & Delivery | 6 | 1 | 0 |
| Invoice / Hóa đơn | 11 | 1 | 0 |
| Reports / Profit | 3 | 0 | 0 |
| DevOps staging | 5 | 0 | 1 prod |
| **V3 Upgrade** | 35 | 4 | 3 |

---

## ✅ Đã khớp docs ↔ code (verified)

| Hạng mục | Spec | Code | File tham chiếu |
|----------|------|------|-----------------|
| Dual pricing DB | `cost_price_jpy`, `selling_price_jpy`, `fee_rate` | ✅ | migration 100060 |
| Invoice snapshot | locked_rate, fee, subtotal, items JP/VI | ✅ | migrations 100070/100071 |
| Invoice detail FE | `product_name_jp/vi`, `line_total_vnd` | ✅ | `InvoiceDetailScreen.tsx` |
| `createFromOrder` fee | selling × rate × (1+fee) | ✅ | `InvoiceService.php` |
| PDF hóa đơn | DomPDF stream | ✅ | `InvoiceController.php` |
| confirm-receipt | Company + Branch | ✅ | `OrderService.php` |
| orders:auto-complete | 8h JST, 7 ngày | ✅ | `AutoCompleteDeliveredOrders.php` |
| GET /reports/profit | Summary + by_order | ✅ | `ReportController.php` |
| GET /reports/profit/by-product | Top/bottom sản phẩm | ✅ | `ReportController.php` + `ReportsScreen.tsx` |
| order_costs API + UI | GET/POST/DELETE | ✅ | `OrderCostController.php` |
| V3 order flow | APPROVED → PAID → SHIPPING | ✅ | `OrderService`, `ShipmentBatchService` |
| V3 notifications | Table + API + dropdown + ORDER_NEW toast | ✅ | `NotificationService`, `NotificationPoller` |
| V3 dashboard | Revenue, cashflow, UX redesign | ✅ | `DashboardScreen.tsx` |
| Toast feedback | Save/delete trên forms | ✅ | `lib/toast.ts`, `ToastContainer` |
| V3 inventory | List + edit/delete + CSV + restock badge | ✅ | `InventoryScreen.tsx` |
| **BE-V3-018** | Scheduler restock_status daily | ✅ | `SyncRestockStatus` 7h JST |
| Restock logic | NORMAL ≥ min · LOW < min · CRITICAL ≤ min/2 | ✅ | `InventoryService::computeRestockStatus` |
| Suppliers CRUD | POST/PUT/DELETE `/suppliers` | ✅ | `SupplierController.php` |
| Master-data FE | Categories + warehouses + suppliers | ✅ | `MasterDataScreen.tsx` |
| Redis staging | `REDIS_URL` + health `redis_configured` | ✅ | `HealthController`, `railway-env.php` |
| Tests | 74 passed | ✅ | `php artisan test` |

---

## ⚠️ Lệch thiết kế — Đã ghi nhận, không blocking

| ID | Spec (docs cũ) | Code thực tế | Hành động docs |
|----|----------------|--------------|----------------|
| **DEL-DIFF-01** | `DELIVERED_CLIENT` status riêng | `DELIVERED_ADMIN` → `COMPLETED` | `orders-status.md` ✅ |
| **INV-DIFF-05** | Lưu `pdf_path` khi xuất PDF | PDF stream, chưa persist | Backlog P2 |
| **FE-DIFF-02** | Recharts biểu đồ profit | Bảng + summary cards | P2 enhancement |

---

## ❌ Còn thiếu so với spec đầy đủ

| ID | Hạng mục | Priority | Ghi chú |
|----|----------|----------|---------|
| **BE-P2-014** | Persist `invoices.pdf_path` khi generate | P2 | PDF vẫn xem/download được |
| **FE-P2-007** | Recharts chart tab Lợi nhuận | P2 | Bảng đã có |
| **BE-V3-029** | Required validation all Form Requests | P2 | FE có `form-validation.ts` |
| **BE-V3-032** | `POST /profile/avatar` upload R2 | P2 | GET/PUT profile ✅ |
| **PROD** | ConoHa VPS production | Sprint 7 | Staging Railway+Vercel OK |
| **OPS** | Railway Shell: `products:generate-vi` + `embed` | P0 ops | AI catalog Luồng B |

---

## 🐛 Bug đã sửa

| ID | Mô tả | Fix |
|----|-------|-----|
| BUG-01 | `BranchUserService::list()` Admin TypeError | `BranchUser\|int` |
| BUG-02 | `order_costs` duplicate primary key | Xóa `$table->primary('id')` thừa |
| BUG-03 | `InvoiceTest` công thức fee cũ | Dual pricing |
| BUG-04 | Invoice detail `NaN` / tên SP trống | `line_total_vnd`, `product_name_jp/vi` |
| BUG-05 | `InventoryController` syntax — warehouse 500 | `bulkImport` trong class |

---

## Việc tiếp theo

1. OPS Railway: `REDIS_URL` + `products:generate-vi` + `products:embed --force`
2. P2 code: BE-V3-029 Form Requests · BE-V3-032 avatar R2 · FE-P2-007 profit chart
3. Production deploy (ConoHa) — Sprint 7
