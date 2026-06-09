# DevOps Tasks

**Dự án**: Hệ thống quản lý hàng hóa Nhật-Việt  
**Cập nhật**: 2026-06-09 (lần 20) | **Assignee**: DevOps Engineer  
**Tham khảo**: `docs/sa/02_Thiết_kế_triển_khai.xlsx` · [STATUS.md](./STATUS.md) · [ENV_STAGING.md](../devops/ENV_STAGING.md)

**Legend**: ✅ Done | 🔄 Partial | 📋 Todo | ⏳ Chờ push/deploy

---

## SPRINT 1 — Test Environment

| ID | Mô tả | P | Est | Trạng thái |
|----|-------|---|-----|------------|
| DO-001 | Railway: Laravel API + MySQL 8 + Redis 7 | P0 | 0.5d | ✅ Staging live |
| DO-002 | Vercel: import repo, `API_URL` → Railway | P0 | 0.5d | ✅ japan-product.vercel.app |
| DO-003 | GitHub Actions CI/CD | P0 | 1d | 🔄 `ci.yml` ✅ · auto-deploy Railway+Vercel `main` ✅ |
| DO-004 | Branch protection `main` (PR + review) | P1 | 0.5d | 📋 |
| DO-005 | Git repo monorepo trên GitHub | P0 | — | ✅ `ndt2011/japan-product` |

### CI (`.github/workflows/ci.yml`)

- Push/PR `main`, `staging`
- Job `api`: PHP 8.3 → `php artisan test` (sqlite) — **81 passed**
- Job `frontend`: Node 20 → `npm run build`

### Staging URLs

| Service | URL |
|---------|-----|
| API | `https://product-production-7e4e.up.railway.app` |
| FE | `https://japan-product.vercel.app` |
| Health | `/api/health` · Redis probe `/api/health?redis=1` |

---

## SPRINT 7 — Production (ConoHa VPS)

| ID | Mô tả | P | Est | Trạng thái |
|----|-------|---|-----|------------|
| DO-101 | Thuê VPS 4GB Tokyo + UFW | P0 | 0.5d | 📋 |
| DO-102 | Stack: Nginx, PHP 8.3, MySQL, Redis, Supervisor | P0 | 1d | 📋 |
| DO-103 | Nginx virtual host + SSL Certbot | P0 | 1d | 📋 |
| DO-104 | Deploy production qua SSH (GitHub Actions) | P0 | 1d | 📋 |
| DO-105 | Supervisor queue worker + Scheduler crontab | P0 | 1d | 📋 |
| DO-106 | UptimeRobot + log rotation + DB backup | P1 | 0.5d | 📋 |

---

## SPRINT V3 + Phase 2 — Staging OPS

| ID | Mô tả | P | Est | Trạng thái |
|----|-------|---|-----|------------|
| DO-013 | Migrate `100100_v3_upgrade_phase1` | P0 | — | ✅ Auto `migrate --force` |
| DO-014 | Migrate `100110_v3_profile_fields` | P0 | — | ✅ Auto |
| DO-020 | Migrate `100120_create_purchasing_sessions` | P0 | 5min | ⏳ Sau push lần 19 (local) |
| DO-021 | Railway: `REDIS_URL=${{Redis.REDIS_URL}}` trên service **product** | P0 | 10min | 📋 Manual — giữ `CACHE_STORE=database` |
| DO-015 | Railway Secret: `OPENAI_API_KEY` | P0 | 10min | 📋 Cần key thực |
| DO-016 | Vercel + `next.config.mjs`: domain R2 thật | P1 | 15min | 📋 |
| DO-022 | Railway Shell: `products:generate-vi` + `products:embed --force` | P0 | 30min | 📋 Luồng B AI catalog |
| DO-017 | Smoke: `GET /api/notifications/count` → 200 | P0 | 5min | 📋 |
| DO-018 | Smoke: `GET /api/profile` → `avatar_url` | P0 | 5min | 📋 |
| DO-019 | Smoke: `POST /api/ai/purchasing` → 200 | P0 | 10min | 📋 |
| DO-023 | Smoke: `GET /api/ai/purchasing/history` → 200 | P1 | 5min | ⏳ Sau push `100120` |
| DO-024 | Smoke: `GET /api/reports/profit/by-product` → 200 (admin) | P1 | 5min | 📋 |

### Lệnh Railway Shell

```bash
cd /app && php artisan migrate --force
php artisan migrate:status | grep "100100\|100110\|100120"

# AI catalog Luồng B (OPS)
php artisan products:generate-vi
php artisan products:embed --force
```

### Smoke curl

```bash
API=https://product-production-7e4e.up.railway.app/api
TOKEN="..."   # admin Bearer

curl -H "Authorization: Bearer $TOKEN" "$API/notifications/count"
curl -H "Authorization: Bearer $TOKEN" "$API/profile"
curl -H "Authorization: Bearer $TOKEN" "$API/ai/purchasing/history"
curl -H "Authorization: Bearer $TOKEN" "$API/reports/profit/by-product?limit=5"

curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"query":"vitamin C Nhật ngân sách 3000 yen"}' \
  "$API/ai/purchasing"
```

---

## Checklist Go-Live

- [ ] SSL active, auto-renew
- [ ] UFW: 22, 80, 443 only
- [ ] MySQL/Redis bind 127.0.0.1
- [ ] `.env` production không commit
- [ ] `APP_DEBUG=false`
- [ ] Queue worker (Supervisor)
- [ ] Scheduler crontab (invoices:check-overdue, orders:auto-complete, inventories:sync-restock-status)
- [ ] DB backup hàng ngày
- [ ] UptimeRobot `/api/health` active
- [ ] Rollback plan
