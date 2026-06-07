# Frontend Tasks — Next.js 14

> **Cập nhật**: 2026-06-07 | **Nguồn**: HANDOFF.md + docs/sa/

## Sprint 1 — Setup & Auth

| ID | Mô tả | Priority | Dependency | Estimate | Trạng thái |
|----|-------|----------|------------|----------|------------|
| FE-001 | Khởi tạo Next.js 14 App Router + TypeScript + Tailwind | P0 | — | 2h | ✅ Done |
| FE-002 | Layout dashboard — AppShell theo `demothietke` | P0 | FE-001 | 3h | ✅ Done |
| FE-003 | Màn hình Login — brand SupplyFlow + `1-001` | P0 | BE-003 | 4h | ✅ Done |
| FE-004 | Auth middleware + token httpOnly cookie | P0 | FE-003 | 3h | ✅ Done |
| FE-005 | i18n VI/JP (`next-intl`) | P1 | FE-003 | 4h | 📋 Todo |

## Sprint 2 — Products

| ID | Mô tả | Priority | Dependency | Estimate | Trạng thái |
|----|-------|----------|------------|----------|------------|
| FE-101 | Danh sách sản phẩm — UI demothietke + API | P0 | BE-101 | 6h | ✅ Done |
| FE-102 | Form thêm/sửa sản phẩm (`2-001`) | P0 | BE-101 | 8h | 📋 Todo |
| FE-103 | Tính giá VND gợi ý (JPY × tỷ giá × thuế) | P1 | FE-102 | 2h | 📋 Todo |

## Sprint 3 — UI theo demothietke (prototype)

| ID | Mô tả | Priority | Dependency | Estimate | Trạng thái |
|----|-------|----------|------------|----------|------------|
| FE-201 | AppShell + 12 route + design tokens | P0 | FE-004 | 6h | ✅ Done |
| FE-202 | Dashboard (demo charts) | P1 | FE-201 | 4h | ✅ Done |
| FE-203 | AI Center (demo chat) | P1 | FE-201 | 4h | 🔄 UI demo — chờ 2-101 |
| FE-204 | Suppliers, Orders (demo data) | P1 | FE-201 | 4h | 🔄 UI demo |
| FE-205 | Admin (demo users) | P1 | FE-201 | 3h | 🔄 UI demo — chờ 5-001 |
| FE-206 | Placeholder: agents, stock, debts, reports | P2 | FE-201 | 2h | ✅ Done |
| FE-207 | Menu theo role | P1 | BE-201 | 4h | ⏸ Blocked REQ-003 |

## Cấu trúc thư mục

```
app/
├── (auth)/login/
├── (dashboard)/
│   ├── layout.tsx      ← AppShell
│   ├── dashboard/
│   ├── products/       ← API thật
│   ├── ai-center/
│   ├── suppliers/
│   ├── orders/
│   ├── admin/
│   └── … (placeholder)
└── api/
    ├── auth/
    └── proxy/products/
```
