# Backend Tasks — Laravel 11

> **Cập nhật**: 2026-06-07 | **Nguồn**: HANDOFF.md + docs/sa/

## Sprint 1 — Foundation & Auth

| ID | Mô tả | Priority | Dependency | Estimate | Trạng thái |
|----|-------|----------|------------|----------|------------|
| BE-001 | Khởi tạo Laravel 11 + Sanctum + Redis config | P0 | — | 2h | ✅ Done |
| BE-002 | Migration 13 bảng theo `03_Thiết_kế_CSDL.xlsx` | P0 | BE-001 | 4h | ✅ Done |
| BE-003 | Auth API: login / logout / me (admins) | P0 | BE-002 | 4h | ✅ Done |
| BE-004 | Migration `companies_vn` thêm `login_id`, `password` (theo `1-001`) | P0 | BE-002 | 1h | ✅ Done |
| BE-005 | Auth API: login KH Việt Nam (`companies_vn`) | P0 | BE-004 | 3h | ✅ Done |
| BE-006 | Seeder: admin + company mẫu | P1 | BE-005 | 1h | ✅ Done |

## Sprint 2 — Products (Module 2)

| ID | Mô tả | Priority | Dependency | Estimate | Trạng thái |
|----|-------|----------|------------|----------|------------|
| BE-101 | Products CRUD API theo `2-001_Thông_tin_hàng_hóa.xlsx` | P0 | BE-003 | 8h | ✅ Done |
| BE-102 | GET suppliers_jp (dropdown) | P1 | BE-101 | 2h | ✅ Done |
| BE-103 | GET exchange_rates hiện tại (JPY→VND) | P1 | BE-101 | 2h | ✅ Done |
| BE-104 | Upload ảnh sản phẩm (R2/local) | P2 | BE-101 | 4h | 📋 Todo |

## Sprint 3 — RBAC (Chờ SA)

| ID | Mô tả | Priority | Dependency | Estimate | Trạng thái |
|----|-------|----------|------------|----------|------------|
| BE-201 | RBAC middleware `CheckPermission` | P1 | REQ-003 resolved | 8h | ⏸ Blocked |
| BE-202 | Roles + permissions seed | P1 | BE-201 | 4h | ⏸ Blocked |

## Sprint 4 — AI Search (Chờ tài liệu)

| ID | Mô tả | Priority | Dependency | Estimate | Trạng thái |
|----|-------|----------|------------|----------|------------|
| BE-301 | AI search job + `ai_product_candidates` | P1 | `2-101` screen doc | 12h | ⏸ Blocked |
| BE-302 | Queue worker Redis | P1 | BE-301 | 2h | ⏸ Blocked |

## Ghi chú kỹ thuật

- Response format: `{ success, data, message, errors }`
- Message codes: `06_Hằng_số_thông_báo.xlsx`
- Auth model: `admins` + `companies_vn` (không dùng `users` cho đến khi SA cập nhật CSDL)
- API contract chi tiết: `docs/sa/04_API_Contract.md`
