# Trạng thái dự án & Việc cần làm tiếp

> **Cập nhật**: 2026-06-08 (Phase 2: Invoice + Dual Pricing + 2-step Delivery)  
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
| **Hóa đơn** | `/invoices` + `/debts` | **✅** | T1-001 Invoice & Payment |

---

## ✅ Đã hoàn thành (MVP)

- Auth 4 role + RoleMiddleware + RouteGuard
- Tạo user: Admin, Công ty VN (`/admin`), Chi nhánh (`/admin/branches`)
- Kho, báo cáo, R2 ảnh, branch-system Phase 1
- Dashboard analytics API + FE
- AI catalog hybrid search (semantic + keyword)
- Login lockout (Cache/Redis, M0106)
- `/agents` — danh sách đại lý (công ty VN)
- Invoice & Payment — API + FE `/invoices`, công nợ `/debts`, lập HĐ từ đơn CONFIRMED+

---

## 🚀 PHASE 2 — Đang triển khai

> Spec: `docs/sa/amendments/invoice-payment.md` (2026-06-08)

| ID | Việc | Priority | Trạng thái |
|----|------|----------|------------|
| **BE-P2-001~003** | Migration: products (giá kép) + invoices + orders tracking | P0 | ✅ |
| **BE-P2-004~006** | InvoiceService + Controller + HTML printable | P0 | ✅ (DomPDF ⏳) |
| **BE-P2-007** | `PUT /orders/{id}/confirm-receipt` | P0 | ✅ |
| **BE-P2-008** | Scheduler `invoices:check-overdue` 9h | P0 | ✅ |
| **BE-P2-009** | Auto-complete sau 7 ngày DELIVERED_ADMIN | P0 | ⏳ |
| **BE-P2-010** | `GET /reports/profit` | P1 | ⏳ |
| **FE-P2-001~002** | `/invoices` + chi tiết | P0 | ✅ |
| **FE-P2-003** | Nút "Đã nhận hàng" (đại lý) | P0 | ✅ |
| **FE-P2-004** | Product form — thêm cost_price_jpy, selling_price_jpy, fee_rate | P0 | 📋 Chờ dev |
| **FE-P2-005** | `/reports/profit` — biểu đồ + bảng lãi/lỗ | P1 | 📋 Chờ dev |

---

## 📋 Còn lại (sau Phase 2)

| ID | Việc | Priority |
|----|------|----------|
| **OPS-01** | Railway: `BranchSeeder` + `products:generate-vi` + `products:embed --force` | P0 |
| **T1-003** | Auto price calculation (markup_rate tự động) | P2 |
| **BE-030** | AI Phase 4 GPT re-rank | P2 |
| **DEV-28** | Amazon JP PA-API | P1 |
| **T2-001** | Notification system (in-app) | P2 |
| **T2-004** | Audit Log (Observer) | P2 |

---

## Staging Shell

```bash
php artisan migrate:status
php artisan db:seed --class=BranchSeeder
php artisan products:generate-vi
php artisan products:embed --force
```

## Tests

**64 passed**

---

## Tài khoản test

| Login | Password | Role |
|-------|----------|------|
| `admin` | `Admin@123` | Admin |
| `vn_company01` | `Company@123` | Công ty VN |
| `hn_manager` | `Manager@123` | Branch Manager |
| `hn_staff` | `Staff@123` | Branch Staff |
