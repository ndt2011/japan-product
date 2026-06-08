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
| `DELIVERED` | Đã giao (legacy) |
| `DELIVERED_ADMIN` | JP/chuyến hàng xác nhận giao — chờ đại lý nhận |
| `COMPLETED` | Đại lý xác nhận nhận (hoặc auto sau 7 ngày) |
| `CANCELLED` | Hủy |

> **Lưu ý triển khai (2026-06-08)**: Spec ban đầu có `DELIVERED_CLIENT` làm bước trung gian.  
> **Code hiện tại** nhảy thẳng `DELIVERED_ADMIN` → `COMPLETED` và set `delivered_client_at` cùng lúc.  
> Cột `delivered_client_at` vẫn được ghi khi confirm-receipt hoặc auto-complete.

## Quy tắc

- `DRAFT → PENDING`: reserve `inventories.reserved_qty`
- `PENDING → CONFIRMED`: lock `orders.exchange_rate`
- Không đặt quá `quantity - reserved_qty` tồn kho khả dụng
