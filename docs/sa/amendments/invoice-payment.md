# Amendment — Invoice, Dual Pricing & Delivery Confirmation

> **Ngày**: 2026-06-08 | **Tác giả**: SA  
> **Ticket**: Phase 2 — T1-001 + T1-003  
> **Trạng thái**: 📋 Chờ implement  
> **Liên quan**: `upgrade-roadmap.md` (T1-001, T1-003), `orders-status.md`

---

## 1. Bối cảnh & Vấn đề

| # | Vấn đề | Ảnh hưởng |
|---|--------|----------|
| 1 | Không có hóa đơn sau khi đơn CONFIRMED | Không thu tiền được, không có chứng từ |
| 2 | Chỉ có 1 giá (`price_jpy`), không tách giá vốn | Không tính được lợi nhuận Admin |
| 3 | Không có phí phát sinh (vận chuyển, thuế...) | Giá đại lý trả thiếu thực tế |
| 4 | Không có bước đại lý xác nhận nhận hàng | Admin đánh dấu DELIVERED ≠ thực tế đã giao |

---

## 2. Mô hình giá (Dual Pricing)

```
┌─────────────────────────────────────────────────────────────┐
│  cost_price_jpy   → Giá Admin mua từ nhà cung cấp JP        │
│                      (chỉ Admin thấy — KHÔNG hiện cho đại lý)│
│                                                              │
│  selling_price_jpy → Giá Admin bán cho đại lý VN            │
│                      (đại lý thấy trên hóa đơn)             │
│                                                              │
│  fee_rate          → Tỷ lệ phí phát sinh (mặc định 5%)      │
│                      Gồm: vận chuyển + thuế + phí xử lý     │
└─────────────────────────────────────────────────────────────┘
```

### Công thức tính giá

**Giá đại lý thực trả mỗi sản phẩm (VND):**
```
unit_price_vnd = selling_price_jpy × locked_rate × (1 + fee_rate)
               = selling_price_jpy × locked_rate × 1.05  (nếu fee_rate=5%)
```

**Lợi nhuận Admin (per order):**
```
gross_profit_jpy = Σ (selling_price_jpy - cost_price_jpy) × qty
gross_profit_vnd = gross_profit_jpy × locked_rate

net_profit_vnd   = gross_profit_vnd
                 - shipment_cost_vnd     (phí vận chuyển thực tế)
                 - customs_fee_vnd       (phí hải quan)
                 - other_fees_vnd        (phí khác)
```

**Lưu ý phân quyền xem giá:**
| Trường | Admin | Đại lý VN | Branch |
|--------|:-----:|:---------:|:------:|
| `cost_price_jpy` | ✅ | ❌ | ❌ |
| `selling_price_jpy` | ✅ | ❌ | ❌ |
| `unit_price_vnd` (sau tính) | ✅ | ✅ | ✅ |
| `fee_rate` | ✅ | ✅ (chỉ %) | ✅ (chỉ %) |

---

## 3. Database Changes

### 3.1 Bảng `products` — Thêm cột

```sql
ALTER TABLE products
  ADD COLUMN cost_price_jpy   DECIMAL(12,2) NULL     COMMENT 'Giá vốn (Admin mua từ NCC JP) — chỉ Admin thấy',
  ADD COLUMN fee_rate          DECIMAL(5,4)  DEFAULT 0.0500 COMMENT 'Tỷ lệ phí phát sinh (vận chuyển + thuế...) — mặc định 5%';

-- Đổi tên cột hiện tại cho rõ nghĩa (migration mới)
-- price_jpy → selling_price_jpy (hoặc giữ nguyên nếu quá nhiều dep)
-- Khuyến nghị: thêm cột selling_price_jpy = price_jpy, giữ price_jpy để backward-compat
ALTER TABLE products
  ADD COLUMN selling_price_jpy DECIMAL(12,2) NULL COMMENT 'Giá bán cho đại lý VN (JPY)';
-- Sau migrate: UPDATE products SET selling_price_jpy = price_jpy WHERE selling_price_jpy IS NULL;
```

### 3.2 Bảng `orders` — Thêm status mới

```sql
-- Thêm 2 giá trị vào orders.status (nếu dùng VARCHAR — không cần ALTER):
-- DELIVERED_ADMIN   → Admin xác nhận đã giao hàng phía Nhật/cảng VN
-- DELIVERED_CLIENT  → Đại lý xác nhận đã nhận hàng thực tế
-- COMPLETED         → Hoàn tất (sau DELIVERED_CLIENT); invoice → paid

-- Thứ tự đầy đủ:
-- DRAFT → PENDING → CONFIRMED → PROCESSING → DELIVERED_ADMIN
--   → DELIVERED_CLIENT → COMPLETED
-- (CANCELLED có thể từ DRAFT hoặc PENDING)

-- Thêm cột tracking thời gian xác nhận
ALTER TABLE orders
  ADD COLUMN delivered_admin_at   DATETIME NULL COMMENT 'Thời gian Admin xác nhận giao',
  ADD COLUMN delivered_client_at  DATETIME NULL COMMENT 'Thời gian đại lý xác nhận nhận',
  ADD COLUMN completed_at         DATETIME NULL COMMENT 'Thời gian hoàn tất';
```

### 3.3 Bảng `invoices` — Mới

```sql
CREATE TABLE invoices (
  id                INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  invoice_no        VARCHAR(20)     NOT NULL UNIQUE         COMMENT 'INV-2026-000001 (auto-gen)',
  order_id          INT UNSIGNED    NOT NULL,
  company_vn_id     INT UNSIGNED    NULL                    COMMENT 'NULL nếu là branch order',
  branch_id         INT UNSIGNED    NULL                    COMMENT 'NULL nếu là company order',

  invoice_date      DATE            NOT NULL,
  due_date          DATE            NOT NULL                COMMENT 'invoice_date + 30 ngày',

  locked_rate       DECIMAL(10,4)   NOT NULL                COMMENT 'Copy từ orders.locked_rate',
  fee_rate          DECIMAL(5,4)    NOT NULL DEFAULT 0.0500 COMMENT 'Tỷ lệ phí tại thời điểm tạo HĐ',

  subtotal_jpy      DECIMAL(14,2)   NOT NULL DEFAULT 0      COMMENT 'Tổng JPY trước phí',
  subtotal_vnd      DECIMAL(15,0)   NOT NULL DEFAULT 0      COMMENT 'subtotal_jpy × locked_rate',
  fee_amount_vnd    DECIMAL(15,0)   NOT NULL DEFAULT 0      COMMENT 'subtotal_vnd × fee_rate',
  tax_vnd           DECIMAL(15,0)   NOT NULL DEFAULT 0      COMMENT 'VAT nếu có (0 = không tính)',
  total_vnd         DECIMAL(15,0)   NOT NULL DEFAULT 0      COMMENT 'subtotal_vnd + fee_amount_vnd + tax_vnd',

  status            VARCHAR(20)     NOT NULL DEFAULT 'draft'
                                    COMMENT 'draft | sent | paid | overdue | cancelled',
  sent_at           DATETIME        NULL                    COMMENT 'Khi gửi email HĐ cho đại lý',
  paid_at           DATETIME        NULL,
  paid_amount_vnd   DECIMAL(15,0)   NULL,
  payment_method    VARCHAR(30)     NULL                    COMMENT 'bank_transfer | cash | other',
  payment_note      TEXT            NULL,

  note              TEXT            NULL                    COMMENT 'Ghi chú HĐ',
  pdf_path          VARCHAR(500)    NULL                    COMMENT 'Path file PDF đã tạo',

  created           DATETIME        NOT NULL,
  created_user_id   INT UNSIGNED    NOT NULL,
  modified          DATETIME        NULL,
  modified_user_id  INT UNSIGNED    NULL,
  deleted_flag      TINYINT(1)      NOT NULL DEFAULT 0,

  PRIMARY KEY (id),
  UNIQUE KEY uq_invoice_no (invoice_no),
  KEY idx_order_id (order_id),
  KEY idx_status (status),
  KEY idx_due_date (due_date)
) COMMENT='Hóa đơn phát sinh từ đơn hàng';
```

### 3.4 Bảng `invoice_items` — Mới

```sql
CREATE TABLE invoice_items (
  id                  INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  invoice_id          INT UNSIGNED  NOT NULL,
  order_detail_id     INT UNSIGNED  NOT NULL              COMMENT 'FK → order_details.id',
  product_id          INT UNSIGNED  NOT NULL,

  -- Snapshot tại thời điểm tạo hóa đơn (không thay đổi dù SP bị sửa)
  product_name_jp     VARCHAR(255)  NOT NULL,
  product_name_vi     VARCHAR(255)  NULL,
  product_sku         VARCHAR(100)  NULL,

  quantity            INT           NOT NULL,

  -- Giá (ẩn với đại lý)
  cost_price_jpy      DECIMAL(12,2) NULL                  COMMENT 'Giá vốn — chỉ Admin',
  selling_price_jpy   DECIMAL(12,2) NOT NULL               COMMENT 'Giá bán JPY — chỉ Admin',

  -- Giá đại lý thấy
  unit_price_vnd      DECIMAL(15,0) NOT NULL               COMMENT '= selling_price_jpy × locked_rate × (1+fee_rate)',
  fee_amount_vnd      DECIMAL(15,0) NOT NULL DEFAULT 0     COMMENT 'Phần phí của dòng này',
  line_total_vnd      DECIMAL(15,0) NOT NULL               COMMENT '= unit_price_vnd × qty',

  PRIMARY KEY (id),
  KEY idx_invoice_id (invoice_id),
  KEY idx_order_detail_id (order_detail_id)
) COMMENT='Chi tiết từng sản phẩm trong hóa đơn';
```

### 3.5 Bảng `order_costs` — Theo dõi chi phí thực tế (Admin nhập)

```sql
CREATE TABLE order_costs (
  id               INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  order_id         INT UNSIGNED  NOT NULL,
  batch_id         INT UNSIGNED  NULL                COMMENT 'Nếu gán cho chuyến hàng',
  cost_type        VARCHAR(50)   NOT NULL            COMMENT 'shipping|customs_jp|customs_vn|handling|other',
  amount_vnd       DECIMAL(15,0) NOT NULL,
  note             VARCHAR(500)  NULL,
  created          DATETIME      NOT NULL,
  created_user_id  INT UNSIGNED  NOT NULL,
  PRIMARY KEY (id),
  KEY idx_order_id (order_id)
) COMMENT='Chi phí thực tế Admin nhập để tính lãi ròng';
```

---

## 4. Luồng nghiệp vụ

### 4.1 Tạo hóa đơn (Auto khi CONFIRMED)

```
[Đại lý] Gửi đơn → PENDING
    ↓
[Admin] PUT /orders/{id}/confirm
    → orders.status = CONFIRMED
    → orders.locked_rate = current_rate
    → AUTO: InvoiceService::createFromOrder($order)
        - Tạo invoice (status=draft)
        - Tạo invoice_items từ order_details
        - Tính unit_price_vnd = selling_price_jpy × locked_rate × (1 + fee_rate)
        - Tính tổng subtotal_vnd, fee_amount_vnd, total_vnd
    → Email thông báo đơn đã xác nhận (KHÔNG kèm hóa đơn — chờ Admin gửi)
```

### 4.2 Gửi hóa đơn

```
[Admin] POST /invoices/{id}/send
    → Xuất PDF (DomPDF)
    → Lưu PDF vào storage (invoices/INV-2026-000001.pdf)
    → Gửi email đến đại lý (kèm PDF đính kèm)
    → invoice.status = sent
    → invoice.sent_at = now()
```

### 4.3 Xác nhận thanh toán

```
[Admin] POST /invoices/{id}/pay
    Body: { paid_amount_vnd, payment_method, payment_note }
    → invoice.status = paid
    → invoice.paid_at = now()
```

### 4.4 Trạng thái đơn — 2 bước giao hàng

```
... → CONFIRMED → PROCESSING

Admin cập nhật chuyến hàng → DELIVERED_ADMIN
    → orders.delivered_admin_at = now()
    → Gửi thông báo đến đại lý: "Hàng đã được giao — vui lòng xác nhận"

[Đại lý] PUT /orders/{id}/confirm-receipt
    → orders.status = DELIVERED_CLIENT
    → orders.delivered_client_at = now()
    → invoice.status = paid (auto nếu chưa paid)
    → orders.status = COMPLETED
    → orders.completed_at = now()
    → stock_movements: INSERT (type=OUT, source=order)

[Scheduler — chạy hàng ngày 8h JST]
    Nếu delivered_admin_at < now() - 7 ngày VÀ status = DELIVERED_ADMIN:
    → Tự động COMPLETED + log cảnh báo
```

### 4.5 Cron: Invoice quá hạn

```
[Scheduler — chạy hàng ngày 9h JST]
    SELECT * FROM invoices WHERE status='sent' AND due_date < CURDATE()
    → UPDATE status = 'overdue'
    → Gửi thông báo cho Admin + Đại lý
```

---

## 5. API Endpoints

### Invoice API

```
# Admin only
GET    /api/invoices                    → Danh sách (filter: status, company_id, date)
POST   /api/invoices                    → Tạo thủ công (thường auto từ confirm order)
GET    /api/invoices/{id}               → Chi tiết + items
PUT    /api/invoices/{id}               → Sửa (chỉ khi status=draft)
POST   /api/invoices/{id}/send          → Gửi email PDF
POST   /api/invoices/{id}/pay           → Ghi nhận thanh toán
GET    /api/invoices/{id}/pdf           → Download PDF
DELETE /api/invoices/{id}               → Hủy (soft delete, status=cancelled)

# Đại lý thấy
GET    /api/invoices                    → Chỉ invoice của mình
GET    /api/invoices/{id}               → Chi tiết (ẩn cost_price_jpy, selling_price_jpy)
GET    /api/invoices/{id}/pdf           → Download PDF của mình
```

### Order — Thêm endpoint xác nhận nhận hàng

```
PUT /api/orders/{id}/confirm-receipt
    Auth: company hoặc branch_manager/branch_staff
    Điều kiện: orders.status = DELIVERED_ADMIN
    Action:
      → status = DELIVERED_CLIENT → COMPLETED
      → delivered_client_at = now()
      → completed_at = now()
      → Invoice auto-paid nếu chưa paid
```

### Profit Report API (Admin only)

```
GET /api/reports/profit
    Params: date_from, date_to, company_id (optional)
    Response:
    {
      "summary": {
        "total_revenue_vnd": 50000000,
        "total_cost_vnd": 35000000,
        "gross_profit_vnd": 15000000,
        "total_other_costs_vnd": 2000000,
        "net_profit_vnd": 13000000,
        "profit_margin_pct": 26.0
      },
      "by_order": [
        {
          "order_id": 1,
          "invoice_no": "INV-2026-000001",
          "revenue_vnd": 5000000,
          "cost_vnd": 3500000,
          "gross_profit_vnd": 1500000,
          "other_costs_vnd": 200000,
          "net_profit_vnd": 1300000
        }
      ]
    }

GET /api/reports/profit/by-product
    → Lợi nhuận theo từng sản phẩm (top/bottom performer)
```

---

## 6. Business Rules

| ID | Rule | Mô tả |
|----|------|-------|
| RULE-INV-01 | Auto-create on CONFIRM | Mỗi order CONFIRMED → 1 invoice (không tạo thêm) |
| RULE-INV-02 | Immutable after sent | Sau khi invoice status=sent, không sửa được amount |
| RULE-INV-03 | Due date = +30 ngày | invoice_date + 30 ngày (config được) |
| RULE-INV-04 | Overdue auto | Cron 9h JST kiểm tra due_date < today |
| RULE-INV-05 | PDF snapshot | PDF lưu vĩnh viễn — không tái tạo khi SP thay đổi |
| RULE-PRICE-01 | cost_price hidden | `cost_price_jpy` không trả về trong API response cho đại lý |
| RULE-PRICE-02 | fee_rate per product | Mỗi SP có fee_rate riêng (override global default 5%) |
| RULE-PRICE-03 | Lock at invoice | Tính toán lock tại thời điểm createFromOrder — không thay đổi sau |
| RULE-DEL-01 | 2-step delivery | DELIVERED_ADMIN bắt buộc trước COMPLETED |
| RULE-DEL-02 | Auto complete | Sau 7 ngày DELIVERED_ADMIN không có CLIENT → auto COMPLETED |
| RULE-DEL-03 | Stock out on complete | stock_movements INSERT khi COMPLETED (không phải khi DELIVERED_ADMIN) |

---

## 7. Frontend Screens

| Route | Mô tả | Role |
|-------|-------|------|
| `/invoices` | Danh sách hóa đơn — filter status, date | Admin (all), Đại lý (của mình) |
| `/invoices/{id}` | Chi tiết HĐ + items + nút actions | Admin + Đại lý |
| `/invoices/{id}/pdf` | Preview PDF inline | Admin + Đại lý |
| `/orders/{id}` | Thêm nút "✅ Đã nhận hàng" | Đại lý (khi DELIVERED_ADMIN) |
| `/reports` (tab Lợi nhuận) | Báo cáo lãi/lỗ — bảng + summary cards | Admin only |
| `/products/new` (sửa) | Thêm field cost_price_jpy, fee_rate | Admin only |

---

## 8. Checklist implement (cập nhật 2026-06-08)

> **Trạng thái**: ✅ **100%** — chi tiết [STATUS.md](../../tasks/STATUS.md) · audit [code-vs-docs-audit.md](./code-vs-docs-audit.md)

```
Backend:
  ☑ BE-P2-001: Migration products dual pricing
  ☑ BE-P2-002: Migration invoices + invoice_items + order_costs + patch
  ☑ BE-P2-003: Migration orders delivery tracking
  ☑ BE-P2-004: InvoiceService::createFromOrder()
  ☑ BE-P2-005: InvoiceController (CRUD + send + pay + pdf)
  ☑ BE-P2-006: DomPDF — dompdf/dompdf
  ☑ BE-P2-007: confirmReceipt (company + branch)
  ☑ BE-P2-008: invoices:check-overdue 9h JST
  ☑ BE-P2-009: orders:auto-complete 8h JST
  ☑ BE-P2-010: GET /reports/profit
  ☑ BE-P2-011: ProductResource ẩn cost non-admin
  ☑ BE-P2-012: order_costs API (GET/POST/DELETE)
  ☑ BE-P2-013: GET /reports/profit/by-product
  ☑ BE-P2-014: Lưu `pdf_path` + serve cached PDF (RULE-INV-05)

Frontend:
  ☑ FE-P2-001: /invoices
  ☑ FE-P2-002: /invoices/{id} + PDF
  ☑ FE-P2-003: Nút "Đã nhận hàng"
  ☑ FE-P2-004: Product form dual pricing (Admin)
  ☑ FE-P2-005: Tab Lợi nhuận trong /reports (bảng + cards)
  ☑ FE-P2-006: Badge 🔔 header
  ☑ FE-P2-007: Recharts chart profit (SP + đơn hàng)

QA (PHPUnit → manual staging — xem `docs/tasks/qa-tasks.md` QA-028~033):
  ☑ TC-INV-001: Tạo invoice từ order — `InvoiceTest` ✅
  ☑ TC-INV-002: unit_price_vnd dual pricing — `InvoiceTest` ✅
  □ TC-INV-003: Đại lý không thấy cost_price_jpy — manual
  ☑ TC-INV-004: PDF persist + cache — `InvoiceTest::test_pdf` ✅
  □ TC-INV-005: Invoice overdue sau due_date — scheduler manual
  ☑ TC-DEL-001: confirm-receipt → COMPLETED — `OrderTest` ✅
  □ TC-DEL-002: Auto COMPLETED 7 ngày — scheduler manual
  ☑ TC-PROFIT-001: profit + by-product — `ProfitReportTest` ✅
```
