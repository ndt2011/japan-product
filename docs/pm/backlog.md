# Product Backlog

**Dự án**: Hệ thống quản lý hàng hóa Nhật-Việt  
**Phiên bản**: 1.2 | **Ngày**: 2026-06-08

> **Legend**: P0=Must Have | P1=Should Have | P2=Nice to Have | P3=Future  
> **Trạng thái chi tiết**: [docs/tasks/STATUS.md](../tasks/STATUS.md)  
> **Status**: ✅ Done | 🔄 Partial | ⏸ Blocked | 📋 Todo

---

## Phase 1 — MVP Backlog

| ID | Epic | User Story / Task | Priority | Sprint | Status |
|----|------|-------------------|----------|--------|--------|
| BE-001 | Setup | Khởi tạo Laravel 11, MySQL, Redis | P0 | S1 | ✅ |
| BE-002 | Setup | Railway deployment + env | P0 | S1 | ✅ staging live |
| BE-003 | Auth | POST /auth/login (+ remember_me) | P0 | S1 | ✅ |
| BE-004 | Auth | POST /auth/logout | P0 | S1 | ✅ |
| BE-005 | Auth | GET /auth/me | P0 | S1 | ✅ |
| BE-006 | Auth | Account lockout 5 lần / 30 phút | P0 | S1 | ✅ |
| BE-007 | RBAC | 3-model approach (admin/company/branch) | P0 | S1 | ✅ |
| BE-008 | RBAC | RoleMiddleware + user mgmt APIs | P0 | S1 | ✅ |
| BE-009 | RBAC | Seeder: admin + company + branch | P0 | S1 | ✅ |
| BE-010 | User | CRUD admin-users, company-users, branch-users | P0 | S1 | ✅ |
| BE-011 | Product | Migration products + categories + images | P0 | S2 | ✅ |
| BE-012 | Product | API CRUD products | P0 | S2 | ✅ |
| BE-013 | Product | Upload ảnh Cloudflare R2 | P0 | S2 | ✅ staging R2 |
| BE-014 | AI | OpenAI GPT-4o integration | P0 | S3 | ✅ |
| BE-015 | AI | Rakuten API (Amazon chưa có) | P0 | S3 | 🔄 Rakuten ✅ |
| BE-016 | AI | Queue AI search + candidates | P0 | S3 | ✅ |
| BE-017 | AI | Catalog embedding + hybrid search | P0 | S3 | ✅ |
| BE-018 | Order | Migration orders + order_details | P0 | S4 | ✅ |
| BE-019 | Order | API CRUD orders + reserve | P0 | S4 | ✅ |
| BE-020 | Order | Exchange rate + lock on confirm | P0 | S4 | ✅ |
| BE-021 | Email | Email đơn mới, confirm | P0 | S4 | ✅ |
| BE-022 | Batch | Migration shipment_batches | P0 | S5 | ✅ |
| BE-023 | Batch | API CRUD shipment batches | P0 | S5 | ✅ |
| BE-024 | Report | Inventory + stock + orders + revenue | P1 | S6 | ✅ |
| BE-025 | Dashboard | GET /dashboard/stats + charts | P1 | S6 | ✅ |
| FE-001 | Setup | Next.js 14 + Tailwind + SupplyFlow UI | P0 | S1 | ✅ |
| FE-002 | Setup | Vercel deployment | P0 | S1 | ✅ |
| FE-003 | Auth | Login + Remember Me | P0 | S1 | ✅ |
| FE-004 | Auth | Auth middleware + BFF proxy | P0 | S1 | ✅ |
| FE-005 | Layout | AppShell + menu theo role | P0 | S1 | ✅ |
| FE-006 | Product | Danh sách / tạo / chi tiết SP | P0 | S2 | ✅ |
| FE-007 | Product | Upload ảnh | P0 | S2 | ✅ |
| FE-009 | AI | /ai-center chat-style | P0 | S3 | ✅ |
| FE-011 | Order | Tạo + list + chi tiết đơn | P0 | S4 | ✅ |
| FE-014 | Batch | /shipments quản lý chuyến | P0 | S5 | ✅ |
| FE-015 | Admin | /admin user mgmt + ma trận quyền | P0 | S1 | ✅ |
| DO-001 | DevOps | Railway + Vercel staging | P0 | S1 | ✅ |
| DO-002 | DevOps | GitHub Actions CI | P0 | S1 | ✅ |

---

## Phase 2 — Invoice, Dual Pricing, Profit (2026-06-08) ✅ ~98%

| ID | Feature | Priority | Status |
|----|---------|----------|--------|
| P2-INV-01 | Invoice module (auto từ order confirm) | P0 | ✅ |
| P2-INV-02 | Công nợ `/debts` + overdue scheduler | P0 | ✅ |
| P2-INV-03 | Dual pricing DB + form FE + createFromOrder | P0 | ✅ |
| P2-DEL-01 | 2-step delivery + confirm-receipt | P0 | ✅ |
| P2-DEL-02 | Auto-complete sau 7 ngày | P0 | ✅ |
| P2-RPT-01 | GET /reports/profit + tab FE | P1 | ✅ |
| P2-RPT-02 | order_costs API + UI + net profit | P1 | ✅ |
| P2-PDF-01 | DomPDF hóa đơn | P1 | ✅ · `pdf_path` persist ⏳ |
| P2-FE-01 | Product form dual pricing (Admin) | P0 | ✅ |
| P2-FE-02 | Tab Lợi nhuận `/reports` | P1 | ✅ |
| P2-FE-03 | Badge thông báo header | P2 | ✅ |
| P2-RPT-03 | profit/by-product + Recharts | P2 | ⏳ |

---

## Phase 2 Backlog (Future — sau invoice)

| ID | Feature | Priority | Status |
|----|---------|----------|--------|
| P2-001 | Dashboard nâng cao (đã có cơ bản) | P1 | ✅ cơ bản |
| P2-002 | Website catalog công khai | P1 | 📋 |
| P2-003 | Khai báo hải quan điện tử | P1 | 📋 |
| P2-004 | Yahoo Shopping scraper | P2 | 📋 |
| P2-005 | Email template editor WYSIWYG | P2 | 📋 |
| P2-006 | Báo cáo tồn kho (đã có API) | P1 | ✅ |
| P2-007 | Export Excel | P1 | 📋 |
| P2-008 | Audit log | P2 | 📋 |
| P2-009 | Amazon JP PA-API | P1 | 📋 |
| P2-010 | AI Phase 4 GPT re-rank | P2 | 📋 |
| P2-011 | Notification in-app | P2 | 📋 |
