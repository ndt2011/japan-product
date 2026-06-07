# Staging — Railway + Vercel (tóm tắt)

> **Task**: DO-001, DO-002 · DEV-12, DEV-13  
> **Repo**: https://github.com/ndt2011/japan-product

## ★ Hướng dẫn đầy đủ (đọc file này trước)

**[STAGING_DEPLOY_MEMO.md](./STAGING_DEPLOY_MEMO.md)** — từng bước cụ thể + bảng memo ghi URL + checklist + troubleshooting.

**Template env copy nhanh:**

- [staging-env-railway.template.env](./staging-env-railway.template.env)
- [staging-env-vercel.template.env](./staging-env-vercel.template.env)

---

## Thứ tự 6 bước

| Bước | Việc | Nơi thực hiện |
|------|------|---------------|
| 0 | Smoke test local (login OK) | localhost |
| 1 | MySQL 8 + Redis 7 | Railway project |
| 2 | Deploy API — Root `project/api` | Railway + GitHub |
| 3 | `php artisan db:seed --force` | Railway Shell / CLI |
| 4 | Deploy FE — Root `project/frontend`, `API_URL` | Vercel |
| 5 | Login staging `admin` / `Admin@123` | Browser |
| 6 | Cấu hình Rakuten AI + whitelist IP Railway | Railway Variables + Rakuten Developers |
| 7 | Ảnh SP persistent — Cloudflare R2 | [r2-cloudflare-setup.md](./r2-cloudflare-setup.md) |

---

## Railway (API) — tóm tắt

1. New Project → Add **MySQL** + **Redis**
2. Add service từ GitHub `japan-product` → Root: **`project/api`**
3. Generate public domain
4. Variables: xem template [staging-env-railway.template.env](./staging-env-railway.template.env)
   - **Rakuten AI:** `RAKUTEN_APPLICATION_ID`, `RAKUTEN_ACCESS_KEY`, `RAKUTEN_ORIGIN_URL=https://japan-product.vercel.app` (copy từ `project/api/.env` local)
   - Hướng dẫn: [rakuten-api-setup.md](./rakuten-api-setup.md)
   - **Ảnh SP (R2)**: `PRODUCT_IMAGE_DISK=r2` + `R2_*` — [r2-cloudflare-setup.md](./r2-cloudflare-setup.md)
5. `APP_KEY`: `php artisan key:generate --show` (**chạy trên máy local**, không Railway Shell)
6. Health: `GET https://<api>/api/health`
7. **Rakuten** (bước 6): xem [rakuten-api-setup.md](./rakuten-api-setup.md)
   - Railway RAW Editor: `RAKUTEN_*`, `OPENAI_API_KEY`, `QUEUE_CONNECTION=sync`
   - Rakuten Developers: whitelist IP (`curl api.ipify.org` trong Railway Shell)

Start command (đã có trong `project/api/railway.toml`):

```
php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=$PORT
```

---

## Vercel (Frontend) — tóm tắt

1. Import repo → Root: **`project/frontend`**
2. Env: `API_URL=https://<api-railway>/api`
3. Deploy → `/login`

Template: [staging-env-vercel.template.env](./staging-env-vercel.template.env)

---

## Sau deploy

| Kiểm tra | Lệnh / URL |
|----------|------------|
| Health | `GET /api/health` |
| Login API | `POST /api/auth/login` body `admin` / `Admin@123` |
| Login UI | `https://<vercel>/login` |
| AI Rakuten | `/ai-center` → Khám phá web → `コラーゲン` (có ảnh + badge Rakuten) |

---

## CI & bảo vệ branch (tùy chọn)

- **CI**: `.github/workflows/ci.yml` — push `main`
- **Auto-deploy**: secrets `RAILWAY_TOKEN`, `VERCEL_TOKEN` → xem [deploy_guide.md](../sa/devops/deploy_guide.md)
- **Branch protection**: require PR + CI checks trên `main`

---

## Chi phí ước tính staging

| Dịch vụ | ~Chi phí |
|---------|----------|
| Railway (API + MySQL + Redis) | ~$5/tháng (credit free ban đầu) |
| Vercel | $0 (hobby) |
| OpenAI (tùy chọn) | pay-as-you-go |
