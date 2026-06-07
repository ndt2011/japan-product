# Trạng thái dự án & Việc cần làm tiếp

> **Cập nhật**: 2026-06-08 (amendments triển khai)  
> **Repo**: https://github.com/ndt2011/japan-product  
> **Staging**: https://japan-product.vercel.app · API https://product-production-7e4e.up.railway.app

---

## Tóm tắt nhanh

| Sprint | Mục tiêu | Tiến độ | Ghi chú |
|--------|----------|---------|---------|
| **S1** Auth & RBAC | Login, Remember Me, RBAC UI | **~80%** | UI phân quyền ✅ · full RBAC schema ⏸ |
| **S2** Sản phẩm | CRUD + ảnh multipart | **~95%** | Upload khi tạo SP ✅ |
| **UI shell** | Route + menu theo role | **~95%** | RouteGuard + sidebar ✅ |
| **DevOps** | Railway + Vercel staging | **~85%** | ✅ Login + AI Rakuten OK |
| **S3** AI Search | Luồng A+B | **~95%** | Phase 3+4 chưa |
| **S4** Đơn hàng | CRUD + confirm + email | **~85%** | |
| **S5** Chuyến hàng | Gom đơn + status flow | **~80%** | Auto stock-out khi DELIVERED ✅ |
| **S6** Kho + Báo cáo | warehouse + reports | **~85%** | API + FE ✅ |
| **S7** Chi nhánh | branch-system | **0%** | Chờ SA chính thức |

---

## ✅ Amendments đã triển khai (2026-06-08)

| Amendment | Trạng thái |
|-----------|------------|
| `ai_search-tables.md` | ✅ Đủ |
| `orders-status.md` | ✅ Đủ |
| `shipment-batches-tables.md` | ✅ Đủ + auto stock-out |
| `companies_vn-auth-columns.md` | ✅ Đủ |
| `product_images-table.md` | ✅ Đủ (thiếu file_name/size — không bắt buộc) |
| `rbac-ui-permissions.md` | ✅ FE: menu, RouteGuard, nút theo role |
| `product-image-upload.md` | ✅ multipart create, set-primary, reorder, uploadMany |
| `warehouse-operations.md` | ✅ stock_movements + API + FE |
| `reports-module.md` | ✅ ReportController + ReportsScreen |
| `ai-search-improvement.md` | 🔄 Phase 1+2 ✅ · Phase 3+4 ❌ |
| `rbac-req003.md` | 🔄 2 role + middleware · full schema ⏸ REQ-003 |
| `branch-system.md` | ❌ Chờ SA |

---

## 📋 Việc DEV tiếp theo

| ID | Việc | Priority |
|----|------|----------|
| **OPS-01** | Staging: `migrate` + `products:generate-vi` + `products:embed --force` | P0 |
| **DEV-27** | Railway Pro Static IP hoặc VPS | P1 |
| **DEV-28** | Amazon JP PA-API | P1 |
| **DEV-30** | Cloudflare R2 — `PRODUCT_IMAGE_DISK=r2` | P1 · [hướng dẫn](../devops/r2-cloudflare-setup.md) |
| **BE-030** | Phase 3 hybrid FULLTEXT | P2 |
| **REQ-003** | Full RBAC schema (`rbac-req003.md`) | Blocked |
| **branch-system** | Chi nhánh độc lập | Blocked SA |

---

## Tests

**49 passed** — bao gồm `WarehouseTest` (stock IN, role guard, reports).

---

## Liên kết docs

| File | Nội dung |
|------|----------|
| [rbac-ui-permissions.md](../sa/amendments/rbac-ui-permissions.md) | ✅ Implemented |
| [warehouse-operations.md](../sa/amendments/warehouse-operations.md) | ✅ Implemented |
| [reports-module.md](../sa/amendments/reports-module.md) | ✅ Implemented |
| [product-image-upload.md](../sa/amendments/product-image-upload.md) | ✅ Implemented (R2 prod pending) |
| [rakuten-api-setup.md](../devops/rakuten-api-setup.md) | Rakuten staging |
