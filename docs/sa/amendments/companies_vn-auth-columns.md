# Amendment — `companies_vn` Auth Columns

> **Ngày**: 2026-06-07 | **Duyệt bởi**: Dev (theo SA screen spec)  
> **Nguồn**: `1-001_Đăng_nhập.xlsx` Sheet 4 — trường Login ID, Mật khẩu map vào `companies_vn`

## Lý do

`03_Thiết_kế_CSDL.xlsx` sheet `companies_vn` chưa liệt kê `login_id`, `password`, nhưng màn hình đăng nhập yêu cầu KH VN đăng nhập qua bảng này.

## Bổ sung cột

| Cột | Kiểu | Not Null | Ghi chú |
|-----|------|----------|---------|
| `login_id` | varchar(50) | Yes | Unique |
| `password` | varchar(255) | Yes | BCrypt hash |

## Index

- `idx_companies_vn_login_id` UNIQUE (`login_id`)

## Migration

`2026_06_07_100001_add_auth_columns_to_companies_vn_table.php`
