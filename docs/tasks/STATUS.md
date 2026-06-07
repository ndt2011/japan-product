# Trạng thái dự án & Việc cần làm tiếp

> **Cập nhật**: 2026-06-08 (user mgmt + branch-stats tab)  
> **Repo**: https://github.com/ndt2011/japan-product  
> **Staging**: https://japan-product.vercel.app · API https://product-production-7e4e.up.railway.app  
> **Commit mới nhất**: `08655f7` + docs/code update tiếp theo

---

## Tóm tắt nhanh

| Sprint | Mục tiêu | Tiến độ | Ghi chú |
|--------|----------|---------|---------|
| **S1** Auth & RBAC | Login, Remember Me, RBAC UI | **~92%** | `/admin` tạo Admin + Công ty VN ✅ |
| **S2** Sản phẩm | CRUD + ảnh multipart | **~98%** | Tab "Theo chi nhánh" trên SP detail ✅ |
| **UI shell** | Route + menu theo role | **~95%** | 4 role: admin/company/branch_* |
| **DevOps** | Railway + Vercel staging | **~90%** | R2 Railway Bucket ✅ |
| **S3** AI Search | Luồng A+B | **~95%** | Phase 3+4 chưa |
| **S4** Đơn hàng | CRUD + confirm + email | **~90%** | Branch user tạo đơn ✅ |
| **S5** Chuyến hàng | Gom đơn + status flow | **~80%** | Auto stock-out DELIVERED ✅ |
| **S6** Kho + Báo cáo | warehouse + reports | **~85%** | API + FE ✅ |
| **S7** Chi nhánh | branch-system | **~85%** | Phase 1 hoàn chỉnh ✅ |

---

## ✅ Amendments đã triển khai

| Amendment | Trạng thái |
|-----------|------------|
| `ai_search-tables.md` | ✅ |
| `orders-status.md` | ✅ |
| `shipment-batches-tables.md` | ✅ + auto stock-out |
| `companies_vn-auth-columns.md` | ✅ |
| `product_images-table.md` | ✅ |
| `rbac-ui-permissions.md` | ✅ menu, RouteGuard, nút theo role |
| `product-image-upload.md` | ✅ multipart + R2 |
| `warehouse-operations.md` | ✅ |
| `reports-module.md` | ✅ |
| `branch-system.md` | ✅ Phase 1 (BE + FE + branch-stats tab) |
| `ai-search-improvement.md` | 🔄 Phase 1+2 ✅ · Phase 3+4 ❌ |
| `rbac-req003.md` | 🔄 RoleMiddleware 4 role · full schema ⏸ REQ-003 |

---

## Quản lý user — hiện có

| Loại | Tạo qua UI | Route |
|------|------------|-------|
| **Admin** | ✅ | `/admin` → tab Admin (JP) |
| **Công ty VN** (đại lý B2B) | ✅ | `/admin` → tab Công ty VN |
| **Branch manager/staff** | ✅ | `/admin/branches` → Nhân viên |
| **Đại lý** (`/agents`) | ❌ | Placeholder — dùng Công ty VN |

API: `POST /admin-users`, `POST /company-users`, `POST /branches/{id}/users`

---

## 📋 Việc tiếp theo

| ID | Việc | Priority |
|----|------|----------|
| **OPS-01** | Railway Shell: `BranchSeeder` + `products:generate-vi` + `products:embed --force` | P0 |
| **OPS-02** | Verify health `r2_configured`, login 4 role trên staging | P0 |
| **DEV-27** | Railway Pro Static IP | P1 |
| **DEV-28** | Amazon JP PA-API | P1 |
| **BE-030** | AI Phase 3 hybrid FULLTEXT | P2 |
| **REQ-003** | Full RBAC schema (roles/permissions tables) | Blocked |

---

## Staging — tài khoản test

| Loại | Login | Password |
|------|-------|----------|
| Admin | `admin` | `Admin@123` |
| Công ty VN | `vn_company01` | `Company@123` |
| Branch Manager | `hn_manager` | `Manager@123` |
| Branch Staff | `hn_staff` | `Staff@123` |

### Railway Shell (sau deploy)

```bash
php artisan migrate:status
php artisan db:seed --class=BranchSeeder
php artisan products:generate-vi
php artisan products:embed --force
```

### Test nhanh trên UI

1. `/admin` → tạo Công ty VN mới → login thử
2. `/admin/branches` → tạo chi nhánh + nhân viên
3. `/products/{id}` → tab **Theo chi nhánh** (admin)
4. Login `hn_manager` → tạo đơn → chỉ thấy đơn CN

---

## Tests

**58 passed** — `BranchTest`, `SystemUserTest`, `WarehouseTest`, …

---

## Liên kết docs

| File | Nội dung |
|------|----------|
| [branch-system.md](../sa/amendments/branch-system.md) | ✅ Phase 1 |
| [staging-setup.md](../devops/staging-setup.md) | OPS checklist |
| [AI_Setup_Guide.md](../sa/AI_Setup_Guide.md) | AI + embed |
| [backend-tasks.md](./backend-tasks.md) | BE task status |
| [frontend-tasks.md](./frontend-tasks.md) | FE task status |
