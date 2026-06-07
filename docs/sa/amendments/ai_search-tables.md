# Amendment: Bảng AI Search

> **Ngày**: 2026-06-07 | **Trạng thái**: ✅ Migration + API đã triển khai (luồng A)  
> **Chờ SA**: Sync vào `03_Thiết_kế_CSDL.xlsx`  
> **Nguồn**: US-201, US-202, UC-201, UC-202, TC-AI-001~007

## Hai luồng AI (tách biệt)

| Luồng | Bảng / cột | API | Code |
|-------|------------|-----|------|
| **A — Khám phá SP mới** | `ai_search_sessions`, `ai_product_candidates` | `/ai/search`, `/ai/candidates` | ✅ `project/api` |
| **B — Tìm catalog nội bộ** | `products.embedding` (JSON) | `POST /ai/product-search` | ✅ `ProductEmbeddingService` |

## `ai_search_sessions`

| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | bigint PK | |
| keyword | varchar(500) | Từ khóa user nhập |
| status | varchar(20) | `processing` \| `completed` \| `failed` \| `timeout` |
| user_type | varchar(20) | `admin` \| `company` |
| user_id | bigint | FK logic tới admins / companies_vn |
| results_json | json nullable | Mảng kết quả tìm (tối đa 10) |
| error_message | text nullable | |
| created | datetime | |
| completed_at | datetime nullable | |

## `ai_product_candidates`

| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | bigint PK | |
| ai_search_session_id | bigint nullable FK | Phiên tìm gốc |
| product_name_jp | varchar(255) | |
| product_name_vn | varchar(255) nullable | Sửa khi duyệt |
| image_url | varchar(500) nullable | |
| price_jpy | int unsigned nullable | |
| source_url | varchar(500) nullable | Link Rakuten/Amazon |
| source_platform | varchar(50) nullable | `rakuten` \| `amazon` |
| description | text nullable | |
| status | varchar(20) | `PENDING` \| `APPROVED` \| `REJECTED` |
| reject_reason | text nullable | Bắt buộc ≥10 ký tự khi reject |
| product_id | bigint nullable FK | Sau approve |
| created_user_type | varchar(20) | |
| created_user_id | bigint | |
| reviewed_user_type | varchar(20) nullable | |
| reviewed_user_id | bigint nullable | |
| created | datetime | |
| modified | datetime nullable | |
| deleted_flag | tinyint(1) default 0 | |

## Quy tắc

- Kết quả tìm: tối đa **10** item / session
- Không có kết quả → message **M0201**
- Timeout > 30s → **M0202**
- Gửi duyệt → tạo N bản ghi `PENDING`
- Approve → tạo `products` + `status=APPROVED`
