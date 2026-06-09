# Sprint Planning — Phase 1

**Dự án**: Hệ thống quản lý hàng hóa Nhật-Việt  
**Phiên bản**: 1.1 | **Ngày**: 2026-06-08  
**Sprint length**: 2 tuần | **Velocity**: ~20 points/sprint

> **Trạng thái tổng**: [docs/tasks/STATUS.md](../tasks/STATUS.md)

---

## Sprint 1 — Auth & RBAC (2026-06-15 → 2026-06-28)

**Goal**: User có thể đăng nhập, phân quyền hoạt động đúng theo role  
**Tiến độ 2026-06-08**: **✅ ~98%**

| ID | Story | Points | Assignee | Trạng thái |
|----|-------|--------|----------|------------|
| US-101 | Đăng nhập | 3 | Backend + Frontend | ✅ |
| US-102 | Lưu đăng nhập (Remember Me) | 2 | Backend + Frontend | ✅ |
| US-103 | Đăng xuất | 1 | Backend + Frontend | ✅ |
| US-501 | Quản lý người dùng (CRUD) | 4 | Backend + Frontend | ✅ 3-model RBAC |
| — | Lockout 5 lần / 30 phút | 2 | Backend | ✅ |
| — | Setup project Laravel + Next.js | 3 | Backend + Frontend | ✅ |
| — | UI shell + menu theo role | 3 | Frontend | ✅ |
| — | `/admin` all-users + ma trận quyền | 3 | Frontend | ✅ `29fe4e8` |
| — | GitHub CI (test + build) | 2 | DevOps | ✅ |
| — | Railway + Vercel staging | 2 | DevOps | ✅ |

**Definition of Done**: ✅ Đạt — login staging, 4 role, tạo user trên `/admin`

---

## Sprint 2 — Quản lý sản phẩm (2026-06-29 → 2026-07-12)

**Goal**: JP Agency có thể thêm/sửa sản phẩm, VN Branch xem catalog

| ID | Story | Points | Assignee |
|----|-------|--------|----------|
| US-203 | CRUD sản phẩm + upload ảnh | 5 | Backend + Frontend |
| US-204 | VN Branch xem catalog | 3 | Frontend |
| — | DB: product_categories, products, product_images, suppliers_jp | 3 | Backend |
| — | Cloudflare R2 / AWS S3 upload ảnh | 3 | Backend |
| — | API: GET products, POST product, PUT product, DELETE product | 3 | Backend |
| — | Màn hình: danh sách, tạo, chi tiết sản phẩm | 4 | Frontend |

**Total**: 21 points  
**Definition of Done**: JP Agency tạo được sản phẩm có ảnh, VN Branch xem được catalog

---

## Sprint 3 — AI Search (2026-07-13 → 2026-07-26)

**Goal**: VN Branch tìm sản phẩm bằng AI, JP Agency duyệt

| ID | Story | Points | Assignee |
|----|-------|--------|----------|
| US-201 | AI tìm kiếm sản phẩm | 8 | Backend |
| US-202 | JP Agency duyệt sản phẩm AI | 5 | Backend + Frontend |
| — | DB: ai_product_candidates, ai_search_sessions | 2 | Backend |
| — | Queue worker cho AI search job | 2 | Backend |
| — | Màn hình chat-style AI search | 4 | Frontend |

**Total**: 21 points  
**Definition of Done**: AI tìm được sản phẩm từ Rakuten, admin duyệt thành sản phẩm thật

---

## Sprint 4 — Đơn hàng (2026-07-27 → 2026-08-09)

**Goal**: VN Branch đặt hàng, JP Agency xác nhận

| ID | Story | Points | Assignee |
|----|-------|--------|----------|
| US-301 | Tạo và gửi đơn hàng | 5 | Backend + Frontend |
| US-302 | JP Agency xác nhận đơn | 4 | Backend + Frontend |
| US-303 | Theo dõi trạng thái đơn | 2 | Frontend |
| — | DB: orders, order_details | 2 | Backend |
| — | Tỷ giá: DB exchange_rates + API cập nhật | 3 | Backend |
| — | Email notification (đơn mới, đơn confirm) | 3 | Backend |

**Total**: 19 points  
**Definition of Done**: VN Branch tạo được đơn, JP confirm, email được gửi

---

## Sprint 5 — Chuyến hàng (2026-08-10 → 2026-08-23)

**Goal**: JP Agency gom đơn vào chuyến, theo dõi được từ JP đến VN

| ID | Story | Points | Assignee |
|----|-------|--------|----------|
| US-401 | Tạo chuyến hàng (gom đơn) | 5 | Backend + Frontend |
| US-402 | Cập nhật trạng thái chuyến | 3 | Backend + Frontend |
| US-502 | Cấu hình permission matrix | 6 | Backend + Frontend |
| — | DB: shipment_batches, batch_order_items | 2 | Backend |
| — | Email: batch status notifications | 2 | Backend |

**Total**: 18 points  
**Definition of Done**: Batch tạo được, status update hoạt động đúng, email gửi đúng

---

## Sprint 6 — Polish & Bug Fix (2026-08-24 → 2026-09-06)

**Goal**: Sửa bug từ test nội bộ, hoàn thiện UX

| Hạng mục | Points |
|----------|--------|
| Bug fixes từ Sprint 1-5 | 8 |
| UX improvements (loading states, empty states, error handling) | 5 |
| Performance: API response time < 500ms | 3 |
| Security review (SQL injection, XSS, auth) | 3 |

**Total**: 19 points

---

## Sprint 7 — UAT & Production Deploy (2026-09-07 → 2026-09-20)

**Goal**: Hệ thống live trên production

| Hạng mục | Assignee |
|----------|----------|
| UAT với JP Agency và VN Branch thực tế | QA + PM |
| Fix bug UAT | Backend + Frontend |
| Setup ConoHa VPS production | DevOps |
| CI/CD pipeline production | DevOps |
| Data migration (nếu có dữ liệu cũ) | Backend |
| Go-live + monitoring | DevOps |

---

## Sprint V3 — Nâng cấp V3 (2026-06-08, đã hoàn thành local)

**Goal**: Order flow đầy đủ, Thông báo, Dashboard tài chính, Inventory nâng cao, Profile  
**Tiến độ**: ✅ ~95% code local | Chờ push `main` + migrate staging

| ID | Story | Points | Assignee | Trạng thái |
|----|-------|--------|----------|------------|
| US-V3-101~104 | Notification system (BE + FE) | 8 | Backend + Frontend | ✅ |
| US-V3-201~204 | Inventory V3: edit/delete/CSV import | 6 | Backend + Frontend | ✅ |
| US-V3-301~302 | Dashboard V2: revenue chart + cashflow | 5 | Backend + Frontend | ✅ |
| US-V3-401~403 | Order flow V3: APPROVED→PAID→SHIPPING | 6 | Backend + Frontend | ✅ |
| US-V3-501~502 | Profile: avatar_url, phone, name | 3 | Backend + Frontend | ✅ |
| — | BE migrations `100100` + `100110` | 2 | Backend | ⏳ OPS staging |
| — | FE form validation `lib/form-validation.ts` | 3 | Frontend | ✅ FE-V3-033 |
| — | Mobile responsive (bottom nav, card list) | 3 | Frontend | ✅ FE-V3-028~029 |
| — | Pricing 3 tầng + retail_price_vnd | 4 | Backend | ✅ BE-V3-010~012 |

**Total**: ~40 points  
**Definition of Done**: Staging staging migrate OK, smoke test `/api/notifications/count` + `/api/profile` pass

**Còn lại (P2 — không blocking staging)**:
- BE-V3-018: Scheduler daily restock_status update
- BE-V3-030: Suppliers CRUD đầy đủ
- BE-V3-031: Upload avatar POST /profile/avatar → Cloudflare R2

---

## Sprint AI-P — AI Purchasing Specialist (2026-06-08, đã hoàn thành local)

**Goal**: Gợi ý mua hàng thông minh dựa trên AI scoring 5 tiêu chí  
**Tiến độ**: ✅ ~90% code local | Thiếu OPENAI_API_KEY Railway + History page

| ID | Story | Points | Assignee | Trạng thái |
|----|-------|--------|----------|------------|
| US-AI-001 | BE AiPurchasingService — scoring engine | 8 | Backend | ✅ |
| US-AI-002 | BE POST /ai/purchasing — API endpoint | 3 | Backend | ✅ |
| US-AI-003 | FE PurchasingScreen — layout + request | 5 | Frontend | ✅ |
| US-AI-004 | FE ProductCard + ScoreBar component | 4 | Frontend | ✅ |
| US-AI-005 | FE Navigation item + proxy route | 2 | Frontend | ✅ |
| US-AI-006 | BE/FE AI Purchasing history | 5 | Backend + Frontend | 📋 P2 |
| — | Railway Secret: set OPENAI_API_KEY | 1 | DevOps | ⏳ OPS |

**Total**: ~28 points  
**Definition of Done**: POST /ai/purchasing trả về ai_score + breakdown 5 tiêu chí, UI hiển thị ScoreBar
