# HANDOFF — Yêu Cầu Cho Team Members

> **Dành cho**: Backend Developer, Frontend Developer, QA Engineer, DevOps Engineer  
> **Cập nhật**: 2026-06-07  
> **Owner**: PM/SA

---

## 📋 Trạng thái tài liệu hiện tại

Toàn bộ tài liệu thiết kế đã được hoàn thiện. Dev **KHÔNG được bắt đầu code** cho module nào khi tài liệu của module đó chưa có dấu ✅.

| Tài liệu | Trạng thái | Vị trí |
|----------|------------|--------|
| Vision / Mục tiêu dự án | ✅ | `docs/business/vision.md` |
| BRD - Yêu cầu nghiệp vụ | ✅ | `docs/ba/BRD.md` |
| User Stories | ✅ | `docs/ba/user-stories.md` |
| Use Cases | ✅ | `docs/ba/use-cases.md` |
| Business Rules | ✅ | `docs/ba/business-rules.md` |
| Workflow | ✅ | `docs/ba/workflow.md` |
| Roadmap & Milestones | ✅ | `docs/pm/roadmap.md` |
| Sprint Planning | ✅ | `docs/pm/sprint-planning.md` |
| Backlog | ✅ | `docs/pm/backlog.md` |
| Kiến trúc hệ thống | ✅ | `docs/sa/01_Kiến_trúc_hệ_thống.xlsx` |
| Thiết kế triển khai | ✅ | `docs/sa/02_Thiết_kế_triển_khai.xlsx` |
| Thiết kế CSDL | ✅ | `docs/sa/03_Thiết_kế_CSDL.xlsx` |
| API Contract | ✅ | `docs/sa/04_API_Contract.xlsx` |
| Sơ đồ nghiệp vụ | ✅ | `docs/sa/05_Sơ_đồ_nghiệp_vụ.xlsx` |
| Hằng số & Messages | ✅ | `docs/sa/06_Hằng_số_thông_báo.xlsx` |
| Màn hình: Đăng nhập | ✅ | `docs/sa/1-001_Đăng_nhập.xlsx` |
| Màn hình: Thông tin hàng hóa | ✅ | `docs/sa/2-001_Thông_tin_hàng_hóa.xlsx` |
| Task List | ✅ | `docs/tasks/` |
| Test Cases | ✅ | `docs/qa/` |

---

## 🔵 BACKEND DEVELOPER — Laravel 11

### Đọc trước khi bắt đầu
1. `docs/ba/BRD.md` — Hiểu yêu cầu nghiệp vụ
2. `docs/ba/business-rules.md` — Các ràng buộc logic
3. `docs/sa/03_Thiết_kế_CSDL.xlsx` — Schema DB đầy đủ
4. `docs/sa/04_API_Contract.xlsx` — Danh sách API + request/response mẫu
5. `docs/sa/06_Hằng_số_thông_báo.xlsx` — Constants, enums, error codes

### Yêu cầu cụ thể

#### 1. Khởi tạo project Laravel
```
- Laravel 11.x / PHP 8.3
- Cấu trúc thư mục: theo Laravel convention
- Sanctum cho authentication (token-based)
- MySQL 8.0
- Redis cho queue + session
```

#### 2. Database Migration
- Tạo migration theo đúng schema trong `03_Thiết_kế_CSDL.xlsx`
- **Thứ tự migrate**: users → roles → permissions → role_permissions → companies → products → orders → ...
- Đặt tên migration theo convention: `create_{table_name}_table`
- Seeders: roles, permissions, admin account mặc định

#### 3. Authentication (Module 1)
- Tham khảo: `docs/sa/1-001_Đăng_nhập.xlsx`
- API: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- Multi-company login: user thuộc 1 company cụ thể
- Token expiry: 24h (configurable)

#### 4. RBAC — Phân quyền
- 5 roles: `SUPER_ADMIN`, `JP_AGENCY_OWNER`, `JP_AGENCY_STAFF`, `VN_BRANCH_OWNER`, `VN_BRANCH_STAFF`
- Permission matrix do SUPER_ADMIN cấu hình
- Middleware: `CheckPermission` — check permission trước mỗi API
- User có thể override permission riêng (per-user override)

#### 5. AI Product Search (Module 2)
- Tham khảo: `docs/ba/user-stories.md` US-201
- Flow: Frontend gửi keyword → API gọi OpenAI GPT-4o → Scrape Rakuten/Amazon JP → Trả kết quả
- Lưu vào bảng `ai_product_candidates` với status `PENDING`
- Admin duyệt → chuyển sang bảng `products`

#### 6. Queue / Job
- AI search chạy async qua Queue (Redis driver)
- Supervisor quản lý worker: `php artisan queue:work`

#### 7. Coding Standards
- PSR-12
- Repository Pattern
- Service Layer
- Form Request Validation
- API Resource (Transformer)
- **Tất cả response dùng format chuẩn**:
```json
{
  "success": true,
  "data": {},
  "message": "M0101",
  "errors": null
}
```

#### 8. Tham khảo task chi tiết
→ `docs/tasks/backend-tasks.md`

---

## 🟢 FRONTEND DEVELOPER — Next.js 14

### Đọc trước khi bắt đầu
1. `docs/ba/user-stories.md` — Hiểu user cần gì
2. `docs/sa/1-001_Đăng_nhập.xlsx` — Thiết kế màn hình Auth
3. `docs/sa/2-001_Thông_tin_hàng_hóa.xlsx` — Thiết kế màn hình Product
4. `docs/sa/04_API_Contract.xlsx` — API endpoint + response shape
5. `docs/sa/06_Hằng_số_thông_báo.xlsx` — Message codes để display

### Yêu cầu cụ thể

#### 1. Khởi tạo project Next.js
```
- Next.js 14 (App Router)
- TypeScript strict mode
- TailwindCSS
- shadcn/ui cho components
- Axios hoặc fetch với interceptor
- Zustand hoặc React Context cho state
```

#### 2. Cấu trúc thư mục (App Router)
```
app/
├── (auth)/
│   └── login/
├── (dashboard)/
│   ├── layout.tsx          ← Sidebar + Header
│   ├── products/
│   ├── orders/
│   ├── shipments/
│   └── admin/
│       ├── users/
│       └── permissions/
└── api/                    ← Next.js API routes (nếu cần)
```

#### 3. Authentication
- JWT token lưu trong httpOnly cookie (không localStorage)
- Middleware Next.js để redirect nếu chưa login
- Role-based menu: hiển thị menu theo role của user

#### 4. AI Search UI (Module 2)
- Chat interface giống ChatGPT
- Hiển thị kết quả dạng card với ảnh sản phẩm
- User tick ✓ để chọn sản phẩm → gửi lên backend
- Loading state trong lúc AI đang tìm

#### 5. i18n (Đa ngôn ngữ)
- Tiếng Việt là ngôn ngữ mặc định
- Hỗ trợ chuyển sang Tiếng Nhật (cho staff bên Nhật)
- Dùng `next-intl` hoặc `i18next`

#### 6. Tham khảo task chi tiết
→ `docs/tasks/frontend-tasks.md`

---

## 🟡 QA ENGINEER

### Đọc trước khi bắt đầu
1. `docs/ba/use-cases.md` — Các kịch bản cần test
2. `docs/ba/business-rules.md` — Rules cần verify
3. `docs/qa/test-cases.md` — Test cases chi tiết
4. `docs/qa/acceptance-criteria.md` — Điều kiện nghiệm thu

### Yêu cầu cụ thể

#### 1. Test Environment
```
- API: Railway.app staging environment
- Frontend: Vercel preview deployment
- DB: MySQL riêng cho test (không dùng chung production)
- Tool: Postman / Bruno cho API testing
```

#### 2. Test Scope
- **Unit Test**: Business logic functions (backend)
- **API Test**: Tất cả endpoints trong `04_API_Contract.xlsx`
- **E2E Test**: Playwright — các flow chính
- **Permission Test**: Verify RBAC cho mỗi role

#### 3. Bug Report Format
```
Title: [Module] Mô tả ngắn
Severity: Critical / High / Medium / Low
Steps to reproduce:
1. ...
2. ...
Expected: ...
Actual: ...
Screenshot/Video: [đính kèm]
```

#### 4. Acceptance Criteria
- Xem: `docs/qa/acceptance-criteria.md`
- Mỗi User Story phải có tối thiểu 1 happy path + 1 negative case pass

#### 5. Tham khảo task chi tiết
→ `docs/tasks/qa-tasks.md`

---

## 🔴 DEVOPS ENGINEER

### Đọc trước khi bắt đầu
1. `docs/sa/01_Kiến_trúc_hệ_thống.xlsx` — Sơ đồ hạ tầng
2. `docs/sa/02_Thiết_kế_triển_khai.xlsx` — Chi tiết deploy, Adminer, CI/CD

### Yêu cầu cụ thể

#### 1. Test Environment (Railway + Vercel)
```
Backend:
- Tạo project trên Railway.app
- Add service: Laravel API
- Add service: MySQL 8
- Add service: Redis 7
- Set environment variables (xem .env.example)

Frontend:
- Import GitHub repo vào Vercel
- Set NEXT_PUBLIC_API_URL = Railway API URL
```

#### 2. GitHub Repository Setup
```
- Tạo 2 repo:
  https://github.com/ndt2011/japan-product (monorepo hoặc chia api/frontend)
- Branch convention: main → staging → production
- Branch protection: main cần PR + review
```

#### 3. CI/CD Pipeline
- Tham khảo: `docs/sa/02_Thiết_kế_triển_khai.xlsx` Sheet 3
- GitHub Actions workflow:
  - Push to `main` → auto deploy to Railway/Vercel
  - Chạy test trước khi deploy

#### 4. Production (ConoHa VPS — sau khi test xong)
```
Spec: VPS 4GB RAM / 3 Core / 100GB SSD / Tokyo
OS: Ubuntu 22.04
Stack:
  - Nginx (reverse proxy)
  - PHP 8.3 + PHP-FPM
  - MySQL 8.0
  - Redis 7
  - Node.js 20 + PM2
  - Supervisor (queue worker)
  - Certbot (SSL)
  - Adminer (DB UI)
  - UFW + Fail2ban
```

#### 5. Adminer Setup
- Tham khảo: `docs/sa/02_Thiết_kế_triển_khai.xlsx` Sheet 2
- Basic Auth (htpasswd) + IP whitelist
- URL: `https://db.yourdomain.com`

#### 6. Monitoring
- Cài UptimeRobot (free) để monitor uptime
- Log: Laravel log → `/var/log/nginx/` + `/storage/logs/`
- Alert: Email khi server down

#### 7. Tham khảo task chi tiết
→ `docs/tasks/devops-tasks.md`

---

## 📞 Liên hệ khi có thắc mắc

| Vấn đề | Liên hệ |
|--------|---------|
| Yêu cầu nghiệp vụ không rõ | PM → nguyendoanthuy472@gmail.com |
| DB schema cần thay đổi | Cập nhật `03_Thiết_kế_CSDL.xlsx` + báo SA |
| API contract thay đổi | Cập nhật `04_API_Contract.xlsx` + báo Frontend |
| Bug production | Tạo issue trên GitHub, tag `[P0]` |

---

## ⚠️ QUY TẮC QUAN TRỌNG

1. **Không tự ý thay đổi DB schema** mà không cập nhật tài liệu
2. **Không merge PR** nếu chưa có code review
3. **Không deploy production** trong giờ cao điểm (9h-18h JST)
4. **Commit message convention**: `feat(module): mô tả` / `fix(module): mô tả`
5. **Mọi thay đổi lớn** phải update tài liệu tương ứng trước
