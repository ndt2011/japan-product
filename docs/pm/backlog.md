# Product Backlog

**Dự án**: Hệ thống quản lý hàng hóa Nhật-Việt  
**Phiên bản**: 1.1 | **Ngày**: 2026-06-07

> **Legend**: P0=Must Have | P1=Should Have | P2=Nice to Have | P3=Future  
> **Trạng thái chi tiết**: [docs/tasks/STATUS.md](../tasks/STATUS.md)  
> **Status**: ✅ Done | 🔄 Partial | ⏸ Blocked | 📋 Todo

---

## Phase 1 — MVP Backlog

| ID | Epic | User Story / Task | Priority | Points | Sprint | Status |
|----|------|-------------------|----------|--------|--------|--------|
| BE-001 | Setup | Khởi tạo Laravel 11, cấu hình MySQL, Redis | P0 | 3 | S1 | ✅ local |
| BE-002 | Setup | Railway deployment + env variables | P0 | 2 | S1 | 📋 |
| BE-003 | Auth | API: POST /auth/login (+ remember_me) | P0 | 2 | S1 | ✅ |
| BE-004 | Auth | API: POST /auth/logout (revoke token) | P0 | 1 | S1 | ✅ |
| BE-005 | Auth | API: GET /auth/me | P0 | 1 | S1 | ✅ |
| BE-006 | Auth | Account lockout sau 5 lần sai | P0 | 2 | S1 | ⏸ |
| BE-007 | RBAC | Migration: users, roles, permissions, role_permissions | P0 | 3 | S1 | ⏸ |
| BE-008 | RBAC | Middleware CheckPermission | P0 | 2 | S1 | ⏸ |
| BE-009 | RBAC | Seeder: roles mặc định + admin account | P0 | 1 | S1 | ⏸ |
| BE-010 | User | API: CRUD users | P0 | 3 | S1 | ⏸ |
| BE-011 | Product | Migration: products, categories, suppliers (thiếu images) | P0 | 3 | S2 | 🔄 |
| BE-012 | Product | API: CRUD products | P0 | 3 | S2 | 🔄 |
| BE-013 | Product | Upload ảnh lên Cloudflare R2 | P0 | 3 | S2 |
| BE-014 | AI | OpenAI GPT-4o integration | P0 | 5 | S3 |
| BE-015 | AI | Web scraper: Rakuten + Amazon JP | P0 | 5 | S3 |
| BE-016 | AI | Queue job: AI search async | P0 | 2 | S3 |
| BE-017 | AI | API: ai_product_candidates CRUD | P0 | 2 | S3 |
| BE-018 | Order | Migration: orders, order_details | P0 | 2 | S4 |
| BE-019 | Order | API: CRUD orders | P0 | 4 | S4 |
| BE-020 | Order | Inventory reservation logic | P0 | 3 | S4 |
| BE-021 | Order | Exchange rate: DB + auto-update API | P0 | 3 | S4 |
| BE-022 | Email | Resend.com integration | P0 | 2 | S4 |
| BE-023 | Email | Email templates: đơn mới, confirm, batch update | P0 | 3 | S4 |
| BE-024 | Batch | Migration: shipment_batches, batch_order_items | P0 | 2 | S5 |
| BE-025 | Batch | API: CRUD shipment batches | P0 | 4 | S5 |
| BE-026 | Permission | API: permission matrix CRUD | P1 | 3 | S5 |
| FE-001 | Setup | Khởi tạo Next.js 14, TailwindCSS, SupplyFlow UI | P0 | 3 | S1 | ✅ |
| FE-002 | Setup | Vercel deployment | P0 | 1 | S1 | 📋 |
| FE-003 | Auth | Trang login + Remember Me checkbox | P0 | 2 | S1 | ✅ |
| FE-004 | Auth | Auth middleware Next.js | P0 | 2 | S1 | ✅ |
| FE-005 | Layout | AppShell 12 route + menu theo role | P0 | 3 | S1 | 🔄 |
| FE-006 | Product | Màn hình: danh sách sản phẩm | P0 | 2 | S2 | 🔄 |
| FE-007 | Product | Màn hình: tạo/sửa sản phẩm + upload ảnh | P0 | 4 | S2 |
| FE-008 | Product | Màn hình: chi tiết sản phẩm | P0 | 2 | S2 |
| FE-009 | AI | Màn hình AI search (chat-style) | P0 | 4 | S3 |
| FE-010 | AI | Màn hình duyệt sản phẩm AI | P0 | 3 | S3 |
| FE-011 | Order | Màn hình tạo đơn hàng | P0 | 4 | S4 |
| FE-012 | Order | Màn hình danh sách đơn hàng | P0 | 2 | S4 |
| FE-013 | Order | Màn hình chi tiết đơn hàng + timeline | P0 | 2 | S4 |
| FE-014 | Batch | Màn hình tạo/quản lý chuyến hàng | P0 | 4 | S5 |
| FE-015 | Permission | Màn hình permission matrix | P1 | 4 | S5 |
| QA-001 | Test | Viết test cases Auth module | P0 | 2 | S1 |
| QA-002 | Test | Viết test cases Product module | P0 | 2 | S2 |
| QA-003 | Test | Viết test cases AI module | P0 | 2 | S3 |
| QA-004 | Test | Viết test cases Order module | P0 | 2 | S4 |
| QA-005 | Test | Viết test cases Batch module | P0 | 2 | S5 |
| QA-006 | Test | E2E test: full flow đặt hàng + chuyến hàng | P0 | 5 | S6 |
| DO-001 | DevOps | Setup Railway + Vercel | P0 | 2 | S1 | 📋 |
| DO-002 | DevOps | GitHub Actions CI (test + build) | P0 | 3 | S1 | 🔄 |
| DO-003 | DevOps | Setup ConoHa VPS production | P0 | 4 | S7 |
| DO-004 | DevOps | Adminer setup + security | P0 | 2 | S7 |
| DO-005 | DevOps | Monitoring + alerting | P1 | 2 | S7 |

---

## Phase 2 Backlog (Future)

| ID | Feature | Priority |
|----|---------|---------|
| P2-001 | Dashboard: biểu đồ doanh thu, đơn hàng theo tháng | P1 |
| P2-002 | Website catalog công khai | P1 |
| P2-003 | Khai báo hải quan điện tử | P1 |
| P2-004 | Yahoo Shopping scraper | P2 |
| P2-005 | Email template editor WYSIWYG | P2 |
| P2-006 | Báo cáo tồn kho | P1 |
| P2-007 | Export Excel: đơn hàng, sản phẩm | P1 |
| P2-008 | Audit log: lịch sử thay đổi dữ liệu | P2 |
