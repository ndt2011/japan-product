# Amendment: Lộ trình nâng cấp hệ thống

> **Ngày**: 2026-06-07 | **Tác giả**: SA  
> **Mục đích**: Định hướng phát triển sau khi hoàn thành Phase 1 (RBAC + Kho + Báo cáo)

---

## Tổng quan 3 tier

| Tier | Tên | Mức độ | Thời gian ước tính |
|------|-----|--------|--------------------|
| 1 | Critical — Thiếu thì hệ thống không dùng được thực tế | 🔴 | 3–4 sprint |
| 2 | Important — Nâng chất lượng vận hành | 🟡 | 4–6 sprint |
| 3 | Nice-to-have — Tăng trải nghiệm & scale | 🟢 | Sau Tier 2 |

---

## TIER 1 — Critical

### T1-001: Invoice & Payment (Hóa đơn & Thanh toán)

> **Trạng thái** (2026-06-09): **✅ 100% triển khai** — spec: `invoice-payment.md`  
> BE-P2-001~014 ✅ · FE-P2-001~007 ✅  
> Chi tiết: [docs/tasks/STATUS.md](../../tasks/STATUS.md) · Audit: [code-vs-docs-audit.md](./code-vs-docs-audit.md)

**Tại sao critical**: Hiện tại đơn hàng chỉ track status. Không có hóa đơn → không thu tiền được.

**Tables mới**:
```sql
invoices (
  id, order_id, invoice_no VARCHAR(20) UNIQUE,
  invoice_date DATE, due_date DATE,
  amount_vnd DECIMAL(15,0),
  tax_amount DECIMAL(15,0),
  total_amount DECIMAL(15,0),
  status ENUM('draft','sent','paid','overdue','cancelled'),
  paid_at DATETIME, paid_amount DECIMAL(15,0),
  payment_method ENUM('bank_transfer','cash','other'),
  note TEXT,
  -- audit columns
)

invoice_items (
  id, invoice_id, order_detail_id,
  product_name VARCHAR(255), quantity INT,
  unit_price_vnd DECIMAL(15,0), amount DECIMAL(15,0)
)
```

**API**:
```
GET    /invoices              → list (filter: status, company_id, date range)
POST   /invoices              → tạo từ order_id (admin only)
GET    /invoices/{id}         → chi tiết + items
PUT    /invoices/{id}         → cập nhật (chỉ status draft)
POST   /invoices/{id}/send    → gửi email hóa đơn → sent
POST   /invoices/{id}/pay     → ghi nhận thanh toán → paid
GET    /invoices/{id}/pdf     → xuất PDF hóa đơn
```

**Luồng** (đã mở rộng — xem `invoice-payment.md`):
```
Order CONFIRMED
  → AUTO: InvoiceService::createFromOrder() → invoice (status: draft)
  → Admin gửi email PDF → invoice (status: sent)
  → Công ty chuyển khoản → Admin mark Paid (status: paid)
  → Nếu quá due_date → cron 9h JST → overdue

Delivery 2 bước:
  → Admin: DELIVERED_ADMIN (xác nhận phía JP)
  → Đại lý: PUT /orders/{id}/confirm-receipt → COMPLETED (invoice auto-paid)
  → Không xác nhận sau 7 ngày → Scheduler auto COMPLETED
```

**FE màn hình**:
- `/invoices` — danh sách hóa đơn (admin: tất cả; company: của mình)
- `/invoices/{id}` — chi tiết + nút "Ghi nhận thanh toán"
- PDF template (dùng DomPDF / mPDF)

---

### T1-002: Dashboard Analytics (Thống kê thực)

**Trạng thái** (2026-06-08): ✅ Triển khai — `GET /dashboard/stats`, `GET /dashboard/charts/orders`, FE DashboardScreen.

**Tại sao critical**: Dashboard cần dữ liệu thật để demo khách hàng.

**API cần thêm**:
```
GET /dashboard/stats
  Response:
  {
    "orders_today": 12,
    "orders_month": 145,
    "revenue_month_vnd": 450000000,
    "top_products": [ {id, name, order_count, revenue} x5 ],
    "orders_by_status": { PENDING:5, CONFIRMED:3, DELIVERED:10 },
    "inventory_alerts": [ {product_id, name, quantity, min_threshold} ],
    "exchange_rate_current": { jpy_vnd: 175.5, updated_at }
  }

GET /dashboard/charts/orders?period=30d   → đơn hàng theo ngày
GET /dashboard/charts/revenue?period=30d  → doanh thu theo ngày
```

**FE**:
- Dùng Recharts (đã có trong Next.js) để vẽ biểu đồ
- Card: Đơn hôm nay / Tháng này / Doanh thu tháng / Cảnh báo tồn kho
- Tự động refresh 5 phút (SWR interval)

---

### T1-003: Auto Price Calculation (Tính giá tự động)

**Hiện trạng**: `unit_price_vnd` trên `order_details` nhập tay → sai số, mất thời gian.

**Công thức**:
```
unit_price_vnd = cost_jpy × exchange_rate × (1 + tax_rate) × (1 + markup_rate)
```

**Thêm vào `products`**:
```sql
ALTER TABLE products ADD COLUMN cost_jpy DECIMAL(12,2) NULL;     -- giá vốn JPY
ALTER TABLE products ADD COLUMN tax_rate DECIMAL(5,4) DEFAULT 0.10;  -- thuế nhập
ALTER TABLE products ADD COLUMN markup_rate DECIMAL(5,4) DEFAULT 0.20; -- lợi nhuận
```

**API**:
```
GET /products/{id}/price-preview?exchange_rate_id={id}
  → { cost_jpy, exchange_rate, tax_rate, markup_rate, unit_price_vnd }

POST /orders (cập nhật)
  → Nếu không truyền unit_price_vnd → tự tính từ công thức
  → Lưu exchange_rate_id vào order (lock tỷ giá tại thời điểm CONFIRMED)
```

---

## TIER 2 — Important

### T2-001: Notification System (Thông báo)

**Kênh**: Email (đã có) + In-app notification + (tương lai) LINE/Zalo.

**Table**:
```sql
notifications (
  id, user_type ENUM('admin','company_vn','branch_user'),
  user_id INT, type VARCHAR(50),
  title VARCHAR(255), body TEXT,
  link VARCHAR(500), is_read TINYINT(1) DEFAULT 0,
  read_at DATETIME, created DATETIME
)
```

**Trigger tự động**:
| Sự kiện | Nhận thông báo |
|---------|----------------|
| Order tạo mới | Admin JP |
| Order CONFIRMED | Company VN |
| Order DELIVERED | Company VN + Branch Manager (nếu có) |
| Invoice gửi | Company VN |
| Invoice quá hạn | Admin JP + Company VN |
| Tồn kho < ngưỡng | Admin JP |

**API**:
```
GET  /notifications?unread=1    → danh sách
PUT  /notifications/{id}/read   → đánh dấu đã đọc
PUT  /notifications/read-all    → đọc tất cả
```

---

### T2-002: Bulk Import Products (Import hàng loạt)

**Mục đích**: Admin Nhật thêm hàng trăm sản phẩm từ catalog Excel/CSV.

**Format CSV**: `product_cd, name_jp, name_vi, description_jp, description_vi, cost_jpy, category_id, supplier_id`

**API**:
```
POST /products/import          → upload CSV/Excel
GET  /products/import/{job_id} → poll progress (queue job)
GET  /products/import-template → download template CSV
```

**FE**: Upload form với preview 10 dòng đầu, báo lỗi validation từng dòng.

---

### T2-003: Rate Limiting & Security

**Hiện trạng**: Không có rate limiting trên API → dễ bị brute force / DDoS.

**Cần thêm**:
```php
// routes/api.php
Route::middleware(['throttle:login'])->group(function () {
    Route::post('/auth/login', ...);
});

// Trong AppServiceProvider:
RateLimiter::for('login', function (Request $request) {
    return Limit::perMinute(5)->by($request->ip());
});

RateLimiter::for('api', function (Request $request) {
    return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
});
```

**Cũng cần**:
- CORS config cụ thể (không dùng `*`)
- Helmet headers (X-Frame-Options, CSP)
- API versioning: `/api/v1/...`

---

### T2-004: Audit Log (Lịch sử thao tác)

**Mục đích**: Biết ai làm gì lúc nào. Quan trọng cho B2B.

**Table**:
```sql
audit_logs (
  id BIGINT PK,
  user_type VARCHAR(30),
  user_id INT,
  action VARCHAR(50),     -- 'create','update','delete','login'
  model_type VARCHAR(50), -- 'Product','Order','Invoice'
  model_id INT,
  old_values JSON,        -- giá trị trước
  new_values JSON,        -- giá trị sau
  ip_address VARCHAR(45),
  user_agent TEXT,
  created DATETIME
)
```

**Implement bằng Observer**:
```php
// ProductObserver: updated(), created(), deleted()
// OrderObserver: updated() — track status changes
// Dùng queue để không ảnh hưởng request time
```

---

### T2-005: Branch Management Screens (FE)

**Hiện trạng** (2026-06-08, commit `ecba6d1`): Phase 1 ✅ — `/admin/branches`, `/admin/branches/{id}/users`, `/my-branch`, menu theo role.

**Còn lại**:
- Tab "Theo chi nhánh" trên product detail (`branch-stats`)
- `/admin/branches/{id}/edit` form riêng (hiện tạo inline trên list)
- `/branch/dashboard` — dashboard riêng cho branch (hiện dùng `/dashboard` chung)

---

## TIER 3 — Nice-to-have

### T3-001: PWA / Mobile-first cho Branch Staff

**Lý do**: Branch staff dùng điện thoại để xem đơn hàng tại kho/cửa hàng.

**Cần làm**:
- Thêm `manifest.json` + Service Worker vào Next.js
- Layout mobile-first cho `/branch/*`
- Offline fallback khi mất mạng
- Push notification qua Web Push API

---

### T3-002: Reorder Alert & Min Stock Threshold

**Thêm vào `inventories`**:
```sql
ALTER TABLE inventories ADD COLUMN min_threshold INT DEFAULT 0;
ALTER TABLE inventories ADD COLUMN reorder_quantity INT DEFAULT 0;
```

**Cron job** (Laravel Scheduler):
```php
Schedule::command('inventory:check-threshold')
    ->dailyAt('08:00')
    ->timezone('Asia/Tokyo');
```
→ Nếu `quantity < min_threshold` → tạo notification T2-001 + gửi email.

---

### T3-003: Demand Forecast (Dự báo nhu cầu)

**Dùng GPT-4** phân tích lịch sử đơn hàng → gợi ý đặt hàng tháng tới.

```
POST /ai/forecast
  Body: { product_id, months_history: 6 }
  Response: { forecast_quantity, confidence, reasoning }
```

Logic: lấy `order_details` 6 tháng → tính trung bình + trend → prompt GPT với context → parse response.

---

### T3-004: Barcode Scanner (Kho hàng)

**Mục đích**: Quét barcode sản phẩm khi nhập/xuất kho thay vì nhập tay.

**Implement**:
- FE: dùng `quagga2` hoặc Web Barcode Detection API
- Map barcode → `products.product_cd`
- Mobile-friendly UI cho màn hình kho

---

### T3-005: Supplier API Integration

**Mục đích**: Tự động lấy catalog, giá, tồn kho từ nhà cung cấp Nhật (Rakuten/Monotaro API).

**Luồng**:
```
Cron hằng ngày → gọi Supplier API → so sánh với products
→ Nếu giá thay đổi > 5% → notification cho Admin
→ Nếu sản phẩm mới → tạo ai_product_candidates để duyệt
```

---

## Thứ tự triển khai khuyến nghị

```
Phase 2 (sau RBAC hoàn thành):
  Sprint 1–2: T1-002 Dashboard + T1-003 Auto Price
  Sprint 3–4: T1-001 Invoice/Payment
  Sprint 5–6: T2-001 Notifications + T2-003 Rate Limiting

Phase 3:
  Sprint 7–8:  T2-002 Bulk Import + T2-004 Audit Log
  Sprint 9–10: T2-005 Branch FE screens

Phase 4 (scale):
  T3-001 PWA → T3-002 Reorder → T3-003 Forecast → T3-004 Barcode → T3-005 Supplier API
```

---

## Ước tính chi phí tăng thêm (monthly)

| Tính năng | Chi phí ước tính |
|-----------|-----------------|
| Invoice PDF (DomPDF) | Free |
| Dashboard charts | Free (Recharts) |
| Notifications in-app | Free |
| Email tăng thêm (SendGrid) | ~$15/tháng nếu > 10k email |
| AI Forecast (GPT-4) | ~$5–20/tháng tuỳ usage |
| LINE/Zalo OA | ~¥5,000/tháng |
| Barcode scanner (web) | Free |

> **Tổng Phase 2–3 thêm**: ~$20–35/tháng (chủ yếu email + AI)
