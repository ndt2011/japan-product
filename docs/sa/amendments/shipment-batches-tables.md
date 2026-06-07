# Amendment — Shipment Batches (Sprint 5)

> **REQ-005 tạm** — chờ SA bổ sung sheet chính thức trong `03_Thiết_kế_CSDL.xlsx`

## Bảng `shipment_batches`

| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | bigint PK | |
| batch_no | varchar(50) | BAT-YYYYMMDD-#### |
| batch_name | varchar(255) | Tên chuyến |
| status | varchar(30) | PREPARING → CUSTOMS_JP → IN_TRANSIT → CUSTOMS_VN → DELIVERED |
| logistics_partner | varchar(255) | nullable |
| tracking_number | varchar(100) | nullable |
| estimated_departure_date | date | nullable |
| created_admin_id | int FK admins | |
| created | datetime | |
| modified | datetime | nullable |
| deleted_flag | boolean | default false |

## Bảng `batch_order_items`

| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | bigint PK | |
| shipment_batch_id | int FK | |
| order_id | int FK | UNIQUE khi batch active |
| created | datetime | |

## Business rules (từ BA)

- RULE-BATCH-01: Chỉ đơn `CONFIRMED` được gom
- RULE-BATCH-02: Một đơn chỉ thuộc 1 chuyến active
- RULE-BATCH-03: Chuyến phải có ≥ 1 đơn
- RULE-BATCH-04: Không sửa danh sách đơn khi status ≥ IN_TRANSIT
- RULE-BATCH-05: Batch DELIVERED → tất cả đơn DELIVERED

## Message codes

| Mã | Ý nghĩa |
|----|---------|
| M0501 | Đơn không ở trạng thái CONFIRMED |
| M0502 | Đơn đã thuộc chuyến khác |
| M0503 | Chuyến phải có ít nhất 1 đơn |
| M0504 | Không sửa đơn khi chuyến đã IN_TRANSIT+ |
| M0505 | Chuyển trạng thái chuyến không hợp lệ |
| M0506 | Tạo/cập nhật chuyến thành công |
| M0507 | Không có quyền truy cập chuyến |
