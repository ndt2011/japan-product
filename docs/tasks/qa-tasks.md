# QA Tasks

**Dự án**: Hệ thống quản lý hàng hóa Nhật-Việt  
**Cập nhật**: 2026-06-09 (lần 20 — sync PHPUnit 81 + Phase 2 + AI-P history)  
**Assignee**: QA Engineer  
**Trạng thái tổng**: Xem [STATUS.md](./STATUS.md)

**Legend**: ✅ Done | 🔄 Partial (PHPUnit hoặc smoke) | ⏸ Blocked | 📋 Todo (manual/E2E)

---

## PHPUnit tự động (2026-06-09)

```bash
cd project/api && php artisan test   # 81 passed
```

| Module | Test file | Cases | Ghi chú |
|--------|-----------|-------|---------|
| Auth | `AuthTest` | 8 | login, remember, logout |
| RBAC/Branch | `BranchTest`, `SystemUserTest` | 9 | branch orders, user mgmt |
| Products | `ProductTest`, `ProductImageTest` | 5 | CRUD, ảnh |
| AI Search | `AiSearchTest`, `AiProductSearchTest` | 11 | search, approve/reject |
| Orders | `OrderTest` | 8 | draft, reserve, confirm, email |
| Shipments | `ShipmentBatchTest` | 6 | batch, status, RBAC |
| Invoice Phase 2 | `InvoiceTest` | 5 | CRUD, PDF cache |
| Profit Phase 2 | `ProfitReportTest` | 2 | summary + by-product |
| Profile V3 | `ProfileAvatarTest` | 1 | upload avatar |
| Inventory V3 | `SyncRestockStatusTest` | 1 | scheduler thresholds |
| AI Purchasing | `PurchasingHistoryTest` | 3 | history + RBAC session |
| Warehouse | `WarehouseTest` | 3 | stock in, reports |

**Chưa có PHPUnit**: Notifications UI, Dashboard charts, E2E Playwright, Performance, Security scan.

---

## SPRINT 1 — Auth

| ID | Mô tả | P | Est | Trạng thái |
|----|-------|---|-----|------------|
| QA-001 | Test Auth: login, Remember Me, logout, lockout | P0 | 1d | 🔄 `AuthTest` 8 case ✅ · lockout manual 📋 |
| QA-001a | TC-AUTH-004/005 Remember Me TTL | P0 | 2h | 🔄 `AuthTest` assert expiry ✅ · Postman 📋 |
| QA-001b | TC-AUTH-007 logout revoke | P0 | 1h | 🔄 `AuthTest` ✅ |
| QA-001c | TC-AUTH-006 lockout 5 lần | P0 | 2h | ⏸ Cần verify lockout trên staging |
| QA-002 | RBAC: admin/company/branch → 403 | P0 | 1d | 🔄 `BranchTest`, `WarehouseTest`, `SystemUserTest` ✅ · matrix đầy đủ 📋 |

---

## SPRINT 2 — Sản phẩm

| ID | Mô tả | P | Est | Trạng thái |
|----|-------|---|-----|------------|
| QA-003 | CRUD sản phẩm + soft delete | P0 | 1d | 🔄 `ProductTest` create/duplicate ✅ · delete manual 📋 |
| QA-004 | Company/Branch chỉ xem ACTIVE | P0 | 0.5d | 📋 Manual role filter trên `/products` |

---

## SPRINT 3 — AI Search

| ID | Mô tả | P | Est | Trạng thái |
|----|-------|---|-----|------------|
| QA-005 | AI search happy/empty/timeout | P0 | 1d | 🔄 `AiSearchTest`, `AiProductSearchTest` ✅ · timeout 📋 |
| QA-006 | Duyệt/từ chối candidate | P0 | 0.5d | 🔄 `AiSearchTest` approve/reject ✅ |

---

## SPRINT 4 — Đơn hàng

| ID | Mô tả | P | Est | Trạng thái |
|----|-------|---|-----|------------|
| QA-007 | Tạo đơn, vượt tồn, nháp, tạm giữ | P0 | 1.5d | 🔄 `OrderTest` submit/reserve/stock ✅ |
| QA-008 | Lock tỷ giá khi confirm | P0 | 1d | 📋 Manual verify `exchange_rate` trên order |
| QA-009 | Email đơn mới / confirm | P0 | 0.5d | 🔄 `OrderTest` mail history ✅ |

---

## SPRINT 5 — Chuyến hàng

| ID | Mô tả | P | Est | Trạng thái |
|----|-------|---|-----|------------|
| QA-010 | Tạo batch, gom đơn CONFIRMED | P0 | 1d | 🔄 `ShipmentBatchTest` ✅ |
| QA-011 | Status chuyến đúng thứ tự | P0 | 0.5d | 🔄 `ShipmentBatchTest` advance ✅ |

---

## SPRINT Phase 2 — Invoice & Profit

| ID | Mô tả | P | Est | Trạng thái |
|----|-------|---|-----|------------|
| QA-028 | Invoice từ order CONFIRMED + dual pricing snapshot | P0 | 0.5d | 🔄 `InvoiceTest::test_admin_can_create_invoice` ✅ |
| QA-029 | PDF persist + serve cached (RULE-INV-05) | P0 | 0.5d | 🔄 `InvoiceTest::test_pdf_endpoint_persists_path` ✅ |
| QA-030 | GET /reports/profit + by-product | P1 | 0.5d | 🔄 `ProfitReportTest` 2 case ✅ |
| QA-031 | Tab Lợi nhuận FE + Recharts | P1 | 0.5d | 📋 Manual `/reports` sau deploy |
| QA-032 | Công nợ `/debts` + overdue badge | P1 | 0.5d | 📋 Manual staging |
| QA-033 | order_costs API + UI OrderDetail | P1 | 0.5d | 📋 Manual admin thêm chi phí |

Spec: `docs/sa/amendments/invoice-payment.md` checklist QA (TC-INV-001~005, TC-DEL-001).

---

## SPRINT 6 — E2E & Performance

| ID | Mô tả | P | Est | Trạng thái |
|----|-------|---|-----|------------|
| QA-012 | E2E full flow (Playwright) | P0 | 2d | 📋 |
| QA-013 | Performance < 500ms / 10 users | P1 | 1d | 📋 |
| QA-014 | Security: SQLi, XSS, IDOR, JWT | P0 | 1d | 📋 |

---

## SPRINT V3 — V3 + AI Purchasing QA

| ID | Mô tả | P | Est | Trạng thái |
|----|-------|---|-----|------------|
| QA-015 | Notifications: badge, đọc 1, đọc tất cả | P0 | 1d | 📋 Manual staging |
| QA-016 | Notifications: ORDER_NEW toast + triggers | P0 | 1d | 📋 Manual staging |
| QA-017 | Inventory V3: edit/delete + restock badge | P0 | 0.5d | 🔄 `SyncRestockStatusTest` ✅ · UI manual 📋 |
| QA-018 | CSV bulk import happy/error | P0 | 1d | 📋 TC-INV-005~008 manual |
| QA-019 | StockIn autocomplete + nhập kho | P0 | 0.5d | 📋 Manual INV-003 fixed |
| QA-020 | Profile GET/PUT + avatar upload R2 | P0 | 0.5d | 🔄 `ProfileAvatarTest` ✅ · PUT manual 📋 |
| QA-021 | Dashboard revenue/cashflow/KPI | P0 | 1d | 📋 Manual `/dashboard` |
| QA-022 | Order flow V3 full status chain | P0 | 2d | 🔄 `OrderTest` partial ✅ · APPROVED→PAID manual 📋 |
| QA-023 | Kho sync: stockIn DELIVERED, stockOut receipt | P0 | 1d | 📋 Manual |
| QA-024 | AI Purchasing: score weights + sort | P0 | 1d | 📋 Cần `OPENAI_API_KEY` staging |
| QA-025 | AI Purchasing: graceful error thiếu key | P0 | 0.5d | 📋 |
| QA-034 | AI Purchasing history `/purchasing/history` | P1 | 0.5d | 🔄 `PurchasingHistoryTest` 3 case ✅ · FE manual 📋 |
| QA-035 | AI Purchasing throttle 10 req/giờ | P1 | 0.5d | 📋 Request thứ 11 → 429 |
| QA-026 | Mobile: bottom nav, card list | P1 | 1d | 📋 |
| QA-027 | Form validation 14 form screens | P1 | 1d | 📋 Spot-check sau deploy |

---

## Môi trường test

| Môi trường | URL | Trạng thái |
|------------|-----|------------|
| Local API | `http://localhost:8000/api` | ✅ |
| Local FE | `http://localhost:3000` | ✅ |
| Railway staging API | `https://product-production-7e4e.up.railway.app/api` | ✅ auto-deploy `main` |
| Vercel staging FE | `https://japan-product.vercel.app` | ✅ |

**Tài liệu**: `docs/qa/test-cases.md` · `docs/qa/acceptance-criteria.md` · `docs/sa/qa/QA_Orders_Batch.md`

### Test accounts

| Login | Password | Role | Dùng để test |
|-------|----------|------|--------------|
| `admin` | `Admin@123` | Admin | AI Purchasing, Dashboard, Invoice, Profit |
| `vn_company01` | `Company@123` | JP Agency | Order, batch, AI Purchasing |
| `hn_manager` | `Manager@123` | Branch Manager | Notifications, profile |
| `hn_staff` | `Staff@123` | Branch Staff | Tạo đơn, confirm receipt |

---

## Bug Report Format

```
Title: [Module][Severity] Mô tả ngắn
Severity: Critical / High / Medium / Low
Steps to reproduce:
  1. ...
Expected: ...
Actual: ...
Environment: Railway Staging / Local
Screenshot/Video: [đính kèm]
```
