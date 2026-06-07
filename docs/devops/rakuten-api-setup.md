# Rakuten Ichiba API — Cấu hình local

> Sau khi đăng ký app tại https://webservice.rakuten.co.jp/

## 1. Lấy key từ dashboard

| Key | Vị trí |
|-----|--------|
| **Application ID** | App detail → Application ID (UUID) |
| **Access Key** | App detail → Access Key (`pk_...`) |
| **Affiliate ID** | Tùy chọn |

## 2. Bắt buộc: Đăng ký IP + URL trên Rakuten

Rakuten API **2026** chỉ chấp nhận request từ IP và website đã đăng ký.

### Bước A — IP public

1. Mở https://webservice.rakuten.co.jp/ → đăng nhập → chọn app
2. Tìm mục **許可IPアドレス** (Allowed IP addresses)
3. Lấy IP public máy bạn:

```powershell
(Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing).Content
```

4. Dán IP vào danh sách → Lưu

> Mỗi lần đổi mạng WiFi / 4G, IP có thể đổi → cần cập nhật lại.

### Bước B — Website đã cho phép

Trong app settings, mục **許可されたWebサイト** (Allowed website):

```
http://localhost:3000
```

(hoặc domain Vercel staging nếu test trên cloud)

## 3. Thêm vào `project/api/.env`

```env
RAKUTEN_APPLICATION_ID=your_application_id
RAKUTEN_ACCESS_KEY=your_access_key
RAKUTEN_AFFILIATE_ID=
RAKUTEN_ORIGIN_URL=http://localhost:3000
```

> **Không commit** `.env` lên Git.

## 4. Restart API

```powershell
cd project\api
php artisan serve
```

## 5. Test

1. http://localhost:3000 → AI Center → **Khám phá web**
2. Gõ `コラーゲン`
3. Kết quả có:
   - Ảnh sản phẩm
   - Badge **Rakuten (giá thật)**
   - Link `item.rakuten.co.jp` mở được

## 6. Luồng hiện tại

```
Rakuten API (ảnh + link thật)
    ↓
GPT enrichment (tên VN, category, cách dùng) — không tạo link giả
```

Nếu Rakuten lỗi IP → hiển thị **M0206**, **không** trả link/ảnh giả từ GPT.

## 7. Lỗi thường gặp

| Mã / lỗi | Nguyên nhân | Cách sửa |
|----------|-------------|----------|
| **M0206** / `CLIENT_IP_NOT_ALLOWED` | IP chưa đăng ký Rakuten | Thêm IP public vào app settings |
| **M0207** | Origin/Referer sai | `RAKUTEN_ORIGIN_URL` = URL đã đăng ký |
| Không có ảnh | Rakuten fail → GPT fallback cũ | Sửa IP → Rakuten trả ảnh thật |
| Link sai / example | GPT đoán URL | Đã tắt — chỉ Rakuten có link |

## 8. Staging Railway

Thêm variables trên service `product` + **đăng ký IP outbound của Railway** (hoặc IP cố định proxy).
