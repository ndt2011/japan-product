# Frontend Tasks — Next.js 14

**Dự án**: Hệ thống quản lý hàng hóa Nhật-Việt  
**Cập nhật**: 2026-06-07 | **Assignee**: Frontend Developer  
**Repo**: https://github.com/ndt2011/japan-product (`project/frontend/`)  
**UI reference**: `project/demothietke` — [design-source-demothietke.md](../sa/design-source-demothietke.md)  
**Trạng thái tổng**: Xem [STATUS.md](./STATUS.md)

**Legend**: ✅ Done | 🔄 Partial | ⏸ Blocked | 📋 Todo

---

## SPRINT 0 — UI Shell (demothietke) — Ngoài backlog gốc

| ID | Mô tả | Trạng thái |
|----|-------|------------|
| FE-UI-01 | AppShell + design tokens SupplyFlow | ✅ |
| FE-UI-02 | 12 route dashboard (sidebar navigation) | ✅ |
| FE-UI-03 | Login brand SupplyFlow | ✅ |
| FE-UI-04 | Dashboard, Products, AI, Suppliers, Orders, Admin — UI | 🔄 Products=API · còn lại demo |
| FE-UI-05 | 6 màn placeholder (agents, stock, debts, reports…) | ✅ Chờ docs SA |

---

## SPRINT 1 — Setup & Auth

| ID | Mô tả | P | Dep | Est | Trạng thái |
|----|-------|---|-----|-----|------------|
| FE-001 | Next.js 14 + TS + Tailwind | P0 | — | 1d | ✅ |
| FE-002 | Login: `login_id`, password, Remember Me, httpOnly cookie | P0 | BE-004 | 1d | ✅ |
| FE-003 | Middleware auth redirect | P0 | FE-002 | 0.5d | ✅ |
| FE-004 | Layout sidebar + header; **menu theo role** | P0 | FE-003 | 1.5d | 🔄 Shell ✅ · role ⏸ REQ-003 |
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
| FE-401 | `/shipments` — quản lý batch | P0 | BE-023 | 2.5d | 📋 |
| FE-402 | `/admin/permissions` — matrix toggle | P1 | BE-024 | 2d | ⏸ REQ-003 |

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
