# Frontend Tasks — Next.js 14

**Dự án**: Hệ thống quản lý hàng hóa Nhật-Việt  
**Cập nhật**: 2026-06-08 | **Assignee**: Frontend Developer  
**Repo**: https://github.com/ndt2011/japan-product (`project/frontend/`)  
**UI reference**: `project/demothietke` — [design-source-demothietke.md](../sa/design-source-demothietke.md)  
**Trạng thái tổng**: Xem [STATUS.md](./STATUS.md)

**Legend**: ✅ Done | 🔄 Partial | ⏸ Blocked | 📋 Todo

---

## SPRINT 0 — UI Shell (demothietke) — Ngoài backlog gốc

| ID | Mô tả | Trạng thái |
|----|-------|------------|
| FE-UI-01 | AppShell + design tokens SupplyFlow | ✅ |
| FE-UI-02 | 13+ route dashboard (sidebar navigation) | ✅ |
| FE-UI-03 | Login brand SupplyFlow | ✅ |
| FE-UI-04 | Products, AI, Orders, Shipments — API · còn lại demo | 🔄 |
| FE-UI-05 | 6 màn placeholder (agents, stock, debts, reports…) | ✅ Chờ docs SA |

---

## SPRINT 1 — Setup & Auth

| ID | Mô tả | P | Dep | Est | Trạng thái |
|----|-------|---|-----|-----|------------|
| FE-001 | Next.js 14 + TS + Tailwind | P0 | — | 1d | ✅ |
| FE-002 | Login: `login_id`, password, Remember Me, httpOnly cookie | P0 | BE-004 | 1d | ✅ |
| FE-003 | Middleware auth redirect | P0 | FE-002 | 0.5d | ✅ |
| FE-004 | Layout sidebar + header; **menu theo role** | P0 | FE-003 | 1.5d | ✅ via `rbac-ui-permissions.md` + RouteGuard |
| FE-005 | Zustand `useAuthStore` + AuthProvider | P0 | FE-002 | 0.5d | ✅ |
| FE-006 | Vercel deployment | P0 | — | 0.5d | 📋 DEV-13 |

---

## SPRINT 2 — Sản phẩm

| ID | Mô tả | P | Dep | Est | Trạng thái |
|----|-------|---|-----|-----|------------|
| FE-101 | `/products` — list, search, filter, pagination | P0 | BE-011 | 1.5d | ✅ |
| FE-102 | `/products/new`, `/products/[id]/edit` — form `2-001` | P0 | BE-011 | 2d | ✅ |
| FE-103 | `/products/[id]` — chi tiết + xóa mềm | P0 | FE-101 | 1d | ✅ |
| FE-104 | Upload ảnh drag & drop | P0 | BE-010 | 1d | ✅ |

---

## SPRINT 3 — AI Search

| ID | Mô tả | P | Dep | Est | Trạng thái |
|----|-------|---|-----|-----|------------|
| FE-201 | `/ai-center` — chat UI + polling API | P0 | BE-016 | 2.5d | ✅ |
| FE-202 | Card kết quả + chọn + gửi duyệt | P0 | FE-201 | 1d | ✅ |
| FE-203 | `/admin/ai-candidates` — duyệt/từ chối | P0 | BE-016 | 2d | ✅ |
| FE-204 | Tab catalog nội bộ trên `/ai-center` + BFF | P1 | BE-016b | 1d | ✅ |

---

## SPRINT 4 — Đơn hàng

| ID | Mô tả | P | Dep | Est | Trạng thái |
|----|-------|---|-----|-----|------------|
| FE-301 | `/orders/new` — tạo đơn + tỷ giá real-time | P0 | BE-019 | 2.5d | ✅ |
| FE-302 | `/orders` — list filter (thay demo data) | P0 | BE-019 | 1.5d | ✅ |
| FE-303 | `/orders/[id]` — chi tiết + confirm/cancel | P0 | FE-302 | 1.5d | ✅ |

---

## SPRINT 5 — Chuyến hàng & Permission

| ID | Mô tả | P | Dep | Est | Trạng thái |
|----|-------|---|-----|-----|------------|
| FE-401 | `/shipments` — quản lý batch | P0 | BE-023 | 2.5d | ✅ |
| FE-402 | `/admin/permissions` — matrix toggle | P3 | BE-024 | 2d | 📋 Future — không cần cho MVP |
| FE-403 | `/admin` — tạo Admin + Công ty VN | P0 | BE-008 | 1.5d | ✅ |
| FE-404 | `/admin/branches` + `/my-branch` | P0 | branch-system | 2d | ✅ |
| FE-405 | `/products/{id}` tab Theo chi nhánh | P1 | branch-stats API | 0.5d | ✅ |
| FE-406 | Dashboard stats từ `/dashboard/stats` | P0 | Dashboard API | 1d | ✅ |
| FE-407 | `/agents` — list đại lý (company-users) | P1 | BE-008 | 0.5d | ✅ |

---

---

## PHASE 2 — Invoice, Dual Pricing & Delivery (2026-06-08)

> Spec đầy đủ: `docs/sa/amendments/invoice-payment.md`

| ID | Mô tả | P | Dep | Est | Trạng thái |
|----|-------|---|-----|-----|------------|
| FE-P2-001 | `/invoices` — danh sách, filter status/date, badge overdue | P0 | BE-P2-005 | 1.5d | ✅ |
| FE-P2-002 | `/invoices/{id}` — chi tiết + gửi HĐ + ghi nhận TT + HTML preview | P0 | BE-P2-005 | 2d | ✅ |
| FE-P2-003 | `/orders/{id}` — nút **"Đã nhận hàng"** khi `DELIVERED_ADMIN` | P0 | BE-P2-007 | 0.5d | ✅ |
| FE-P2-004 | Product form Admin: dual pricing + preview VND | P0 | BE-P2-001 | 1d | ✅ |
| FE-P2-005 | Tab Lợi nhuận `/reports` + filter date | P1 | BE-P2-010 | 1.5d | ✅ |
| FE-P2-006 | Badge 🔔 header (overdue + DELIVERED_ADMIN) | P1 | BE-P2-008 | 0.5d | ✅ |
| FE-408 | `/admin` — all users, search, ma trận quyền, form hints | P0 | BE-008 | 1d | ✅ commit `29fe4e8` |

**Lưu ý FE-P2-004**: `cost_price_jpy` và `selling_price_jpy` render chỉ khi `userType === 'admin'`. Đại lý thấy `unit_price_vnd` (đã bao phí).

**Cập nhật UI-003** (ui-improvements.md): 3 màn hình invoice → FE-P2-001, FE-P2-002, FE-P2-003.

---

## Backlog P1

| ID | Mô tả | Trạng thái |
|----|-------|------------|
| FE-i18n | `next-intl` VI/JP | 📋 |
| FE-toast | Toast notification action | 📋 |
| FE-skeleton | Loading skeleton thay spinner | 📋 |

---

## Coding Standards

- TypeScript strict · `/components/ui` vs `/components/screens`
- httpOnly cookie only — **không localStorage**
- Custom hooks: `useProducts`, `useOrders`…
- i18n keys: `/messages/vi.json`, `/messages/ja.json`
