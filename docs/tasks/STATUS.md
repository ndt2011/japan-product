# Trạng thái dự án & Việc cần làm tiếp

> **Cập nhật**: 2026-06-08 (dashboard + hybrid AI + agents)  
> **Repo**: https://github.com/ndt2011/japan-product  
> **Staging**: https://japan-product.vercel.app · API https://product-production-7e4e.up.railway.app

---

## Tóm tắt nhanh

| Sprint | Mục tiêu | Tiến độ | Ghi chú |
|--------|----------|---------|---------|
| **S1** Auth & RBAC | Login, RBAC, user mgmt | **~95%** | Lockout 5 lần/30p ✅ |
| **S2** Sản phẩm | CRUD + ảnh + branch-stats | **✅** | |
| **Dashboard** | Stats thật từ API | **✅** | `/dashboard/stats` |
| **S3** AI Search | Luồng A+B + hybrid | **~98%** | Phase 3 hybrid ✅ · Phase 4 GPT rerank ⏳ |
| **S4–S7** | Orders, shipments, kho, CN | **~90%** | |
| **Đại lý** | `/agents` | **✅** | List Công ty VN (admin) |

---

## ✅ Đã hoàn thành (MVP)

- Auth 4 role + RoleMiddleware + RouteGuard
- Tạo user: Admin, Công ty VN (`/admin`), Chi nhánh (`/admin/branches`)
- Kho, báo cáo, R2 ảnh, branch-system Phase 1
- Dashboard analytics API + FE
- AI catalog hybrid search (semantic + keyword)
- Login lockout (Cache/Redis, M0106)
- `/agents` — danh sách đại lý (công ty VN)

---

## 📋 Còn lại (sau MVP)

| ID | Việc | Priority |
|----|------|----------|
| **OPS-01** | Railway: `BranchSeeder` + `products:generate-vi` + `products:embed --force` | P0 |
| **T1-001** | Invoice & Payment (hóa đơn) | P1 · upgrade-roadmap |
| **T1-003** | Auto price calculation nâng cao | P2 |
| **BE-030** | AI Phase 4 GPT re-rank | P2 |
| **REQ-003** | Full RBAC roles/permissions tables | Blocked SA |
| **DEV-28** | Amazon JP PA-API | P1 |

---

## Staging Shell

```bash
php artisan migrate:status
php artisan db:seed --class=BranchSeeder
php artisan products:generate-vi
php artisan products:embed --force
```

## Tests

**59 passed**

---

## Tài khoản test

| Login | Password | Role |
|-------|----------|------|
| `admin` | `Admin@123` | Admin |
| `vn_company01` | `Company@123` | Công ty VN |
| `hn_manager` | `Manager@123` | Branch Manager |
| `hn_staff` | `Staff@123` | Branch Staff |
