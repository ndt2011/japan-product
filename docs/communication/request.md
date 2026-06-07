# Yêu cầu làm rõ — Developer → PM/SA

> **Cập nhật**: 2026-06-07  
> **Trạng thái tổng**: S1–S5 core ~70% — RBAC & lockout blocked  
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

### REQ-005: CSDL thiếu sheet xlsx (đã có amendment + code)

**Đã code**: `product_images`, `ai_search_sessions`, `ai_product_candidates`, `shipment_batches`  
**Cần SA**: Sync amendments vào `03_Thiết_kế_CSDL.xlsx`  
**Chưa code**: `products.embedding` (luồng B semantic search)

### REQ-002: API Contract xlsx

**Đã có tạm**: `04_API_Contract.md` v2.0 — Auth, Products, AI (2 luồng), Orders, Shipments  
**Cần SA**: Export/xác nhận `04_API_Contract.xlsx` chính thức

### REQ-008: login_id vs email

**Quyết định dev**: Giữ **`login_id`** theo `1-001` + API contract  
**Cần SA**: Cập nhật `backend-tasks` BE-004, `remember-me-spec` cho thống nhất

---

## 🟡 Đang làm (dev — không cần chờ)

| ID | Việc | File liên quan |
|----|------|----------------|
| BE-016b | AI embedding `/ai/product-search` | `sa/AI_Search_Implementation.md` |
| ~~BE-021~~ | Email đơn mới / confirm | ✅ `OrderMailService` |
| DEV-12/13 | Railway + Vercel staging | `devops/staging-setup.md` |

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
