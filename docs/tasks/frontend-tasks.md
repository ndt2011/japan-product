# Frontend Tasks — Next.js 14

**Dự án**: Hệ thống quản lý hàng hóa Nhật-Việt  
**Cập nhật**: 2026-06-09 (lần 20) | **Assignee**: Frontend Developer  
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
| FE-P2-007 | Recharts chart tab Lợi nhuận (SP + đơn hàng) | P2 | BE-P2-013 | 0.5d | ✅ |
| FE-408 | `/admin` — all users, search, ma trận quyền, form hints | P0 | BE-008 | 1d | ✅ commit `29fe4e8` |

**Lưu ý FE-P2-004**: `cost_price_jpy` và `selling_price_jpy` render chỉ khi `userType === 'admin'`. Đại lý thấy `unit_price_vnd` (đã bao phí).

**Cập nhật UI-003** (ui-improvements.md): 3 màn hình invoice → FE-P2-001, FE-P2-002, FE-P2-003.

---

## SPRINT AI-P — AI Purchasing Specialist (Frontend)

> Spec đầy đủ: `docs/sa/amendments/ai-purchasing-specialist.md`

| ID | Mô tả | P | Dep | Est | Trạng thái |
|----|-------|---|-----|-----|------------|
| FE-AI-001 | Proxy route `POST /api/proxy/ai/purchasing` + `GET /api/proxy/ai/purchasing/[id]` | P0 | BE-AI-006 | 1h | ✅ |
| FE-AI-002 | `PurchasingScreen.tsx` — form query + gợi ý nhanh + budget/qty inputs + grid kết quả | P0 | FE-AI-001 | 4h | ✅ |
| FE-AI-003 | `ProductCard` trong PurchasingScreen — rank badge, ⭐ khuyến nghị, ảnh, tên VI/JP, giá, ScoreBars | P0 | FE-AI-002 | 3h | ✅ |
| FE-AI-004 | `ScoreBar` component — label + value/10 + color-coded progress bar | P1 | FE-AI-003 | 1h | ✅ |
| FE-AI-005 | AI report section trong PurchasingScreen — hiển thị báo cáo GPT tiếng Việt | P1 | FE-AI-003 | 2h | ✅ |
| FE-AI-006 | Sidebar nav "Tư Vấn Thu Mua" (🛍️) — admin + company, group AI | P0 | FE-AI-002 | 0.5h | ✅ |
| FE-AI-007 | Màn hình lịch sử tìm kiếm `/purchasing/history` | P2 | FE-AI-002 | 2h | ✅ |

**Màn hình chính** (`/purchasing`):
```
┌─ Tư vấn thu mua ────────────────────────────────────────────┐
│ Nhập yêu cầu (tiếng Việt hoặc tiếng Nhật):                  │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Vd: "Tìm vitamin C Nhật, ngân sách 500k/hộp, mua 20 hộp"│ │
│ └──────────────────────────────────────────────────────────┘ │
│ [🔍 Tìm kiếm & So sánh]                                     │
├──────────────────────────────────────────────────────────────┤
│ KẾT QUẢ SO SÁNH                                              │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───┐  │
│ │ #1 ⭐⭐⭐ │ │   #2 ⭐⭐ │ │   #3 ⭐⭐ │ │    #4 ⭐  │ │#5 │  │
│ │ Orihiro  │ │   DHC    │ │  Fancl   │ │ Now Foods│ │...│  │
│ │ ¥1,980   │ │ ¥2,200   │ │ ¥2,500   │ │ ¥3,200   │ │   │  │
│ │ Score:   │ │ Score:   │ │ Score:   │ │ Score:   │ │   │  │
│ │  8.45    │ │  8.10    │ │  7.80    │ │  6.50    │ │   │  │
│ │[Xem link]│ │[Xem link]│ │[Xem link]│ │[Xem link]│ │   │  │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └───┘  │
│ 💡 ĐỀ XUẤT: Orihiro — Lợi nhuận ước tính 15.9%             │
└──────────────────────────────────────────────────────────────┘
```

---

## SPRINT V3 — Giai đoạn 1: Critical

> Spec đầy đủ: `docs/sa/amendments/upgrade-v3-analysis.md`

### V3-G1: Order Flow (#12)

| ID | Mô tả | P | Dep | Est | Trạng thái |
|----|-------|---|-----|-----|------------|
| FE-V3-001 | `OrderDetailScreen` — nút "Duyệt đơn" cho admin (PENDING → APPROVED) | P0 | BE-V3-003 | 2h | ✅ |
| FE-V3-002 | `OrderDetailScreen` — form "Ghi nhận thanh toán" (APPROVED → PAID) | P0 | BE-V3-004 | 3h | ✅ |
| FE-V3-003 | `OrderDetailScreen` — nút "Tracking" + modal nhập tracking URL (PAID → SHIPPING) | P0 | BE-V3-005 | 2h | ✅ |
| FE-V3-004 | `OrderDetailScreen` — nút "Đã giao" cho branch staff (SHIPPING → DELIVERED) | P0 | BE-V3-006 | 1h | ✅ |
| FE-V3-005 | `OrdersScreen` badge màu theo status mới (APPROVED/PAID/SHIPPING) | P0 | FE-V3-001 | 1h | ✅ |
| FE-V3-006 | Proxy routes ORDER: confirm, approve, record-payment, tracking | P0 | — | 1h | ✅ |
| FE-V3-007 | Notification bell badge 🔔 + count trong header | P0 | BE-V3-019 | 2h | ✅ |
| FE-V3-008 | `NotificationDropdown.tsx` — panel dropdown danh sách thông báo | P0 | FE-V3-007 | 3h | ✅ |
| FE-V3-009 | Proxy routes NOTIFY: `/notifications`, `/notifications/count`, mark-read | P0 | FE-V3-008 | 1h | ✅ |
| FE-V3-010 | `InventoryScreen` — hiển thị cột restock_status badge (NORMAL/LOW/CRITICAL/ON_ORDER) | P0 | BE-V3-013 | 2h | ✅ |
| FE-V3-011 | `InventoryScreen` — edit modal: min_stock_qty + restock_status + restock_eta + notes | P0 | BE-V3-014 | 3h | ✅ |
| FE-V3-012 | `InventoryScreen` — xác nhận delete + gọi DELETE /inventories/{id} | P0 | BE-V3-015 | 1h | ✅ |
| FE-V3-013 | `InventoryScreen` — CSV import modal + proxy bulk-import | P0 | BE-V3-017 | 3h | ✅ |
| FE-V3-014 | `InventoryScreen` — hiển thị cột Ngưỡng min_stock_qty | P1 | FE-V3-010 | 0.5h | ✅ |

### V3-G1: Pricing (#9, #10)

| ID | Mô tả | P | Dep | Est | Trạng thái |
|----|-------|---|-----|-----|------------|
| FE-V3-015 | `ProductForm` — thêm field `retail_price_vnd` (giá bán lẻ VND) | P0 | BE-V3-010 | 1h | ✅ |
| FE-V3-016 | `ProductDetailScreen` — hiển thị 3 tầng giá theo role | P0 | BE-V3-012 | 2h | ✅ |

### V3-G2: Dashboard (#1, #2)

| ID | Mô tả | P | Dep | Est | Trạng thái |
|----|-------|---|-----|-----|------------|
| FE-V3-017 | `DashboardScreen` — section tài chính: doanh thu tháng + công nợ + tồn kho thấp | P0 | BE-V3-023 | 3h | ✅ |
| FE-V3-018 | `DashboardScreen` — chart doanh thu 30 ngày (Recharts LineChart) | P1 | BE-V3-024 | 2h | ✅ |
| FE-V3-019 | Proxy routes DASHBOARD: `/dashboard/revenue`, `/dashboard/cashflow` | P0 | FE-V3-017 | 0.5h | ✅ |

### V3-G2: Product UX (#6, #7, #8)

| ID | Mô tả | P | Dep | Est | Trạng thái |
|----|-------|---|-----|-----|------------|
| FE-V3-020 | `ProductsScreen` — thumbnail ảnh trong table/grid | P1 | BE-V3-026 | 2h | ✅ |
| FE-V3-021 | `ProductDetailScreen` — gallery ảnh full (swiper) | P2 | FE-V3-020 | 3h | ✅ |
| FE-V3-022 | `ProductsScreen` — filter vô hiệu hoá (admin/company) | P1 | BE-V3-028 | 2h | ✅ |
| FE-V3-023 | `ProductDetailScreen` — AI thumb suggestion + approve | P2 | BE-V3-027 | 3h | ✅ |
| FE-V3-024 | `ProductsScreen` — branch chỉ xem SP đã duyệt + filter | P0 | BE-V3-002 | 2h | ✅ |

### V3-G2: Master Data + Profile (#11, #13, #14)

| ID | Mô tả | P | Dep | Est | Trạng thái |
|----|-------|---|-----|-----|------------|
| FE-V3-025 | `/admin/master-data` — tab Categories CRUD UI | P1 | BE-V3-030 | 2h | ✅ |
| FE-V3-026 | `/admin/master-data` — tab Warehouses + Suppliers + Units | P1 | — | 2h | ✅ |
| FE-V3-027 | `/profile` — xem + sửa avatar_url, phone, display_name + upload R2 | P1 | BE-V3-031 | 3h | ✅ |

### V3-G3: Enhancement (#3, #4, #5)

| ID | Mô tả | P | Dep | Est | Trạng thái |
|----|-------|---|-----|-----|------------|
| FE-V3-028 | Mobile bottom navigation (breakpoint < 768px) | P2 | — | 2h | ✅ |
| FE-V3-029 | Mobile: Products/Orders table → Card list view | P2 | — | 4h | ✅ |
| FE-V3-030 | AI Chat full-screen mode (modal → `/chat` route) | P2 | — | 2h | ✅ |
| FE-V3-031 | `ChatMessageContent` render Mermaid diagram | P1 | — | 3h | ✅ |
| FE-V3-032 | Exchange rate banner + VND estimator | P1 | BE-V3-025 | 2h | ✅ |
| FE-V3-033 | Inline validation đầy đủ tất cả forms | P2 | — | 4h | ✅ |

---

## Sprint AI-P — AI Purchasing Specialist

| ID | Mô tả | P | Dep | Est | Trạng thái |
|----|-------|---|-----|-----|------------|
| FE-AI-001 | Proxy route `POST /api/proxy/ai/purchasing` | P0 | BE-AI-006 | 1h | ✅ |
| FE-AI-002 | `PurchasingScreen.tsx` — form query + gợi ý nhanh + layout grid | P0 | FE-AI-001 | 4h | ✅ |
| FE-AI-003 | `ProductCard` trong PurchasingScreen — ảnh + tên VI/JP + giá + badge | P0 | FE-AI-002 | 3h | ✅ |
| FE-AI-004 | `ScoreBar` — thanh 5 tiêu chí màu gradient | P1 | FE-AI-003 | 1h | ✅ |
| FE-AI-005 | AI report section trong PurchasingScreen | P1 | FE-AI-002 | 2h | ✅ |
| FE-AI-006 | Sidebar nav "Tư Vấn Thu Mua" (admin + company) | P0 | FE-AI-002 | 0.5h | ✅ |
| FE-AI-007 | Màn hình lịch sử `/purchasing/history` | P2 | FE-AI-002 | 2h | ✅ |
