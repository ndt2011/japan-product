# Japan Product API — Laravel 11

> REST API cho hệ thống quản lý hàng hóa Nhật-Việt.  
> Tài liệu thiết kế: `../../docs/sa/` · Task list: `../../docs/tasks/backend-tasks.md`

---

## Yêu cầu hệ thống

| Phần mềm | Phiên bản | Ghi chú |
|----------|-----------|---------|
| PHP | 8.3+ | Extensions: `openssl`, `pdo`, `mbstring`, `tokenizer`, `xml`, `ctype`, `json`, `bcmath` |
| Composer | 2.x | |
| MySQL | 8.0 | Khuyến nghị cho dev/production |
| Redis | 7.x | Tùy chọn local (queue/cache) |
| SQLite | 3.x | Dùng nhanh khi chưa có MySQL |

---

## Cài đặt nhanh (lần đầu)

```bash
# 1. Vào thư mục API
cd project/api

# 2. Cài dependencies
composer install

# 3. Tạo file môi trường
cp .env.example .env        # Windows: copy .env.example .env

# 4. Sinh application key
php artisan key:generate

# 5. Cấu hình database (xem mục bên dưới), sau đó:
php artisan migrate --seed

# 6. Chạy server
php artisan serve
# → http://localhost:8000
```

Kiểm tra API hoạt động:

```bash
curl http://localhost:8000/up
```

---

## Cấu hình database

### Cách 1: MySQL (khuyến nghị)

**Tạo database** (MySQL CLI hoặc Adminer):

```sql
CREATE DATABASE japan_product_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**Chỉnh `.env`:**

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=japan_product_db
DB_USERNAME=root
DB_PASSWORD=          # mật khẩu MySQL của bạn
```

**Chạy migration + seed:**

```bash
php artisan migrate --seed
```

### Cách 2: SQLite (dev nhanh, không cần MySQL)

**Tạo file DB:**

```bash
# Windows PowerShell
New-Item -ItemType File -Path database\database.sqlite -Force

# macOS / Linux
touch database/database.sqlite
```

**Chỉnh `.env`:**

```env
DB_CONNECTION=sqlite
DB_DATABASE=database/database.sqlite
# Comment hoặc bỏ DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD

QUEUE_CONNECTION=database
CACHE_STORE=file
```

**Chạy migration + seed:**

```bash
php artisan migrate:fresh --seed
```

---

## Biến môi trường quan trọng

| Biến | Mặc định | Mô tả |
|------|----------|-------|
| `APP_URL` | `http://localhost:8000` | URL API |
| `APP_TIMEZONE` | `Asia/Tokyo` | Múi giờ hệ thống |
| `SANCTUM_TOKEN_EXPIRATION` | `1440` | Token hết hạn sau 24h (phút) |
| `QUEUE_CONNECTION` | `redis` | Local không có Redis → đổi `database` |
| `CACHE_STORE` | `database` | SQLite dev → đổi `file` |
| `REDIS_HOST` | `127.0.0.1` | Cần khi dùng queue Redis |

File mẫu đầy đủ: `.env.example`

---

## Tài khoản mặc định (sau `db:seed`)

| Loại | Login ID | Mật khẩu | `user_type` |
|------|----------|----------|-------------|
| Quản trị viên | `admin` | `Admin@123` | `admin` |
| Công ty VN (demo) | `vn_company01` | `Company@123` | `company` |

> Chỉ dùng cho môi trường local/staging. **Đổi mật khẩu trước khi deploy production.**

---

## Chạy test

```bash
php artisan test

# Chạy nhóm cụ thể
php artisan test --filter=AuthTest
php artisan test --filter=ProductTest
```

---

## Queue worker (khi bật Redis / database queue)

```bash
# Terminal riêng
php artisan queue:work

# Hoặc listen (dev)
php artisan queue:listen
```

Production dùng **Supervisor** — xem `../../docs/sa/02_Thiết_kế_triển_khai.xlsx`.

---

## API endpoints

**Base URL:** `http://localhost:8000/api`

**Response chuẩn:**

```json
{
  "success": true,
  "data": {},
  "message": "M0103",
  "errors": null
}
```

### Auth (không cần token)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/auth/login` | Đăng nhập admin hoặc công ty VN |
| `POST` | `/auth/logout` | Đăng xuất (Bearer token) |
| `GET` | `/auth/me` | Thông tin user hiện tại |

### Products & master data (cần `Authorization: Bearer {token}`)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/products` | Danh sách sản phẩm |
| `GET` | `/products/{id}` | Chi tiết sản phẩm |
| `POST` | `/products` | Tạo sản phẩm |
| `PUT` | `/products/{id}` | Cập nhật sản phẩm |
| `DELETE` | `/products/{id}` | Xóa mềm sản phẩm |
| `GET` | `/suppliers` | Nhà cung cấp JP |
| `GET` | `/product-categories` | Danh mục hàng hóa |
| `GET` | `/exchange-rates/current` | Tỷ giá JPY→VND mới nhất |

Chi tiết request/response: `../../docs/sa/04_API_Contract.md`

### Ví dụ đăng nhập

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "{\"login_id\":\"admin\",\"password\":\"Admin@123\"}"
```

```bash
# Dùng token trả về
curl http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Accept: application/json"
```

---

## Kết nối Frontend (Next.js)

Frontend chạy tại `../frontend` (port `3000`).

**Trong `project/frontend/.env.local`:**

```env
API_URL=http://localhost:8000/api
```

Frontend gọi API qua BFF route (`/api/auth/login`) và lưu token httpOnly cookie.

CORS đã publish tại `config/cors.php` — paths `api/*`.

---

## Cấu trúc thư mục chính

```
app/
├── Http/
│   ├── Controllers/API/    # Auth, Product, MasterData
│   ├── Requests/           # Form validation
│   └── Resources/          # API transformers
├── Models/                 # Eloquent models
├── Repositories/           # Data access
├── Services/               # Business logic
└── Support/ApiResponse.php # Response envelope

database/
├── migrations/             # Schema theo docs/sa/03_Thiết_kế_CSDL.xlsx
└── seeders/                # Admin, Company, Master data

routes/api.php              # API routes
tools/generate_migrations.py  # Script sinh migration từ CSDL xlsx
```

---

## Lệnh hữu ích

```bash
# Reset DB và seed lại
php artisan migrate:fresh --seed

# Xem danh sách route
php artisan route:list --path=api

# Format code (PSR-12)
./vendor/bin/pint

# Xem log đăng nhập
# storage/logs/login-YYYY-MM-DD.log
```

---

## Xử lý lỗi thường gặp

| Lỗi | Cách xử lý |
|-----|------------|
| `No application encryption key` | Chạy `php artisan key:generate` |
| `SQLSTATE[HY000] [1049] Unknown database` | Tạo DB `japan_product_db` hoặc dùng SQLite |
| `could not find driver` (SQLite) | Bật extension `pdo_sqlite` trong `php.ini` |
| `could not find driver` (MySQL) | Bật extension `pdo_mysql` trong `php.ini` |
| Composer block security advisory | `composer config audit.block-insecure false` rồi `composer install` |
| Redis connection refused | Đổi `QUEUE_CONNECTION=database` trong `.env` |
| Port 8000 đã dùng | `php artisan serve --port=8001` |
| Login trả `M0101` (401) dù đúng MK | Chưa seed DB → `php artisan db:seed` |
| Frontend báo lỗi kết nối / 500 | API chưa chạy → `php artisan serve` (port 8000) |

---

## Tài liệu liên quan

| Tài liệu | Đường dẫn |
|----------|-----------|
| API Contract | `../../docs/sa/04_API_Contract.md` |
| Database Design | `../../docs/sa/03_Thiết_kế_CSDL.xlsx` |
| Backend tasks | `../../docs/tasks/backend-tasks.md` |
| Yêu cầu chờ SA/PM | `../../docs/communication/request.md` |
| HANDOFF tổng thể | `../../HANDOFF.md` |

---

## License

MIT — dựa trên [Laravel](https://laravel.com) framework.
