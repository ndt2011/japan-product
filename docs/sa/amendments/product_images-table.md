# Amendment: Bảng `product_images`

> **Ngày**: 2026-06-07 | **Trạng thái**: Tạm áp dụng — chờ SA sync `03_Thiết_kế_CSDL.xlsx`  
> **Lý do**: REQ-005 — nhiều ảnh/sản phẩm (RULE-PROD-01), `products.image_path` chỉ lưu ảnh chính

## Schema đề xuất

| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | int unsigned PK | |
| product_id | int FK → products | |
| image_path | varchar(500) | URL R2 hoặc path |
| is_primary | tinyint(1) default 0 | Ảnh chính |
| order_no | int default 0 | Thứ tự gallery |
| created | datetime | |
| deleted_flag | tinyint(1) default 0 | Soft delete |

## Quy tắc

- Mỗi product có tối đa 1 `is_primary = 1`
- `products.image_path` sync từ ảnh primary (khi upload API hoàn thiện)
