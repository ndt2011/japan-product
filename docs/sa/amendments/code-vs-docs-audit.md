# Code vs Docs Audit Report

> **Ngày**: 2026-06-08 (lần 4 — sau V3 local + docs sync) | **Tác giả**: SA  
> **Mục đích**: Kiểm tra code thực tế có phản ánh đúng tài liệu thiết kế không  
> **Trạng thái tổng**: [docs/tasks/STATUS.md](../../tasks/STATUS.md)

---

## Kết luận nhanh

| Câu hỏi | Trả lời |
|---------|---------|
| **Docs có khớp code không?** | **~92% khớp** — Phase 2 ✅ · V3 ~80% task |
| **File nào là nguồn sự thật?** | `STATUS.md` + `backend-tasks.md` / `frontend-tasks.md` + code `project/` |
| **Còn lệch gì?** | V3 partial items + 4 điểm Phase 2 (bảng ⚠️) |

---

## Kết quả tổng quan

| Mảng | ✅ Khớp | ⚠️ Lệch (chấp nhận) | ❌ Chưa làm |
|------|:-------:|:-------------------:|:-----------:|
| RBAC & Auth | 7 | 0 | 0 |
| Sản phẩm dual pricing | 6 | 0 | 0 |
| Đơn hàng & Delivery | 6 | 1 | 0 |
| Invoice / Hóa đơn | 10 | 1 | 0 |
| Reports / Profit | 2 | 0 | 1 |
| DevOps staging | 4 | 0 | 1 prod |
| **V3 Upgrade** | 28 | 8 | 6 |

---

## ✅ Đã khớp docs ↔ code (verified)

| Hạng mục | Spec | Code | File tham chiếu |
|----------|------|------|-----------------|
| Dual pricing DB | `cost_price_jpy`, `selling_price_jpy`, `fee_rate` | ✅ | migration 100060 |
| Dual pricing FE form | Admin section + preview VND | ✅ | `ProductFormScreen.tsx` |
| Dual pricing API save | POST/PUT products | ✅ | `StoreProductRequest.php` |
| Invoice snapshot | locked_rate, fee, subtotal, items JP/VI | ✅ | migrations 100070/100071 |
| `createFromOrder` fee | selling × rate × (1+fee) | ✅ | `InvoiceService.php` |
| PDF hóa đơn | DomPDF stream | ✅ | `InvoiceController.php` + `dompdf/dompdf` |
| PDF proxy FE | `application/pdf` | ✅ | `proxy/invoices/[id]/pdf/route.ts` |
| confirm-receipt | Company + Branch | ✅ | `OrderService.php` |
| orders:auto-complete | 8h JST, 7 ngày | ✅ | `AutoCompleteDeliveredOrders.php` |
| GET /reports/profit | Summary + by_order | ✅ | `ReportController.php` |
| Tab Lợi nhuận FE | `/reports` profit tab | ✅ | `ReportsScreen.tsx` |
| order_costs API | GET/POST/DELETE | ✅ | `OrderCostController.php` |
| order_costs UI | Order detail Admin | ✅ | `OrderDetailScreen.tsx` |
| Notification badge | overdue + DELIVERED_ADMIN | ✅ | `useNotificationCounts.ts` + `AppShell.tsx` |
| Admin all-users | search + ma trận quyền | ✅ | `AdminScreen.tsx` |
| Tests | 73 passed | ✅ | `php artisan test` |
| V3 order flow | APPROVED → PAID → SHIPPING | ✅ | `OrderService`, `ShipmentBatchService` |
| V3 notifications | Table + API + dropdown FE | ✅ | `NotificationService`, `NotificationDropdown` |
| V3 dashboard revenue | `/dashboard/revenue`, `/cashflow` | ✅ | `DashboardService` |
| V3 profile | GET/PUT `/profile` | ⚠️ | Chưa `POST /profile/avatar` |
| V3 master-data | Categories CRUD + warehouse create | ⚠️ | Chưa 4-tab UI / suppliers CRUD |
| V3 inventory UI | List + badge | ⚠️ | Chưa edit/delete row FE |
| V3 mobile | Bottom nav + chat full-screen | ⚠️ | Chưa card list Orders/Products |
| Mermaid chat | `ChatMessageContent` | ✅ | `components/chat/ChatMessageContent.tsx` |

---

## ⚠️ Lệch thiết kế — Đã ghi nhận, không blocking

| ID | Spec (docs cũ) | Code thực tế | Hành động docs |
|----|----------------|--------------|----------------|
| **DEL-DIFF-01** | `DELIVERED_CLIENT` là status riêng | Nhảy thẳng `DELIVERED_ADMIN` → `COMPLETED`, set `delivered_client_at` | Cập nhật `orders-status.md` ✅ |
| **INV-DIFF-05** | Lưu `pdf_path` khi xuất PDF | PDF stream trực tiếp, chưa persist path | Ghi backlog P2 |
| **FE-DIFF-01** | `/reports/profit` route riêng | Tab trong `/reports` (cùng chức năng) | Chấp nhận — UX gọn hơn |
| **FE-DIFF-02** | Recharts biểu đồ profit | Bảng + summary cards (chưa chart) | P2 enhancement |

---

## ❌ Còn thiếu so với spec đầy đủ

| ID | Hạng mục | Priority | Ghi chú |
|----|----------|----------|---------|
| **BE-P2-013** | `GET /reports/profit/by-product` | P2 | Chỉ có tổng hợp + by_order |
| **BE-P2-014** | Persist `invoices.pdf_path` khi generate | P2 | PDF vẫn xem/download được |
| **QA-INV** | Test cases invoice/delivery trong `docs/qa/` | P2 | PHPUnit có `InvoiceTest` |
| **PROD** | ConoHa VPS production | Sprint 7 | Staging Railway+Vercel OK |
| **BE-V3-018** | Scheduler restock_status daily | P1 | `console.php` chưa có command |
| **BE-V3-029** | Required validation all Form Requests | P2 | FE đã có `form-validation.ts` |
| **BE-V3-030** | Suppliers full CRUD | P2 | Hiện read-only — đủ cho MVP |
| **BE-V3-032** | `POST /profile/avatar` upload R2 | P2 | GET/PUT profile ✅ · URL field ✅ |

---

## 🐛 Bug đã sửa

| ID | Mô tả | Fix |
|----|-------|-----|
| BUG-01 | `BranchUserService::list()` Admin TypeError | `BranchUser\|int` |
| BUG-02 | `order_costs` duplicate primary key | Xóa `$table->primary('id')` thừa |
| BUG-03 | `InvoiceTest` công thức fee cũ | Cập nhật theo dual pricing |

---

## Việc tiếp theo

1. **Push V3 local** → Railway migrate `100100` + `100110` → smoke staging
2. V3 còn lại P2: BE-V3-018 scheduler · BE-V3-029 Form Requests · avatar R2 (BE/FE-V3-032)
3. `GET /reports/profit/by-product` (BE-P2-013)
4. Production deploy (ConoHa) — Sprint 7
