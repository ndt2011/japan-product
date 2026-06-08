# Trạng thái dự án & Việc cần làm tiếp

> **Cập nhật**: 2026-06-08 (lần 4 — AI Chat Widget + Product Tier + CodeGenerator)  
> **Repo**: https://github.com/ndt2011/japan-product  
> **Staging**: https://japan-product.vercel.app · API https://product-production-7e4e.up.railway.app  
> **Audit**: [code-vs-docs-audit.md](../sa/amendments/code-vs-docs-audit.md) — **~95% khớp**  
> **Server**: [SERVER_CURRENT.md](../devops/SERVER_CURRENT.md)

---

## Tóm tắt nhanh

| Sprint / Phase | Mục tiêu | Tiến độ | Ghi chú |
|----------------|----------|---------|---------|
| **S1** Auth & RBAC | Login, 4 role, user mgmt | **✅ ~98%** | Lockout · Admin all-users |
| **S2** Sản phẩm | CRUD + ảnh R2 + dual pricing | **✅** | Form giá kép Admin ✅ |
| **S3** AI Search | Luồng A+B + hybrid | **✅ ~98%** | GPT re-rank ⏳ P2 |
| **S4–S5** Orders + Shipments | 2-step delivery | **✅ ~95%** | auto-complete ✅ |
| **S6–S7** Kho + Báo cáo | Reports + profit | **✅ ~95%** | Tab Lợi nhuận ✅ |
| **DevOps** | Railway + Vercel staging | **✅** | Auto-deploy `main` |
| **Phase 2** Invoice & Payment | HĐ, công nợ, profit | **✅ ~98%** | by-product ⏳ P2 |

**Tổng MVP + Phase 2**: ~**95%** — staging dùng được thực tế.

---

## Timeline phát triển

| Thời điểm | Mốc | Nội dung |
|-----------|-----|----------|
| 2026-06-07 | Scaffold | Docs, Laravel + Next.js, S1–S5 core |
| 2026-06-08 AM | Invoice | HĐ, dual pricing migration, confirm-receipt |
| 2026-06-08 PM | Admin UX | All-users, ma trận quyền (`29fe4e8`) |
| 2026-06-08 PM | Audit BE | profit API, order_costs, patch invoices |
| 2026-06-08 PM | Phase 2 FE | Form giá kép, tab profit, badge 🔔, DomPDF |

---

## ✅ Phase 2 — Hoàn thành (code + docs khớp)

### Backend

| ID | Nội dung | Code |
|----|----------|------|
| BE-P2-001 | Dual pricing migration | ✅ |
| BE-P2-002 | invoices + invoice_items + patch | ✅ |
| BE-P2-002b | order_costs table + model | ✅ |
| BE-P2-003 | Orders delivery tracking | ✅ |
| BE-P2-004 | createFromOrder fee + snapshot | ✅ |
| BE-P2-005 | Invoice CRUD + send + pay | ✅ |
| BE-P2-006 | DomPDF PDF (`dompdf/dompdf`) | ✅ |
| BE-P2-007 | confirm-receipt (company + branch) | ✅ |
| BE-P2-008 | invoices:check-overdue 9h | ✅ |
| BE-P2-009 | orders:auto-complete 8h | ✅ |
| BE-P2-010 | GET /reports/profit | ✅ |
| BE-P2-011 | ProductResource ẩn cost non-admin | ✅ |
| BE-P2-012 | order_costs API + UI | ✅ |

### Frontend

| ID | Nội dung | Code |
|----|----------|------|
| FE-P2-001 | `/invoices` | ✅ |
| FE-P2-002 | `/invoices/{id}` + PDF | ✅ |
| FE-P2-003 | Nút "Đã nhận hàng" | ✅ |
| FE-P2-004 | Product form dual pricing | ✅ |
| FE-P2-005 | Tab Lợi nhuận `/reports` | ✅ |
| FE-P2-006 | Badge 🔔 header | ✅ |
| — | `/debts`, `/admin` all-users | ✅ |

---

## ✅ Lần 4 — Hoàn thành (2026-06-08)

| Nội dung | File | Ghi chú |
|----------|------|---------|
| Logo TT — chỉ 2 chữ T, xóa text | `frontend/public/logo-tt.svg` | Navy + white T + red T |
| Phân tích 3 tầng sản phẩm | `docs/sa/amendments/product-tier-model.md` | hàng hóa / hàng kho / hàng order |
| CodeGeneratorService | `app/Services/CodeGeneratorService.php` | `JP-FOD-00012`, `ORD-202606-0001` |
| ProductService auto-generate product_cd | `app/Services/ProductService.php` | Tự sinh nếu không nhập |
| OrderRepository dùng format mới | `app/Repositories/OrderRepository.php` | `ORD-YYYYMM-SEQ4` |
| ProductRepository: ảnh + available_qty | `app/Repositories/ProductRepository.php` | Subquery join |
| ProductResource: primary_image_url, available_qty, stock_status | `app/Http/Resources/ProductResource.php` | |
| ProductsScreen: ảnh thumb + stock badge + filter kho | `components/screens/ProductsScreen.tsx` | 🟢🟡🔴 |
| AI Chat proxy routes (3 routes) | `app/api/proxy/ai/chat|conversations|messages` | |
| AI Staff Chat Widget (floating) | `components/layout/AiStaffChatWidget.tsx` | Role-aware prompts |
| AppShell mount widget | `components/layout/AppShell.tsx` | 1 dòng |
| Tailwind slide-up animation | `tailwind.config.ts` | |
| next.config.mjs R2 domain | `next.config.mjs` | Cần điền domain thực |
| Docs widget spec | `docs/sa/amendments/ai-staff-chat-widget.md` | |
| Fix stockIn/stockOut nhập kho | `app/Services/ShipmentBatchService.php` | stockIn khi DELIVERED |
| DashboardService KPIs mới | `app/Services/DashboardService.php` | outstanding_debt, low_stock |
| AI Chat infrastructure (BE) | migrations + models + service + controller | |

---

## 🔄 Còn lại (P2 — không blocking staging)

| ID | Việc | Priority |
|----|------|----------|
| BE-P2-013 | `GET /reports/profit/by-product` | P2 |
| BE-P2-014 | Lưu `invoices.pdf_path` khi generate | P2 |
| FE-P2-007 | Recharts chart tab Lợi nhuận | P2 |
| OPS | Railway: `php artisan migrate` (bao gồm ai_conversations + ai_messages) | **P0 ops** |
| OPS | Railway Secret: set `OPENAI_API_KEY` | **P0 ops** |
| OPS | Vercel: cập nhật domain R2 trong `next.config.mjs` | P1 |
| T1-003 | Auto price calculation | P2 |
| BE-030 | AI GPT re-rank | P2 |
| DEV-28 | Amazon JP PA-API | P1 |
| PROD | ConoHa VPS Go-Live | Sprint 7 |

### Lệch thiết kế (đã chấp nhận)

- **DELIVERED_CLIENT**: Code bỏ qua — flow `DELIVERED_ADMIN` → `COMPLETED` (xem `orders-status.md`)

---

## Tests

```bash
cd project/api && php artisan test
```

**64 passed** · FE build OK (`npm run build`)

---

## Tài khoản test

| Login | Password | Role |
|-------|----------|------|
| `admin` | `Admin@123` | Admin |
| `vn_company01` | `Company@123` | Công ty VN |
| `hn_manager` | `Manager@123` | Branch Manager |
| `hn_staff` | `Staff@123` | Branch Staff |
