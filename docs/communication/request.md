# Yêu cầu làm rõ — Developer → PM/SA

> **Cập nhật**: 2026-06-07  
> **Trạng thái tổng**: Sprint 1 ~55% — RBAC & lockout blocked  
> **Việc tiếp theo**: [docs/tasks/STATUS.md](../tasks/STATUS.md)

---

## ✅ Đã giải quyết

| REQ | Nội dung |
|-----|----------|
| REQ-001 | Task list (`docs/tasks/`) |
| REQ-004 | Login `companies_vn` + amendment |
| REQ-006 | Remember Me — API 24h/30d + FE checkbox |

---

## 🔴 Chờ SA/PM (block dev)

### REQ-003: RBAC — schema thiếu

**Block**: BE-002, BE-003, BE-007, BE-008, FE-004 (menu role), FE-005, FE-402  
**Lý do**: `03_Thiết_kế_CSDL.xlsx` / `_schema.json` không có `users`, `roles`, `permissions`  
**Cần**: Bổ sung sheet RBAC hoặc xác nhận map `admins` → users

### REQ-007: Mã lockout conflict

**Block**: BE-006, TC-AUTH-006  
**Conflict**: M0103 = login success (code) vs M0103 = account locked (QA)  
**Đề xuất**: M0104 = tài khoản bị khóa (HTTP 423)

### REQ-005: CSDL thiếu bảng chi tiết

**Block**: `product_images`, `ai_*`, `shipment_*` migrations  
**Cần**: Sheet đầy đủ trong `03_Thiết_kế_CSDL.xlsx`

### REQ-002: API Contract xlsx

**Block**: Module AI, Order, Batch API  
**Hiện có**: `04_API_Contract.md` (Auth + Products only)

### REQ-008: login_id vs email

**Quyết định dev**: Giữ **`login_id`** theo `1-001` + API contract  
**Cần SA**: Cập nhật `backend-tasks` BE-004, `remember-me-spec` cho thống nhất

---

## 🟡 Đang làm (dev — không cần chờ)

| ID | Việc | File liên quan |
|----|------|----------------|
| DEV-01 | `GET /health` | `routes/api.php` |
| DEV-03 | Zustand auth store | `project/frontend` |
| DEV-08 | Products pagination/filter | `ProductController` |
| DEV-09 | Form thêm/sửa sản phẩm | `2-001` xlsx |
| DEV-12/13 | Railway + Vercel staging | DevOps |

---

## Tiến độ module (2026-06-07)

| Module | Backend | Frontend | QA |
|--------|---------|----------|-----|
| Auth + Remember Me | ✅ | ✅ | 🔄 |
| RBAC | ⏸ | ⏸ | ⏸ |
| Account lockout | ⏸ | — | ⏸ |
| Products CRUD | 🔄 | 🔄 List | 🔄 |
| UI demothietke (12 route) | — | 🔄 | — |
| AI Search | ✅ mock | ✅ API | 🔄 |
| Orders | 📋 | 🔄 demo | 📋 |
| CI GitHub Actions | ✅ test | ✅ build | — |
| Cloud deploy | 📋 | 📋 | 📋 |
