# Railway — Gắn MySQL vào service `product`

> Khi `/api/health` trả `"db":"sqlite"`, `"db_host_set":false` → biến DB **chưa** vào container API.

## Hay nhầm #1 — Thêm biến vào MySQL

| ❌ Sai | ✅ Đúng |
|--------|---------|
| Tab **Variables** của service **MySQL** | Tab **Variables** của service **`product`** (GitHub) |

Biến trên MySQL chỉ dùng cho container MySQL, **không** tự sang `product`.

---

## Healthcheck failure (deploy đỏ)

Triệu chứng: Build/Deploy OK nhưng **Network > Healthcheck Failed** ~5 phút.

**Nguyên nhân:** `php artisan migrate` lỗi (MySQL sai `DB_URL`) → server không chạy → `/api/health` không trả lời.

**Cách xử lý:**

1. Mở tab **Deploy Logs** — tìm `[start] WARN: migrate FAILED` hoặc lỗi SQL
2. Sửa **Variables** trên `product` (xem bên dưới `DB_URL`)
3. **Redeploy**
4. Sau deploy Success → **Console**: `php artisan migrate --force && php artisan db:seed --force`

Code mới: server **vẫn start** khi migrate fail (staging) để healthcheck pass.

---

## Vẫn sqlite sau Redeploy? — Fix chắc chắn

### Bước A — Xóa biến DB cũ trên `product`

Variables → xóa hết: `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`, `DB_URL`

### Bước B — Chỉ dùng 2 biến (copy giá trị THẬT từ MySQL)

Trên service **MySQL** → Variables → bấm **Reveal** / copy:

| Trên `product` | Giá trị |
|----------------|---------|
| `DB_CONNECTION` | `mysql` (gõ tay) |
| `DB_URL` | dán **nguyên** giá trị `MYSQL_URL` từ MySQL |

`MYSQL_URL` dạng: `mysql://root:xxx@mysql.railway.internal:3306/railway`

**Không** dùng `${{MySQL.MYSQL_URL}}` gõ tay — phải **copy chuỗi thật** hoặc Add Reference đúng.

### Bước C — Redeploy + kiểm tra health

```json
"mysql_env_keys": ["DB_CONNECTION", "DB_URL", ...],
"db": "mysql"
```

Nếu `mysql_env_keys` **rỗng `[]`** → Railway không inject env vào container (liên hệ support hoặc tạo service mới).

---

## Cách fix — Copy tay (5 phút)

### 1. Lấy giá trị từ MySQL

1. Click **MySQL** (không phải product)
2. Tab **Variables**
3. Ghi lại giá trị **thật** (click icon copy):

- `MYSQLHOST`
- `MYSQLPORT`
- `MYSQLDATABASE`
- `MYSQLUSER`
- `MYSQLPASSWORD`

### 2. Dán vào `product`

1. Click **`product`**
2. Tab **Variables** → **RAW Editor**
3. Dán (thay giá trị thật):

```env
APP_ENV=staging
APP_URL=https://product-production-7e4e.up.railway.app
APP_DEBUG=false

DB_CONNECTION=mysql
DB_HOST=<paste MYSQLHOST>
DB_PORT=<paste MYSQLPORT>
DB_DATABASE=<paste MYSQLDATABASE>
DB_USERNAME=<paste MYSQLUSER>
DB_PASSWORD=<paste MYSQLPASSWORD>
```

4. **Update Variables**

### 3. Redeploy bắt buộc

**Deployments** → **Redeploy** → đợi **Success**

### 4. Kiểm tra

```
GET https://product-production-7e4e.up.railway.app/api/health
```

Kỳ vọng:

```json
"db": "mysql",
"db_host_set": true,
"db_connection_env": "mysql"
```

---

## Hay nhầm #2 — Sai Railway Environment

Góc trên dashboard có dropdown **Environment** (ví dụ `production`).

Biến phải thêm trong **cùng environment** đang deploy.

---

## Cách fix — Railway CLI (Windows)

```powershell
npm install -g @railway/cli
railway login
cd c:\WORK\05_THUY_PROJECT\project_alone\TT_product_japan
railway link
```

Chọn project `japan-product-staging` và service **`product`**.

Xem biến hiện tại:

```powershell
railway variables
```

Nếu trống → set (thay giá trị từ MySQL Variables):

```powershell
railway variables --set "DB_CONNECTION=mysql" --set "DB_HOST=mysql.railway.internal" --set "DB_PORT=3306" --set "DB_DATABASE=railway" --set "DB_USERNAME=root" --set "DB_PASSWORD=YOUR_PASSWORD"
```

Redeploy:

```powershell
railway up --detach
```

---

## Làm sạch DB — chỉ giữ tài khoản (staging)

**Railway Console** (service `product`):

```bash
php artisan migrate:fresh --force
php artisan db:seed --class=AuthOnlySeeder --force
```

Xóa toàn bộ dữ liệu cũ (đơn hàng, sản phẩm, AI…) và chỉ tạo:

| Login ID | Mật khẩu | Loại |
|----------|----------|------|
| `admin` | `Admin@123` | Super Admin |
| `vn_company01` | `Company@123` | Chi nhánh VN |

Muốn thêm data demo (1 SP + kho): dùng `php artisan db:seed --force` (full `DatabaseSeeder`).

---

## Sau khi `db: mysql`

```bash
php artisan db:seed --force
```

Login test:

```powershell
$body = '{"login_id":"admin","password":"Admin@123"}'
Invoke-RestMethod -Uri "https://product-production-7e4e.up.railway.app/api/auth/login" -Method POST -Body $body -ContentType "application/json"
```
