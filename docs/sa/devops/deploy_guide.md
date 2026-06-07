# DevOps Deploy Guide — Railway (BE) + Vercel (FE)

> **Stack**: Laravel (Railway) + React (Vercel) + MySQL (Railway)  
> **Thời điểm**: Cuối sprint, sau khi code hoàn thiện  
> **Không cần**: Cài server thủ công, biết Nginx/Docker sâu

---

## Tổng quan kiến trúc deploy

```
Internet
   │
   ├── [Vercel] React Frontend
   │      https://tt-product.vercel.app
   │      └── gọi API → Railway BE
   │
   └── [Railway] Laravel Backend
          https://tt-api.railway.app/api
          └── kết nối → [Railway] MySQL Database
```

---

## PHẦN 1 — Deploy Database (MySQL trên Railway)

### Bước 1: Tạo project Railway

1. Vào **https://railway.app** → đăng nhập GitHub
2. **New Project** → **Provision MySQL**
3. Railway tự tạo MySQL instance, lấy thông tin kết nối từ tab **Variables**:

```env
MYSQLHOST=monorail.proxy.rlwy.net
MYSQLPORT=12345
MYSQLDATABASE=railway
MYSQLUSER=root
MYSQLPASSWORD=xxxxxxxxxxxxxx
```

### Bước 2: Import schema

```bash
# Kết nối từ local để chạy migration
mysql -h monorail.proxy.rlwy.net -P 12345 -u root -p railway

# Hoặc dùng Railway CLI
railway run php artisan migrate --seed
```

---

## PHẦN 2 — Deploy Laravel Backend (Railway)

### Bước 1: Chuẩn bị project Laravel

Tạo file `Procfile` ở thư mục gốc project:

```
web: vendor/bin/heroku-php-apache2 public/
```

Tạo file `railway.toml` ở thư mục gốc:

```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "php artisan migrate --force && php artisan config:cache && php artisan route:cache && vendor/bin/heroku-php-apache2 public/"
healthcheckPath = "/api/health"
```

Thêm health check endpoint vào `routes/api.php`:

```php
Route::get('/health', fn() => response()->json(['status' => 'ok', 'timestamp' => now()]));
```

### Bước 2: Deploy lên Railway

```bash
# Cài Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# Deploy
railway up
```

### Bước 3: Set Environment Variables trên Railway

Vào Railway dashboard → project → **Variables** → thêm:

```env
APP_NAME=TT_Product_Japan
APP_ENV=production
APP_KEY=base64:xxxxxxxxxxxxxxxx    # php artisan key:generate --show
APP_DEBUG=false
APP_URL=https://tt-api.railway.app

# Database (lấy từ MySQL service)
DB_CONNECTION=mysql
DB_HOST=${MYSQLHOST}
DB_PORT=${MYSQLPORT}
DB_DATABASE=${MYSQLDATABASE}
DB_USERNAME=${MYSQLUSER}
DB_PASSWORD=${MYSQLPASSWORD}

# Sanctum
SANCTUM_STATEFUL_DOMAINS=tt-product.vercel.app
SESSION_DOMAIN=.railway.app

# OpenAI
OPENAI_API_KEY=sk-proj-xxxxxxxx
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
AI_SEARCH_LIMIT=15

# Mail (dùng Mailtrap cho staging, SMTP thật cho production)
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=xxxxxxxx
MAIL_PASSWORD=xxxxxxxx
MAIL_FROM_ADDRESS=noreply@tt-product.jp
MAIL_FROM_NAME="TT Product Japan"

# Storage (nếu dùng Cloudflare R2)
FILESYSTEM_DISK=r2
CLOUDFLARE_R2_ACCESS_KEY_ID=xxxxxxxx
CLOUDFLARE_R2_SECRET_ACCESS_KEY=xxxxxxxx
CLOUDFLARE_R2_DEFAULT_REGION=auto
CLOUDFLARE_R2_BUCKET=tt-product-images
CLOUDFLARE_R2_URL=https://xxxxxxxx.r2.cloudflarestorage.com
```

### Bước 4: Generate App Key

```bash
railway run php artisan key:generate
railway run php artisan migrate --force
railway run php artisan products:embed   # embed sản phẩm sau khi seed
```

### Bước 5: Kiểm tra

```bash
# Test health check
curl https://tt-api.railway.app/api/health

# Test login
curl -X POST https://tt-api.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"login_id":"admin","password":"Admin@123"}'
```

---

## PHẦN 3 — Deploy React Frontend (Vercel)

### Bước 1: Chuẩn bị

Tạo file `.env.production` trong thư mục React:

```env
VITE_API_URL=https://tt-api.railway.app/api
VITE_APP_NAME=TT Product Japan
```

Đảm bảo tất cả API call dùng biến env:

```js
// src/config/api.js
export const API_BASE = import.meta.env.VITE_API_URL;
```

### Bước 2: Deploy lên Vercel

```bash
# Cài Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy (chạy trong thư mục React)
vercel --prod
```

Hoặc kết nối GitHub repo → Vercel tự deploy khi push.

### Bước 3: Set Environment Variables trên Vercel

Vào Vercel dashboard → project → **Settings** → **Environment Variables**:

```
VITE_API_URL = https://tt-api.railway.app/api
```

### Bước 4: Config CORS trong Laravel

Vào `config/cors.php`:

```php
'allowed_origins' => [
    'https://tt-product.vercel.app',
    'https://tt-product-*.vercel.app',  // preview deployments
    'http://localhost:3000',            // local dev
    'http://localhost:5173',            // Vite dev server
],
```

---

## PHẦN 4 — CI/CD tự động (GitHub Actions)

Tạo file `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    name: Deploy Laravel → Railway
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Railway CLI
        run: npm install -g @railway/cli

      - name: Deploy to Railway
        run: railway up --detach
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

  deploy-frontend:
    name: Deploy React → Vercel
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci

      - name: Build
        working-directory: ./frontend
        run: npm run build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./frontend
          vercel-args: '--prod'
```

**Secrets cần set trong GitHub repository**:
- `RAILWAY_TOKEN` — lấy từ Railway account settings
- `VERCEL_TOKEN` — lấy từ Vercel account settings
- `VERCEL_ORG_ID` — lấy từ Vercel project settings
- `VERCEL_PROJECT_ID` — lấy từ Vercel project settings
- `VITE_API_URL` — URL Railway backend

---

## PHẦN 5 — Checklist trước khi deploy production

### Code
- [ ] `APP_DEBUG=false`
- [ ] Tất cả `.env` values điền đầy đủ
- [ ] `php artisan config:cache` && `route:cache`
- [ ] Không có `dd()`, `dump()`, `console.log()` nhạy cảm
- [ ] CORS whitelist đúng domain Vercel

### Database
- [ ] `php artisan migrate --force` chạy thành công
- [ ] Seed data admin mặc định đã tạo
- [ ] `php artisan products:embed` đã chạy

### Test nhanh sau deploy
- [ ] `GET /api/health` → `{"status":"ok"}`
- [ ] `POST /api/auth/login` → trả token
- [ ] `GET /api/products` → trả danh sách
- [ ] Frontend load được trang login
- [ ] Đăng nhập từ frontend → gọi API thành công

---

## Chi phí ước tính

| Dịch vụ | Gói | Chi phí |
|---------|-----|---------|
| Railway (BE + DB) | Hobby | $5/tháng |
| Vercel (FE) | Free | $0 |
| OpenAI API | Pay-as-you-go | ~$1-5/tháng |
| **Tổng** | | **~$6-10/tháng** |

> **Free tier**: Railway có $5 credit/tháng cho account mới. Vercel free cho personal projects.
