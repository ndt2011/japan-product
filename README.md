# 🇯🇵🇻🇳 Hệ Thống Quản Lý Hàng Hóa Nhật-Việt

> Nền tảng B2B quản lý thực phẩm chức năng Nhật Bản — từ **tìm kiếm sản phẩm bằng AI** đến quản lý đơn hàng và chuyến hàng xuất nhập khẩu.

---

## 📌 Tổng quan dự án

| Mục | Thông tin |
|-----|-----------|
| Tên dự án | Hệ thống quản lý hàng hóa Nhật-Việt |
| Loại hệ thống | B2B — Đại lý Nhật Bản → Chi nhánh Việt Nam |
| Ngành hàng | Thực phẩm chức năng Nhật Bản |
| Trạng thái | 🟢 **Đang phát triển** (S1–S5 core ~70%) |
| Repo | https://github.com/ndt2011/japan-product |
| Ngày bắt đầu | 2026-06-07 |

**Trạng thái chi tiết**: [docs/tasks/STATUS.md](docs/tasks/STATUS.md)

---

## 🤖 AI Product Search

Hệ thống có **hai luồng AI** (tách biệt):

| Luồng | Mô tả | API | Code |
|-------|-------|-----|------|
| **A — Khám phá SP mới** | Tìm trên web → chọn → gửi duyệt → thêm catalog | `/ai/search`, `/ai/candidates` | ✅ |
| **B — Tìm catalog nội bộ** | Embedding OpenAI + cosine similarity | `/ai/product-search` | 📋 Có tài liệu |

- FE: `/ai-center` · `/admin/ai-candidates`
- Docs: [docs/sa/04_API_Contract.md](docs/sa/04_API_Contract.md) Module 3 · [docs/sa/AI_Search_Implementation.md](docs/sa/AI_Search_Implementation.md)

---

## 🏗️ Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| **Backend** | Laravel 11 · PHP 8.3 · Sanctum |
| **Frontend** | Next.js 14 · TypeScript · TailwindCSS |
| **Database** | MySQL 8 |
| **AI** | OpenAI (GPT-4o mock / Embeddings luồng B) |
| **Storage** | Local `public` · Cloudflare R2 (config sẵn) |
| **CI** | GitHub Actions — 33 PHPUnit + FE build |

---

## 🚀 Chạy local

```bash
git clone https://github.com/ndt2011/japan-product.git
cd japan-product

# Backend
cd project/api
cp .env.example .env   # hoặc chỉnh DB
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve      # → http://localhost:8000

# Frontend (terminal khác)
cd project/frontend
cp .env.local.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:8000/api
npm install
npm run dev            # → http://localhost:3000
```

**Tài khoản seed**: Admin `admin` / `Admin@123` · Company `vn_company01` / `Company@123`

---

## 📁 Cấu trúc repo

```
TT_product_japan/
├── README.md              ← File này
├── HANDOFF.md             ← Handoff cho developer
├── CLAUDE.md              ← Quy trình AI PM
│
├── docs/                  ← ★ Toàn bộ tài liệu dự án
│   ├── README.md          Mục lục docs (đọc đầu tiên)
│   ├── business/          Vision
│   ├── ba/                BRD, user stories, workflow
│   ├── pm/                Roadmap, sprint, backlog
│   ├── sa/                Kiến trúc, API contract, AI guide
│   │   ├── 00_System_Overview.md
│   │   ├── 04_API_Contract.md
│   │   ├── AI_Search_Implementation.md
│   │   ├── amendments/    Thay đổi DB/API tạm
│   │   ├── qa/
│   │   └── devops/
│   ├── tasks/             Task list + STATUS.md
│   ├── qa/                Test cases
│   └── communication/     Blockers → SA/PM
│
└── project/
    ├── api/               Laravel 11
    ├── frontend/          Next.js 14
    └── demothietke/       UI prototype SupplyFlow
```

Chi tiết từng file: **[docs/README.md](docs/README.md)**

---

## 📊 Tiến độ sprint

| Sprint | Nội dung | ~% |
|--------|----------|-----|
| S1 Auth | Login, Remember Me | 65–70 |
| S2 Products | CRUD + ảnh | 85 |
| S3 AI | Luồng A search + duyệt | 75 |
| S4 Orders | CRUD + confirm | 70 |
| S5 Shipments | Gom đơn + tracking | 75 |
| DevOps | CI ✅ · deploy cloud 📋 | 25 |

---

## 👥 Roles hệ thống

| Role | Mô tả |
|------|-------|
| `SUPER_ADMIN` | Toàn quyền, cấu hình permission |
| `JP_AGENCY_OWNER/STAFF` | Sản phẩm, đơn hàng, chuyến hàng |
| `VN_BRANCH_OWNER/STAFF` | Đặt hàng, theo dõi đơn/chuyến |

*(RBAC đầy đủ chờ SA REQ-003 — xem `docs/sa/amendments/rbac-req003.md`)*

---

## 🔗 Links

| Mục | Link |
|-----|------|
| GitHub | https://github.com/ndt2011/japan-product |
| API Contract | [docs/sa/04_API_Contract.md](docs/sa/04_API_Contract.md) |
| Deploy guide | [docs/sa/devops/deploy_guide.md](docs/sa/devops/deploy_guide.md) |

---

## ⚠️ Bảo mật

- Không commit `.env` / API keys
- OpenAI key chỉ trong env local hoặc Railway secrets
- MySQL không expose public khi deploy production
