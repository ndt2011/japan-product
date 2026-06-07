# 🇯🇵🇻🇳 Hệ Thống Quản Lý Hàng Hóa Nhật-Việt

> Nền tảng B2B quản lý thực phẩm chức năng Nhật Bản — từ tìm kiếm sản phẩm bằng AI đến quản lý đơn hàng và chuyến hàng xuất nhập khẩu.

---

## 📌 Tổng quan dự án

| Mục | Thông tin |
|-----|-----------|
| Tên dự án | Hệ thống quản lý hàng hóa Nhật-Việt |
| Loại hệ thống | B2B — Đại lý Nhật Bản → Chi nhánh Việt Nam |
| Ngành hàng | Thực phẩm chức năng Nhật Bản |
| Trạng thái | 🔵 Đang thiết kế tài liệu |
| Ngày bắt đầu | 2026-06-07 |
| PM / SA | BIT Corp. |

---

## 🏗️ Môi trường hiện tại (Đang thiết lập)

### Tech Stack

| Layer | Công nghệ | Version | Ghi chú |
|-------|-----------|---------|---------|
| **Backend API** | Laravel | 11.x | PHP 8.3 |
| **Frontend** | Next.js | 14.x (App Router) | TypeScript + TailwindCSS |
| **Database** | MySQL | 8.0 | DB riêng từng project |
| **Cache / Queue** | Redis | 7.x | Session + Queue worker |
| **AI Search** | OpenAI API | GPT-4o | Tìm sản phẩm từ web |
| **Storage** | Cloudflare R2 | - | Ảnh sản phẩm, file HQ |
| **Email** | Resend.com | - | 3,000 mail/tháng free |

### Môi trường Deploy

| Môi trường | Service | URL dự kiến | Chi phí |
|------------|---------|-------------|---------|
| **API (Backend)** | Railway.app | `api.yourdomain.com` | ~$10/tháng |
| **Frontend** | Vercel | `app.yourdomain.com` | Free tier |
| **DB Web UI** | Adminer (trên VPS) | `db.yourdomain.com` | Included |
| **Production** | ConoHa VPS 4GB Tokyo | - | ~2,640円/tháng |

### Môi trường Local Dev

```bash
# Yêu cầu cài sẵn
- PHP 8.3 + Composer
- Node.js 20 + npm
- MySQL 8.0 hoặc Docker Desktop

# Clone và chạy
git clone https://github.com/ndt2011/japan-product.git

# Backend
cd japan-product-api
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve  # → http://localhost:8000

# Frontend
cd japan-product-frontend
cp .env.local.example .env.local
npm install
npm run dev  # → http://localhost:3000
```

---

## 📁 Cấu trúc thư mục tài liệu

```
TT_product_japan/
├── README.md                    ← File này
├── HANDOFF.md                   ← Yêu cầu cho team members
│
├── docs/
│   ├── business/
│   │   └── vision.md            ✅ Mục tiêu & phạm vi dự án
│   │
│   ├── ba/                      ✅ Business Analysis
│   │   ├── BRD.md               Yêu cầu nghiệp vụ
│   │   ├── user-stories.md      User Stories theo role
│   │   ├── use-cases.md         Use Cases chi tiết
│   │   ├── business-rules.md    Quy tắc nghiệp vụ
│   │   └── workflow.md          Quy trình nghiệp vụ
│   │
│   ├── pm/                      ✅ Project Management
│   │   ├── roadmap.md           Lộ trình phát triển
│   │   ├── milestones.md        Các mốc quan trọng
│   │   ├── sprint-planning.md   Kế hoạch sprint
│   │   └── backlog.md           Product backlog
│   │
│   ├── sa/                      ✅ System Architecture
│   │   ├── 01_Kiến_trúc_hệ_thống.xlsx
│   │   ├── 02_Thiết_kế_triển_khai.xlsx   ✅ Hoàn thành
│   │   ├── 03_Thiết_kế_CSDL.xlsx         ✅ Hoàn thành
│   │   ├── 04_API_Contract.xlsx
│   │   ├── 05_Sơ_đồ_nghiệp_vụ.xlsx       ✅ Hoàn thành
│   │   ├── 06_Hằng_số_thông_báo.xlsx     ✅ Hoàn thành
│   │   ├── 1-001_Đăng_nhập.xlsx          ✅ Hoàn thành
│   │   ├── 2-001_Thông_tin_hàng_hóa.xlsx ✅ Hoàn thành
│   │   ├── 2-101_AI_Tìm_sản_phẩm.xlsx
│   │   ├── 3-001_Tạo_sửa_đơn_hàng.xlsx
│   │   ├── 4-001_Quản_lý_chuyến_hàng.xlsx
│   │   └── 5-001_Quản_lý_người_dùng.xlsx
│   │
│   ├── tasks/                   ✅ Task List cho Dev
│   │   ├── backend-tasks.md
│   │   ├── frontend-tasks.md
│   │   ├── qa-tasks.md
│   │   └── devops-tasks.md
│   │
│   └── qa/                      ✅ Quality Assurance
│       ├── test-cases.md
│       └── acceptance-criteria.md
│
└── project/                     📋 Source code (do dev tạo)
    ├── api/                     Laravel 11
    └── frontend/                Next.js 14
```

---

## 👥 Roles hệ thống

| Role | Mô tả | Quyền chính |
|------|-------|-------------|
| `SUPER_ADMIN` | Quản trị viên hệ thống | Toàn quyền, cấu hình permission |
| `JP_AGENCY_OWNER` | Chủ đại lý Nhật | Quản lý sản phẩm, xác nhận đơn, chuyến hàng |
| `JP_AGENCY_STAFF` | Nhân viên đại lý Nhật | Xử lý đơn, khai báo hải quan |
| `VN_BRANCH_OWNER` | Chủ chi nhánh VN | Quản lý branch, xem báo cáo |
| `VN_BRANCH_STAFF` | Nhân viên chi nhánh VN | Đặt hàng, theo dõi đơn |

---

## 🔗 Links quan trọng

| Mục | Link |
|-----|------|
| Railway Dashboard | https://railway.app |
| Vercel Dashboard | https://vercel.com |
| GitHub Org | https://github.com/YOUR_ORG |
| Adminer (DB UI) | https://db.yourdomain.com |
| API Base URL | https://api.yourdomain.com |
| Frontend URL | https://app.yourdomain.com |

---

## ⚠️ Lưu ý bảo mật

- **Không commit file `.env`** vào git
- Adminer chỉ mở cho IP whitelist của team
- MySQL chỉ bind `127.0.0.1`, không expose ra ngoài
- SSH chỉ dùng key, tắt password login
- OpenAI API key lưu trong Railway Secret Variables
