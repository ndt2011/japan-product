# Trạng thái dự án & Việc cần làm tiếp

> **Cập nhật**: 2026-06-08 (branch-system Phase 1)  
> **Repo**: https://github.com/ndt2011/japan-product  
> **Staging**: https://japan-product.vercel.app · API https://product-production-7e4e.up.railway.app

---

## Tóm tắt nhanh

| Sprint | Mục tiêu | Tiến độ | Ghi chú |
|--------|----------|---------|---------|
| **S1** Auth & RBAC | Login, Remember Me, RBAC UI | **~90%** | Tạo Admin/Công ty VN tại `/admin` ✅ |
| **S2** Sản phẩm | CRUD + ảnh multipart | **~95%** | Upload khi tạo SP ✅ · R2 staging ✅ |
| **UI shell** | Route + menu theo role | **~95%** | + menu chi nhánh ✅ |
| **DevOps** | Railway + Vercel staging | **~90%** | R2 Railway Bucket configured |
| **S3** AI Search | Luồng A+B | **~95%** | Phase 3+4 chưa |
| **S4** Đơn hàng | CRUD + confirm + email | **~90%** | Branch user tạo đơn ✅ |
| **S5** Chuyến hàng | Gom đơn + status flow | **~80%** | Auto stock-out khi DELIVERED ✅ |
| **S6** Kho + Báo cáo | warehouse + reports | **~85%** | API + FE ✅ |
| **S7** Chi nhánh | branch-system | **~70%** | BE + FE cơ bản ✅ · tab SP theo CN ⏳ |

---

## ✅ Amendments đã triển khai (2026-06-08)

| Amendment | Trạng thái |
|-----------|------------|
| `ai_search-tables.md` | ✅ Đủ |
| `orders-status.md` | ✅ Đủ |
| `shipment-batches-tables.md` | ✅ Đủ + auto stock-out |
| `companies_vn-auth-columns.md` | ✅ Đủ |
| `product_images-table.md` | ✅ Đủ |
| `rbac-ui-permissions.md` | ✅ FE: menu, RouteGuard, nút theo role |
| `product-image-upload.md` | ✅ multipart + R2/Railway Bucket |
| `warehouse-operations.md` | ✅ stock_movements + API + FE |
| `reports-module.md` | ✅ ReportController + ReportsScreen |
| `branch-system.md` | 🔄 BE + FE cơ bản ✅ · product branch-stats tab ⏳ |
| `ai-search-improvement.md` | 🔄 Phase 1+2 ✅ · Phase 3+4 ❌ |
| `rbac-req003.md` | 🔄 2 role + middleware · full schema ⏸ REQ-003 |

---

## 📋 Việc DEV tiếp theo

| ID | Việc | Priority |
|----|------|----------|
| **OPS-01** | Staging Shell: `products:generate-vi` + `products:embed --force` | P0 |
| **OPS-02** | Verify `/api/health` → `product_image_disk: r2`, `r2_configured: true` | P0 |
| **DEV-31** | FE: tab "Theo chi nhánh" trên product detail (branch-stats) | P1 |
| **DEV-27** | Railway Pro Static IP hoặc VPS | P1 |
| **DEV-28** | Amazon JP PA-API | P1 |
| **BE-030** | Phase 3 hybrid FULLTEXT | P2 |
| **REQ-003** | Full RBAC schema (`rbac-req003.md`) | Blocked |

---

## Staging — tài khoản test

| Loại | Login | Password |
|------|-------|----------|
| Admin | `admin` | `Admin@123` |
| Company | `vn_company01` | (seeder) |
| Branch Manager | `hn_manager` | `Manager@123` |
| Branch Staff | `hn_staff` | `Staff@123` |

> Chạy `php artisan db:seed --class=BranchSeeder` trên staging nếu chưa có user chi nhánh.

---

## Tests

**55 passed** — bao gồm `BranchTest` (login, CRUD branch, order filter, user mgmt).

---

## Liên kết docs

| File | Nội dung |
|------|----------|
| [branch-system.md](../sa/amendments/branch-system.md) | 🔄 Phase 1 implemented |
| [r2-cloudflare-setup.md](../devops/r2-cloudflare-setup.md) | R2 + Railway Bucket |
| [AI_Setup_Guide.md](../sa/AI_Setup_Guide.md) | AI + OPS checklist |
