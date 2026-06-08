# Tài liệu dự án — TT Product Japan

> **Cập nhật**: 2026-06-08 | **Repo**: https://github.com/ndt2011/japan-product

Tài liệu được tổ chức theo vai trò.

**Nguồn sự thật khi code đã chạy** (đọc theo thứ tự):

1. [tasks/STATUS.md](tasks/STATUS.md) — tiến độ + việc còn lại
2. [sa/amendments/code-vs-docs-audit.md](sa/amendments/code-vs-docs-audit.md) — lệch docs ↔ code
3. [devops/SERVER_CURRENT.md](devops/SERVER_CURRENT.md) — URL staging, env, Shell
4. Code trong `project/`

---

## Cấu trúc thư mục

```
docs/
├── README.md                 ← File này (mục lục tổng)
│
├── business/                 Mục tiêu & phạm vi
│   └── vision.md
│
├── ba/                       Business Analysis
│   ├── BRD.md
│   ├── user-stories.md
│   ├── use-cases.md
│   ├── business-rules.md
│   ├── workflow.md
│   └── remember-me-spec.md
│
├── pm/                       Project Management
│   ├── roadmap.md
│   ├── milestones.md
│   ├── sprint-planning.md
│   └── backlog.md
│
├── sa/                       System Architecture
│   ├── 00_System_Overview.md       Tổng quan hệ thống (đọc đầu tiên)
│   ├── 04_API_Contract.md          API đầy đủ 9 module (markdown)
│   ├── AI_Search_Implementation.md Hướng dẫn embedding search (Phase 2)
│   ├── migrations_guide.md         Thứ tự migration + snippet
│   ├── design-source-demothietke.md
│   ├── _schema.json
│   ├── amendments/                 Thay đổi / nâng cấp sau MVP
│   │   ├── code-vs-docs-audit.md   ★ Audit code ↔ docs (cập nhật thường xuyên)
│   │   ├── invoice-payment.md      Phase 2: Hóa đơn + dual pricing
│   │   ├── upgrade-roadmap.md      Tier 1–3 nâng cấp
│   │   ├── branch-system.md
│   │   ├── orders-status.md
│   │   ├── reports-module.md
│   │   ├── ai-search-improvement.md
│   │   └── rbac-req003.md
│   ├── qa/
│   │   └── QA_Orders_Batch.md
│   └── devops/
│       └── deploy_guide.md
│
├── tasks/                    Task list & trạng thái dev
│   ├── STATUS.md             ★ Trạng thái tổng — cập nhật thường xuyên
│   ├── backend-tasks.md
│   ├── frontend-tasks.md
│   ├── qa-tasks.md
│   └── devops-tasks.md
│
├── qa/                       Test cases & acceptance
│   ├── test-cases.md
│   ├── acceptance-criteria.md
│   └── bruno-auth-collection.md
│
├── devops/
│   ├── SERVER_CURRENT.md           ★ Phiếu server staging — URL, env, Shell (mở đầu tiên)
│   ├── ENV_STAGING.md              Tổng hợp môi trường cloud (Railway + Vercel)
│   ├── ENV_LOCAL.md                ★ Tổng hợp môi trường local (Windows)
│   ├── STAGING_DEPLOY_MEMO.md      Checklist deploy từng bước
│   ├── railway-mysql-variables.md  MySQL + reset DB
│   ├── staging-setup.md            Tóm tắt Railway + Vercel
│   ├── rakuten-api-setup.md        ★ Rakuten AI + IP whitelist + quota
│   ├── staging-env-railway.template.env
│   └── staging-env-vercel.template.env
│
└── communication/
    └── request.md            Blockers dev → SA/PM
```

---

## AI Product Search — Hai luồng

| Luồng | Mục đích | API | Trạng thái code |
|-------|----------|-----|-----------------|
| **A — Khám phá sản phẩm mới** | Rakuten Ichiba API + GPT enrich, gửi duyệt | `POST/GET /ai/search`, `/ai/candidates` | ✅ Rakuten staging OK · Amazon chưa có |
| **B — Tìm trong catalog nội bộ** | Semantic search bằng OpenAI embedding + cosine similarity | `POST /ai/product-search` | ✅ API + tab `/ai-center` |

**FE**: `/ai-center` (luồng A) · `/admin/ai-candidates` (duyệt)  
**Setup key/env**: [`sa/AI_Setup_Guide.md`](./sa/AI_Setup_Guide.md) — file `project/api/.env`  
**Docs API**: `sa/04_API_Contract.md` Module 3 · `sa/amendments/ai_search-tables.md`

---

## Tiến độ phát triển (tóm tắt)

| Sprint | Nội dung | Code |
|--------|----------|------|
| S1 Auth | Login, Remember Me | ~65% |
| S2 Products | CRUD + ảnh | ~85% |
| S3 AI | Luồng A (search + duyệt) | ~75% |
| S4 Orders | CRUD + confirm + reserve | ~70% |
| S5 Shipments | Gom đơn + status flow | ~75% |
| DevOps | CI có · deploy cloud chưa | ~25% |

Chi tiết: [tasks/STATUS.md](./tasks/STATUS.md)

---

## Đọc theo vai trò

| Vai trò | Bắt đầu từ |
|---------|------------|
| PM | `business/vision.md` → `pm/roadmap.md` → `tasks/STATUS.md` |
| BA | `ba/BRD.md` → `ba/user-stories.md` → `ba/workflow.md` |
| SA | `sa/00_System_Overview.md` → `sa/04_API_Contract.md` → `sa/amendments/` |
| Backend | `tasks/backend-tasks.md` → `sa/04_API_Contract.md` → `sa/migrations_guide.md` |
| Frontend | `tasks/frontend-tasks.md` → `sa/design-source-demothietke.md` |
| QA | `qa/test-cases.md` → `sa/qa/QA_Orders_Batch.md` |
| DevOps | **`devops/ENV_STAGING.md`** + **`devops/ENV_LOCAL.md`** → `devops/STAGING_DEPLOY_MEMO.md` |

---

## File xlsx (SA gốc)

Các file `.xlsx` trong `docs/sa/` là thiết kế gốc. Khi chưa có sheet mới, dev dùng **amendments** + **04_API_Contract.md** làm nguồn tạm.
