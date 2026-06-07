# Cloudflare R2 — Lưu ảnh sản phẩm trên Railway

> **Mục tiêu**: Ảnh upload trên staging/production **không mất** sau khi Railway redeploy/restart.  
> **Code**: `ImageStorageService` dùng disk `config('filesystems.product_images_disk')` → biến **`PRODUCT_IMAGE_DISK`**.

---

## Quan trọng — tên biến đúng

| Biến | Dùng cho gì | Local | Railway |
|------|-------------|-------|---------|
| **`PRODUCT_IMAGE_DISK`** | Upload ảnh SP | `public` | **`r2`** |
| `FILESYSTEM_DISK` | Disk mặc định Laravel | `local` | `local` (giữ nguyên) |
| `R2_*` | Credentials Cloudflare R2 | (trống) | **điền đủ** |

> Amendment cũ ghi `FILESYSTEM_DISK=r2` — trong repo này ảnh SP đọc **`PRODUCT_IMAGE_DISK`**, không đọc `FILESYSTEM_DISK`.

---

## Cách B — Railway Bucket (như ảnh `tt-product-images` trên canvas)

Railway có **Storage Bucket** riêng (S3-compatible, endpoint `https://storage.railway.app`). Bucket **private** — code đã hỗ trợ **presigned URL** khi không có `R2_PUBLIC_URL`.

### Bước tiếp theo trên màn hình Railway

1. Bấm **Deploy ↑+Enter** (góc trên) để tạo bucket
2. Mở service **API Laravel** (không phải bucket) → tab **Variables**
3. **+ New Variable** → **Add Variable Reference** → chọn bucket `tt-product-images`
4. Chọn preset **Laravel** (Railway tự inject `AWS_*`) **hoặc** dán thủ công:

```env
PRODUCT_IMAGE_DISK=r2

R2_ACCESS_KEY_ID=${{tt-product-images.ACCESS_KEY_ID}}
R2_SECRET_ACCESS_KEY=${{tt-product-images.SECRET_ACCESS_KEY}}
R2_BUCKET=${{tt-product-images.BUCKET}}
R2_ENDPOINT=${{tt-product-images.ENDPOINT}}
R2_DEFAULT_REGION=${{tt-product-images.REGION}}

# Railway bucket private — để TRỐNG (code dùng presigned URL)
# R2_PUBLIC_URL=
```

> `${{tt-product-images.BUCKET}}` là tên bucket **thật** (có hash), không phải tên hiển thị `tt-product-images`.

5. **Redeploy** service API
6. `GET /api/health` → `r2_configured: true`
7. Upload ảnh SP → test redeploy → ảnh vẫn load (URL presigned, refresh mỗi lần gọi API)

---

## Cách A — Cloudflare R2 (public URL cố định)

## Tổng quan 5 bước

```
1. Cloudflare → tạo bucket R2
2. Cloudflare → tạo API Token (Object Read & Write)
3. Cloudflare → bật public URL (r2.dev hoặc custom domain)
4. Railway → thêm biến R2_* + PRODUCT_IMAGE_DISK=r2
5. Kiểm tra → upload ảnh SP trên staging
```

---

## Bước 1 — Tạo bucket R2 (Cloudflare Dashboard)

1. Đăng nhập [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Menu trái: **R2 Object Storage** → **Create bucket**
3. Đặt tên ví dụ: `tt-product-images` (hoặc `japan-product-staging`)
4. Location: **Automatic** (hoặc chọn region gần user)
5. **Create bucket**

Ghi lại:
- **Bucket name**: `tt-product-images`
- **Account ID**: trên sidebar R2 (dạng `a1b2c3d4e5f6...`)

---

## Bước 2 — Tạo API Token

1. R2 → **Manage R2 API Tokens** → **Create API token**
2. Permission: **Object Read & Write** (hoặc Admin Read & Write nếu cần quản lý bucket)
3. Scope: **Apply to specific buckets only** → chọn bucket vừa tạo
4. **Create API Token**

Lưu ngay (chỉ hiện 1 lần):
- **Access Key ID** → `R2_ACCESS_KEY_ID`
- **Secret Access Key** → `R2_SECRET_ACCESS_KEY`

---

## Bước 3 — Public URL (để FE hiển thị ảnh)

Ảnh lưu R2 cần URL public. Có 2 cách:

### Cách A — R2.dev subdomain (nhanh, staging)

1. Vào bucket → **Settings** → **Public access**
2. Bật **Allow Access** → **R2.dev subdomain**
3. Cloudflare cấp URL dạng: `https://pub-xxxxxxxx.r2.dev`

→ Dùng làm **`R2_PUBLIC_URL`**

### Cách B — Custom domain (production)

1. Bucket → **Settings** → **Custom Domains** → Connect domain  
   Ví dụ: `cdn.yourdomain.com`
2. Thêm DNS record theo hướng dẫn Cloudflare

→ `R2_PUBLIC_URL=https://cdn.yourdomain.com`

### CORS (nếu FE load ảnh trực tiếp từ browser)

Bucket → **Settings** → **CORS policy**:

```json
[
  {
    "AllowedOrigins": ["https://japan-product.vercel.app", "http://localhost:3000"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

---

## Bước 4 — Cấu hình Railway Variables

1. Railway → project → service **API** (Laravel) → **Variables**
2. Mở **RAW Editor** và thêm (hoặc cập nhật):

```env
# Ảnh sản phẩm — BẮT BUỘC trên Railway
PRODUCT_IMAGE_DISK=r2

R2_ACCESS_KEY_ID=<Access Key từ bước 2>
R2_SECRET_ACCESS_KEY=<Secret Key từ bước 2>
R2_DEFAULT_REGION=auto
R2_BUCKET=tt-product-images
R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://pub-xxxxxxxx.r2.dev

# Disk mặc định Laravel — có thể giữ local
FILESYSTEM_DISK=local
```

**Cách lấy `R2_ENDPOINT`**:
- Format: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
- `ACCOUNT_ID` = Account ID trên Cloudflare (sidebar R2)

3. **Deploy / Redeploy** service API sau khi lưu biến.

> Package `league/flysystem-aws-s3-v3` đã có trong `composer.json` — không cần cài thêm trên Railway.

---

## Bước 5 — Kiểm tra sau deploy

### 5.1 Health API

```bash
curl "https://product-production-7e4e.up.railway.app/api/health"
```

Response mong đợi có thêm:

```json
{
  "data": {
    "product_image_disk": "r2",
    "r2_configured": true
  }
}
```

Nếu `r2_configured: false` → thiếu một trong các biến `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT`.

### 5.2 Upload ảnh thật

1. Login staging: `admin` / `Admin@123`
2. **Hàng hóa** → chọn SP → **Sửa** → upload ảnh (hoặc tạo SP kèm ảnh)
3. URL ảnh trong response phải bắt đầu bằng `R2_PUBLIC_URL` (ví dụ `https://pub-xxx.r2.dev/products/...`)

### 5.3 Redeploy test (quan trọng)

1. Railway → **Redeploy** API
2. Mở lại trang SP → ảnh **vẫn hiển thị** (không 404)

Nếu ảnh cũ (upload trước khi bật R2) vẫn trỏ `.../storage/...` trên Railway → chỉ ảnh mới upload sau khi bật R2 mới persistent.

---

## Checklist nhanh

```
[ ] Bucket R2 đã tạo
[ ] API Token Object Read & Write
[ ] Public access (r2.dev hoặc custom domain)
[ ] Railway: PRODUCT_IMAGE_DISK=r2
[ ] Railway: R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
[ ] Railway: R2_BUCKET, R2_ENDPOINT, R2_PUBLIC_URL
[ ] Redeploy API
[ ] GET /api/health → r2_configured: true
[ ] Upload ảnh → URL dạng pub-xxx.r2.dev
[ ] Redeploy → ảnh vẫn xem được
```

---

## Lỗi thường gặp

| Triệu chứng | Nguyên nhân | Cách sửa |
|-------------|-------------|----------|
| Upload 500 / `Could not connect` | Sai `R2_ENDPOINT` | Phải là `https://<account-id>.r2.cloudflarestorage.com` |
| Upload OK nhưng ảnh 403/404 | Chưa bật public access | Bật R2.dev subdomain hoặc custom domain |
| `r2_configured: false` trên health | Thiếu biến Railway | Kiểm tra đủ 4 biến: key, secret, bucket, endpoint |
| Ảnh mất sau redeploy | Vẫn `PRODUCT_IMAGE_DISK=public` | Đổi thành `r2` + redeploy |
| URL ảnh sai host | `R2_PUBLIC_URL` trống/sai | Khớp với public URL bucket (có `https://`, không slash cuối) |
| Chỉ ảnh cũ hỏng | Upload trước khi migrate R2 | Upload lại ảnh hoặc migrate file thủ công lên bucket |

---

## Local dev (không bắt buộc R2)

```env
PRODUCT_IMAGE_DISK=public
FILESYSTEM_DISK=public
APP_URL=http://localhost:8000
```

```bash
cd project/api
php artisan storage:link
```

Chỉ bật R2 trên **Railway staging/production**.

---

## Liên kết

| File | Nội dung |
|------|----------|
| [staging-env-railway.template.env](./staging-env-railway.template.env) | Template copy RAW Editor |
| [product-image-upload.md](../sa/amendments/product-image-upload.md) | Amendment upload ảnh |
| [rakuten-api-setup.md](./rakuten-api-setup.md) | Rakuten (tách biệt R2) |
