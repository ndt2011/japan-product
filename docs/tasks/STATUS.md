# Trạng thái dự án & Việc cần làm tiếp

> **Cập nhật**: 2026-06-07  
> **Repo**: https://github.com/ndt2011/japan-product  
> **Nguồn**: Đối chiếu HANDOFF + code thực tế + `docs/communication/request.md`

---

## Tóm tắt nhanh

| Sprint | Mục tiêu | Tiến độ | Blocker chính |
|--------|----------|---------|---------------|
| **S1** Auth & RBAC | Login, Remember Me, RBAC | **~65%** | REQ-003 (schema RBAC), REQ-007 (M0104 lockout) |
| **S2** Sản phẩm | CRUD + ảnh R2 | **~85%** | R2 bucket staging chưa deploy |
| **UI shell** | 13+ route SupplyFlow | **~85%** | StockIn/Inventory/Debts/Reports demo |
| **DevOps** | CI + Railway + Vercel | **~25%** | CI file có, chưa deploy cloud |
| **S3** AI Search | Luồng A + B semantic search API | **~85%** | Scraper thật · FE luồng B chưa có |
| **S4** Đơn hàng | CRUD + confirm + reserve | **~70%** | Email notify chưa có |
| **S5** Chuyến hàng | Gom đơn + status flow | **~75%** | Email batch notify chưa có |
| **S6–S7** | Chưa bắt đầu | **0%** | REQ-002 |

---

## ✅ Đã xong (code + test)

### Backend (`project/api`)
- Laravel 11 + Sanctum + Repository/Service pattern
- 16+ migrations (admins, products, ai_*, orders, shipment_batches, …)
- Auth: `POST/GET/POST logout` — `login_id` + `remember_me` (24h / 30 ngày)
- Products: CRUD + images + master data
- **AI Search**: luồng A `/ai/search` + duyệt; luồng B `POST /ai/product-search` + `products:embed`
- Orders: CRUD + submit/confirm/cancel + inventory reserve
- Shipments: gom đơn CONFIRMED, status flow đến DELIVERED
- PHPUnit: **37 tests pass** (auth, products, images, AI A+B, orders, shipments, health)

### Frontend (`project/frontend`)
- Next.js 14 + AppShell SupplyFlow (13+ route)
- Login + Remember Me + httpOnly cookie
- API thật: `/products`, `/ai-center`, `/admin/ai-candidates`, `/orders`, `/shipments`
- Demo UI: stock-in, inventory, debts, reports, suppliers
- Build production OK

### DevOps
- `.github/workflows/ci.yml` — test API + build frontend
- Git repo + push `main`

### Docs PM (local, chưa push hết)
- `docs/pm/roadmap.md`, `sprint-planning.md`, `backlog.md`, `milestones.md`

---

## 🔴 Chờ SA/PM (không code được)

| REQ | Nội dung | Ảnh hưởng task |
|-----|----------|----------------|
| **REQ-003** | Schema RBAC: `users`, `roles`, `permissions`… | BE-002, BE-003, BE-007, BE-008, FE-004 menu, FE-005, FE-016 |
| **REQ-007** | Mã lockout: M0103 (success) vs lockout conflict | BE-006, TC-AUTH-006 |
| **REQ-005** | Sheet xlsx chưa sync amendments | `ai_*`, `shipment_*`, `product_images` đã code |
| **REQ-002** | `04_API_Contract.xlsx` chính thức | Có `04_API_Contract.md` đủ module (tạm) |
| **REQ-008** | Đồng bộ `login_id` vs `email` trong tasks/spec | Đã chọn `login_id` — SA cập nhật tasks |

---

## 📋 Việc DEV làm tiếp (không cần chờ SA)

### Ưu tiên P0 — Sprint 1 hoàn thiện phần không blocked

| ID | Việc | Role | Estimate |
|----|------|------|----------|
| ~~DEV-01~~ | `GET /health` endpoint | Backend | ✅ |
| ~~DEV-02~~ | Commit + push | Dev | ✅ (mỗi milestone) |
| ~~DEV-03~~ | Zustand `useAuthStore` + AuthProvider | Frontend | ✅ |
| ~~DEV-04~~ | Middleware `auth_expires_at` + redirect | Frontend | ✅ |
| ~~DEV-05~~ | QA guide Bruno auth tests | QA | ✅ `docs/qa/bruno-auth-collection.md` |
| ~~DEV-06~~ | PHPUnit test logout revoke token | Backend | ✅ |

### Ưu tiên P0 — Sprint 2 (song song khi chờ RBAC)

| ID | Việc | Role | Estimate |
|----|------|------|----------|
| ~~DEV-07~~ | Migration `product_images` + amendment | Backend | ✅ |
| ~~DEV-08~~ | `GET /products` phân trang + filter (API + FE) | Full-stack | ✅ |
| ~~DEV-09~~ | FE `/products/new`, `/products/[id]/edit` | Frontend | ✅ |
| ~~DEV-10~~ | FE `/products/[id]` chi tiết + xóa mềm | Frontend | ✅ |
| ~~DEV-11~~ | Soft delete products (API có sẵn) | Backend | ✅ |
| ~~DEV-19~~ | API `product_images` + upload (public/R2) | Backend | ✅ |
| ~~DEV-20~~ | FE drag-drop upload ảnh sản phẩm | Frontend | ✅ |
| ~~DEV-21~~ | Sprint 3 AI: migrations + API + job + tests | Backend | ✅ |
| ~~DEV-22~~ | FE `/ai-center` + `/admin/ai-candidates` | Frontend | ✅ |
| ~~DEV-23~~ | Sprint 4 Orders API + inventory reserve | Backend | ✅ |
| ~~DEV-24~~ | FE `/orders`, `/orders/new`, `/orders/[id]` | Frontend | ✅ |
| ~~DEV-25~~ | Sprint 5 Shipment batches API + tests | Backend | ✅ |
| ~~DEV-26~~ | FE `/shipments`, `/shipments/new`, `/shipments/[id]` | Frontend | ✅ |

### Ưu tiên P1 — DevOps (sau khi xong S1–S4)

| ID | Việc | Role | Estimate |
|----|------|------|----------|
| **DEV-12** | Railway staging — làm theo `docs/devops/staging-setup.md` | DevOps | 0.5 ngày |
| **DEV-13** | Vercel staging — `vercel.json` + root `project/frontend` | DevOps | 0.5 ngày |
| **DEV-14** | `deploy.yml` — deploy sau CI pass (optional staging) | DevOps | 1 ngày |
| **DEV-15** | GitHub branch protection `main` | DevOps | 0.5h |

### Ưu tiên P2 — UI (chờ docs SA)

| ID | Việc | Ghi chú |
|----|------|---------|
| ~~DEV-16~~ | Port đầy đủ `StockIn`, `Inventory`, `Debts` từ demothietke | ✅ UI demo |
| **DEV-17** | `next-intl` VI/JP (FE i18n HANDOFF §5) | P1 backlog |
| ~~DEV-18~~ | Kết nối `/ai-center` API | Frontend | ✅ |

---

## 📋 Việc SA/PM cần làm

1. **Bổ sung sheet RBAC** vào `03_Thiết_kế_CSDL.xlsx` → unblock Sprint 1 RBAC
2. **Chốt M0104** (hoặc mã khác) cho account lockout → cập nhật `06_Hằng_số_thông_báo.xlsx` + `test-cases.md`
3. **Upload `04_API_Contract.xlsx`** đầy đủ module (AI, Order, Batch)
4. **Sheet `product_images`** + xác nhận R2 bucket config
5. **Đồng bộ** `backend-tasks` BE-004: `login_id` thay `email`
6. **Màn hình SA** cho: `2-101` AI, `3-001` Order, stock modules (hiện dùng demothietke tạm)

---

## Thứ tự đề xuất cho Developer

```
Tuần này (không blocked):
  DEV-02 → DEV-06 → DEV-03 → DEV-08 → DEV-09

Song song DevOps:
  DEV-12 → DEV-13

Khi SA trả lời REQ-003:
  BE-002 → BE-003 → BE-007 → BE-008 → FE-004 (menu theo role)

Khi SA trả lời REQ-007:
  BE-006 (lockout Redis + locked_until)
```

---

## Liên kết tài liệu

| File | Mục đích |
|------|----------|
| [backend-tasks.md](./backend-tasks.md) | Chi tiết task BE + trạng thái |
| [frontend-tasks.md](./frontend-tasks.md) | Chi tiết task FE + trạng thái |
| [qa-tasks.md](./qa-tasks.md) | Chi tiết task QA |
| [devops-tasks.md](./devops-tasks.md) | Chi tiết task DevOps |
| [../communication/request.md](../communication/request.md) | Blockers & yêu cầu SA |
| [../sa/design-source-demothietke.md](../sa/design-source-demothietke.md) | Mapping UI prototype |
| [../sa/AI_Search_Implementation.md](../sa/AI_Search_Implementation.md) | Luồng B embedding (chưa code) |
| [../sa/amendments/ai_search-tables.md](../sa/amendments/ai_search-tables.md) | Schema AI luồng A |
| [../README.md](../README.md) | Mục lục cấu trúc docs |
