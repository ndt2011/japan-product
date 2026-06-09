# Trạng thái dự án & Việc cần làm tiếp

> **Cập nhật**: 2026-06-09 (lần 20 — pushed `4e31a76` → staging auto-deploy)  
> **Repo**: https://github.com/ndt2011/japan-product  
> **Staging**: https://japan-product.vercel.app · API https://product-production-7e4e.up.railway.app  
> **Audit**: [code-vs-docs-audit.md](../sa/amendments/code-vs-docs-audit.md) — **~99% khớp** (V3 + AI-P 100%)  
> **Server**: [SERVER_CURRENT.md](../devops/SERVER_CURRENT.md)

---

## Tóm tắt nhanh

| Sprint / Phase | Mục tiêu | Tiến độ | Ghi chú |
|----------------|----------|---------|---------|
| **S1** Auth & RBAC | Login, 4 role, user mgmt | **✅ ~98%** | Lockout · Admin all-users |
| **S2** Sản phẩm | CRUD + ảnh R2 + dual pricing | **✅** | Form giá kép Admin ✅ |
| **S3** AI Search | Luồng A+B + hybrid + dạy VN | **✅ ~99%** | GPT re-rank ⏳ P2 · OPS embed staging |
| **S4–S5** Orders + Shipments | 2-step delivery | **✅ ~95%** | auto-complete ✅ |
| **S6–S7** Kho + Báo cáo | Reports + profit | **✅ ~95%** | Tab Lợi nhuận ✅ |
| **DevOps** | Railway + Vercel staging | **✅** | Auto-deploy `main` |
| **Phase 2** Invoice & Payment | HĐ, công nợ, profit | **✅ 100%** | BE-P2-013~014 · FE-P2-007 ✅ |
| **V3 Upgrade** | Order flow, notify, dashboard, profile | **✅ 100%** | BE-V3-029 Form Requests ✅ |
| **AI Purchasing** | BE service + FE screen + history | **✅ 100%** | BE-AI-007 throttle · `/purchasing/history` |

**Tổng MVP + Phase 2 + V3 + AI-P core**: ~**98%** — migrate `100120` (purchasing_sessions) qua `start.sh`.

---

## Timeline phát triển

| Thời điểm | Mốc | Nội dung |
|-----------|-----|----------|
| 2026-06-07 | Scaffold | Docs, Laravel + Next.js, S1–S5 core |
| 2026-06-08 AM | Invoice | HĐ, dual pricing migration, confirm-receipt |
| 2026-06-08 PM | Admin UX | All-users, ma trận quyền (`29fe4e8`) |
| 2026-06-08 PM | Audit BE | profit API, order_costs, patch invoices |
| 2026-06-08 PM | Phase 2 FE | Form giá kép, tab profit, badge 🔔, DomPDF |
| 2026-06-08 PM | V3 local | Order APPROVED→PAID→SHIPPING, notifications, dashboard revenue |
| 2026-06-08 PM | Docs sync | `backend-tasks` / `frontend-tasks` tick ✅⚠️📋 |
| 2026-06-08 PM | FE-V3-013 | CSV import modal InventoryScreen + proxy bulkImport |
| 2026-06-08 PM | AI-P FE | `PurchasingScreen` + `ProductCard` + `ScoreBar` + nav item |
| 2026-06-08 PM | FE-V3-024 | Branch xem products đã duyệt + filter disabled |
| 2026-06-08 PM | FE-V3-033 | `form-validation.ts` + inline errors 14 form screens |
| 2026-06-08 PM | Docs G2–G3 | Sync STATUS · backend-tasks · backlog · audit |
| 2026-06-08 PM | Deploy `main` | V3 release `865d3df` · dashboard/toast `dd91b36` |
| 2026-06-08 PM | Fix invoice UI | `product_name_jp` / `line_total_vnd` — `10ff141` |
| 2026-06-08 PM | Redis staging | `REDIS_URL` + health `redis_configured` — `09ad433` |

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
| BE-P2-013 | `GET /reports/profit/by-product` | ✅ |
| BE-P2-014 | `invoices.pdf_path` persist + serve cached (RULE-INV-05) | ✅ |

### Frontend

| ID | Nội dung | Code |
|----|----------|------|
| FE-P2-001 | `/invoices` | ✅ |
| FE-P2-002 | `/invoices/{id}` + PDF | ✅ |
| FE-P2-003 | Nút "Đã nhận hàng" | ✅ |
| FE-P2-004 | Product form dual pricing | ✅ |
| FE-P2-005 | Tab Lợi nhuận `/reports` | ✅ |
| FE-P2-006 | Badge 🔔 header | ✅ |
| FE-P2-007 | Recharts profit chart (SP + đơn) | ✅ |
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

## ✅ Lần 5 — Hoàn thành (2026-06-08)

| Nội dung | File | Ghi chú |
|----------|------|---------|
| Inventory Known Issues doc | `docs/sa/amendments/inventory-known-issues.md` | INV-001 warehouseId · INV-002 pre-order |

---

## ✅ Lần 6 — Hoàn thành (2026-06-08)

| Nội dung | File | Ghi chú |
|----------|------|---------|
| Quy trình dạy AI catalog (Luồng B) | `docs/sa/amendments/ai-catalog-teaching-process.md` | generate-vi → embed → few-shot query |
| WF-01b workflow BA | `docs/ba/workflow.md` | Sơ đồ Admin → User |
| QueryExpansion few-shot | `QueryExpansionService.php` + FE gợi ý catalog | Commit `2f9f11f` |
| System Overview Luồng B | `docs/sa/00_System_Overview.md` | Đánh dấu ✅ đã code |

**OPS còn lại:** Railway Shell `products:generate-vi` + `products:embed --force` trên staging.

---

## ✅ V3 Giai đoạn 1 — Critical (pushed `main`)

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| BE-V3-001~009 | Order flow + shipment tracking API | ✅ |
| BE-V3-010~012 | Pricing 3 tầng + `retail_price_vnd` | ✅ |
| BE-V3-013~016 | Inventory migration + update/delete API | ✅ |
| BE-V3-019~022 | Notifications table + service + triggers | ✅ |
| FE-V3-001~006 | Duyệt đơn, thanh toán, tracking, badges, proxy | ✅ |
| FE-V3-010,014 | Inventory list + restock badge | ✅ |
| FE-V3-015,016 | Product form/detail pricing branch | ✅ |

**G1 hoàn thành:** BE-V3-018 scheduler `inventories:sync-restock-status` 7h JST

---

## ✅ V3 Giai đoạn 2 — Important (G2, pushed `main`)

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| BE-V3-023~025 | `/dashboard/revenue`, `/cashflow`, phân quyền role | ✅ |
| BE-V3-026, 028 | `barcode`, `min_order_qty`, AI `image_url` | ✅ |
| BE-V3-027 | `ProductResource.created_by_name` | ✅ |
| BE-V3-030 | Categories CRUD + warehouses + **suppliers CRUD** | ✅ |
| BE-V3-031 | Profile migration `avatar_url`, `phone` | ✅ `100110` |
| BE-V3-032 | GET/PUT `/profile` + `POST /profile/avatar` R2 | ✅ |
| BE-V3-029 | Form Requests toàn bộ controllers chính | ✅ |
| FE-V3-017~019 | Dashboard tài chính + chart + proxy | ✅ |
| FE-V3-020~024 | Product thumb, gallery, filter, AI thumb, branch filter | ✅ |
| FE-V3-025~026 | `/admin/master-data` 4 tab (categories, warehouses, suppliers CRUD, units) | ✅ |
| FE-V3-027 | `/profile` — sửa tên, email, phone, avatar URL | ✅ |
| FE-V3-032 | Tỷ giá JPY/VND trên Dashboard + estimator ProductForm | ✅ |

**G2 hoàn thành** — Form Requests: Branch, Warehouse, OrderCost, Category, BranchUser, Stock, Shipment tracking, Inventory, AI Purchasing.

---

## ✅ V3 Giai đoạn 3 — Enhancement (G3, pushed `main`)

| ID | Nội dung | Trạng thái |
|----|----------|------------|
| FE-V3-028 | Mobile bottom navigation | ✅ |
| FE-V3-029 | Products/Orders card list mobile | ✅ |
| FE-V3-030 | AI Chat full-screen | ✅ |
| FE-V3-031 | Mermaid trong chat | ✅ |
| FE-V3-033 | Inline validation tất cả forms (`lib/form-validation.ts`) | ✅ |
| FE-V3-007~009 | Notification dropdown + badge | ✅ |
| FE-V3-011~014 | Inventory edit/delete/CSV import | ✅ |

**G3 hoàn thành** — không còn task FE blocking.

**Migrations:** `100100_v3_upgrade_phase1` · `100110_v3_profile_fields`

**OPS staging:** Railway Variables `REDIS_URL=${{Redis.REDIS_URL}}` · health `?redis=1` · smoke `/api/notifications/count`, `/api/profile`, `/invoices/{id}`

Chi tiết từng task: [backend-tasks.md](./backend-tasks.md) · [frontend-tasks.md](./frontend-tasks.md) · [qa-tasks.md](./qa-tasks.md) · [devops-tasks.md](./devops-tasks.md) · [upgrade-v3-analysis.md](../sa/amendments/upgrade-v3-analysis.md)

---

## 🔄 Còn lại (không blocking staging)

| ID | Việc | Priority |
|----|------|----------|
| INV-002 | Pre-order support (khi BA yêu cầu) | P3 — xem `inventory-known-issues.md` |
| **V3-G1** | Order + Notify + Pricing + Inventory core | **✅ 100%** |
| **V3-G2** | Dashboard + Product + Master + Profile | **✅ 100%** |
| **V3-G3** | Mobile + Mermaid + validation | **✅ 100%** |
| **AI-P** | Purchasing + history + throttle | **✅ 100%** |
| OPS | Railway `REDIS_URL` trên service product + redeploy | **P0 ops** |
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

**81 passed** · FE build OK (`npm run build`)

---

## Tài khoản test

| Login | Password | Role |
|-------|----------|------|
| `admin` | `Admin@123` | Admin |
| `vn_company01` | `Company@123` | Công ty VN |
| `hn_manager` | `Manager@123` | Branch Manager |
| `hn_staff` | `Staff@123` | Branch Staff |
