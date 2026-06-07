# Trạng thái dự án & Việc cần làm tiếp

> **Cập nhật**: 2026-06-08  
> **Repo**: https://github.com/ndt2011/japan-product  
> **Staging**: https://japan-product.vercel.app · API https://product-production-7e4e.up.railway.app

---

## Tóm tắt nhanh

| Sprint | Mục tiêu | Tiến độ | Ghi chú |
|--------|----------|---------|---------|
| **S1** Auth & RBAC | Login, Remember Me, RBAC | **~65%** | REQ-003 RBAC schema |
| **S2** Sản phẩm | CRUD + ảnh | **~85%** | R2 staging chưa deploy |
| **UI shell** | 13+ route SupplyFlow | **~85%** | StockIn/Inventory demo |
| **DevOps** | Railway + Vercel staging | **~80%** | ✅ Login + AI Rakuten OK |
| **S3** AI Search | Luồng A Rakuten + B catalog | **~95%** | Amazon JP chưa có |
| **S4** Đơn hàng | CRUD + confirm + email | **~85%** | Resend production |
| **S5** Chuyến hàng | Gom đơn + status flow | **~75%** | Email batch chưa có |
| **S6–S7** | Chưa bắt đầu | **0%** | REQ-002 |

---

## ✅ Đã xong (gần đây)

### AI Rakuten (2026-06-08)
- `RakutenIchibaSearchService` — Item Search API, ảnh + link thật
- `AiProductEnrichmentService` — GPT enrich (tên VN, category, cách dùng)
- `ProductPricingService` — VND = JPY × tỷ giá × 1.30
- Staging: Railway env + Rakuten IP whitelist → **tìm kiếm OK**
- Timeout fix: job afterResponse, poll 90s, `QUEUE_CONNECTION=sync`
- `GET /api/health?ip=1` — lấy outbound IP cho Rakuten whitelist

### Backend
- PHPUnit: **45 tests** (auth, products, AI, Rakuten, orders, shipments, health)
- Xóa mock catalog / MasterDataSeeder — dữ liệu thật qua API/UI

### DevOps docs
- [rakuten-api-setup.md](../devops/rakuten-api-setup.md) — local + staging đầy đủ
- [ENV_STAGING.md](../devops/ENV_STAGING.md), [STAGING_DEPLOY_MEMO.md](../devops/STAGING_DEPLOY_MEMO.md)

### Frontend
- `/ai-center` — 2 tab (web Rakuten + catalog)
- `/admin/ai-candidates` — duyệt + pricing preview

---

## 🔴 Chờ SA/PM

| REQ | Nội dung |
|-----|----------|
| **REQ-003** | Schema RBAC |
| **REQ-007** | M0104 lockout |
| **REQ-002** | API Contract xlsx chính thức |

---

## 📋 Việc DEV tiếp theo

### P0 — Production ổn định Rakuten IP

| ID | Việc | Ghi chú |
|----|------|---------|
| **DEV-27** | Railway Pro Static IP hoặc VPS ConoHa | Tránh M0206 sau redeploy |
| **DEV-28** | Amazon JP PA-API integration | Chưa có — cần Associate account |

### P1 — DevOps

| ID | Việc | Trạng thái |
|----|------|------------|
| ~~DEV-12~~ | Railway staging | ✅ |
| ~~DEV-13~~ | Vercel staging | ✅ |
| **DEV-14** | Auto-deploy CI | 📋 |
| **DEV-15** | Branch protection | 📋 |

### P1 — UI thật (thay demo)

| ID | Việc |
|----|------|
| **DEV-29** | Inventory / StockIn kết nối API thật |
| **DEV-17** | next-intl VI/JP |

---

## Liên kết

| File | Mục đích |
|------|----------|
| [backend-tasks.md](./backend-tasks.md) | Task BE |
| [devops-tasks.md](./devops-tasks.md) | Task DevOps |
| [../devops/rakuten-api-setup.md](../devops/rakuten-api-setup.md) | Rakuten + IP + quota |
| [../sa/AI_Setup_Guide.md](../sa/AI_Setup_Guide.md) | Cấu hình AI |
| [../devops/ENV_STAGING.md](../devops/ENV_STAGING.md) | Staging tổng hợp |
