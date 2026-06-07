# DevOps Tasks

**Dự án**: Hệ thống quản lý hàng hóa Nhật-Việt  
**Cập nhật**: 2026-06-07 | **Assignee**: DevOps Engineer  
**Tham khảo**: `docs/sa/02_Thiết_kế_triển_khai.xlsx` · [STATUS.md](./STATUS.md)

**Legend**: ✅ Done | 🔄 Partial | 📋 Todo

---

## SPRINT 1 — Test Environment

| ID | Mô tả | P | Est | Trạng thái |
|----|-------|---|-----|------------|
| DO-001 | Railway: Laravel API + MySQL 8 + Redis 7 | P0 | 0.5d | ✅ Staging live |
| DO-002 | Vercel: import repo, `API_URL` → Railway | P0 | 0.5d | ✅ japan-product.vercel.app |
| DO-003 | GitHub Actions CI/CD | P0 | 1d | 🔄 `ci.yml` ✅ · `railway.toml` ✅ |
| DO-004 | Branch protection `main` (PR + review) | P1 | 0.5d | 📋 DEV-15 |
| DO-005 | Git repo monorepo trên GitHub | P0 | — | ✅ `ndt2011/japan-product` |

### CI hiện có (`.github/workflows/ci.yml`)

- Push/PR `main`, `staging`
- Job `api`: PHP 8.3 → `php artisan test` (sqlite)
- Job `frontend`: Node 20 → `npm run build`

### Cần thêm (`deploy.yml`)

- Sau CI pass → deploy Railway + Vercel staging
- Secrets: `RAILWAY_TOKEN`, `VERCEL_TOKEN`

---

## SPRINT 7 — Production (ConoHa VPS)

| ID | Mô tả | P | Est | Trạng thái |
|----|-------|---|-----|------------|
| DO-005 | Thuê VPS 4GB Tokyo + UFW | P0 | 0.5d | 📋 |
| DO-006 | Stack: Nginx, PHP 8.3, MySQL, Redis, PM2, Supervisor | P0 | 1d | 📋 |
| DO-007 | Nginx virtual host + SSL Certbot | P0 | 1d | 📋 |
| DO-008 | Adminer + Basic Auth + IP whitelist | P0 | 0.5d | 📋 |
| DO-009 | Deploy production qua SSH (GitHub Actions) | P0 | 1d | 📋 |
| DO-010 | Supervisor queue worker | P0 | 0.5d | 📋 |
| DO-011 | Laravel Scheduler crontab | P0 | 0.5d | 📋 |
| DO-012 | UptimeRobot + log rotation | P1 | 0.5d | 📋 |

---

## Checklist Go-Live

- [ ] SSL active, auto-renew
- [ ] UFW: 22, 80, 443 only
- [ ] MySQL/Redis bind 127.0.0.1
- [ ] Adminer: Basic Auth + IP whitelist
- [ ] `.env` production không commit
- [ ] `APP_DEBUG=false`
- [ ] Queue worker (Supervisor)
- [ ] Scheduler crontab
- [ ] DB backup hàng ngày
- [ ] UptimeRobot `/health` active
- [ ] Rollback plan
