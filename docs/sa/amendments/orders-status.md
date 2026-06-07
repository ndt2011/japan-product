# Amendment: Trạng thái đơn hàng `orders.status`

> **Ngày**: 2026-06-07 | **Trạng thái**: Tạm áp dụng  
> **Nguồn**: WF-02, US-301~303

## Vấn đề

Migration gốc dùng `order_status` kiểu `boolean` — không đủ cho workflow.

## Thay đổi

Thêm cột `status` varchar(20), xóa `order_status`.

| Giá trị | Mô tả |
|---------|--------|
| `DRAFT` | Nháp — VN Branch chỉnh sửa |
| `PENDING` | Đã gửi — chờ JP xác nhận |
| `CONFIRMED` | JP đã xác nhận — tỷ giá locked |
| `PROCESSING` | Đang chuẩn bị |
| `SHIPPED` | Đã gửi |
| `DELIVERED` | Đã giao |
| `CANCELLED` | Hủy |

## Quy tắc

- `DRAFT → PENDING`: reserve `inventories.reserved_qty`
- `PENDING → CONFIRMED`: lock `orders.exchange_rate`
- Không đặt quá `quantity - reserved_qty` tồn kho khả dụng
