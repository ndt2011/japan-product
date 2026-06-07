# Yêu cầu làm rõ — Developer → PM/SA

> **Cập nhật**: 2026-06-07  
> **Trạng thái tổng**: 🟡 Một phần đã giải quyết — dev tiếp tục Sprint 2

---

## ✅ Đã giải quyết

### REQ-001: Task List — ✅ Resolved (2026-06-07)

Dev đã tạo:
- `docs/tasks/backend-tasks.md`
- `docs/tasks/frontend-tasks.md`

### REQ-002: API Contract — 🟡 Partial

Dev đã tạo bản markdown: `docs/sa/04_API_Contract.md` (Module 1 Auth + Module 2 Products).  
**Vẫn cần SA**: file `04_API_Contract.xlsx` chính thức cho các module còn lại.

### REQ-004: Login `companies_vn` — ✅ Resolved (2026-06-07)

Theo `1-001_Đăng_nhập.xlsx`, dev đã:
- Ghi amendment: `docs/sa/amendments/companies_vn-auth-columns.md`
- Migration: `add_auth_columns_to_companies_vn_table`
- Implement login KH VN (`user_type: company`)

**SA cần sync** cột `login_id`, `password` vào `03_Thiết_kế_CSDL.xlsx`.

---

## 🔴 Vẫn chờ phản hồi

### REQ-003: RBAC — users/roles vs admins

**Trạng thái**: ⏸ Blocked — Sprint 3  
**Quyết định tạm**: Dùng `admins` + `companies_vn` cho Auth, RBAC chờ SA.

### REQ-005: CSDL thiếu 11 bảng chi tiết

**Trạng thái**: 🟡 Partial — dev chỉ migrate 12 bảng có spec.

---

## Tiến độ dev (2026-06-07)

| Module | Backend | Frontend |
|--------|---------|----------|
| Auth (admin + company) | ✅ | ✅ Login page |
| Products CRUD API | ✅ | ✅ List page |
| RBAC | ⏸ | ⏸ |
| AI Search | ⏸ | ⏸ |
