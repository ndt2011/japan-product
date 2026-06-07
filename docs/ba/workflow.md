# Workflow — Quy trình nghiệp vụ

**Dự án**: Hệ thống quản lý hàng hóa Nhật-Việt  
**Phiên bản**: 1.0 | **Ngày**: 2026-06-07

---

## WF-01: Quy trình thêm sản phẩm mới qua AI

```
VN Branch Staff          Hệ thống (AI)              JP Agency Owner
     │                        │                           │
     │── Nhập từ khóa ───────>│                           │
     │                        │── Gọi OpenAI GPT-4o ────>│
     │                        │── Scrape Rakuten/AmazonJP │
     │<── Hiển thị 10 kết quả─│                           │
     │── Tick chọn + Gửi duyệt>│                          │
     │                        │── Tạo ai_product_candidates (PENDING)
     │                        │── Gửi email notification ─>│
     │                        │                           │── Xem danh sách chờ duyệt
     │                        │                           │── Kiểm tra, sửa tên VN/giá
     │                        │<── Duyệt / Từ chối ───────│
     │                        │── Tạo products (nếu duyệt)│
     │<── Notification ────────│                           │
```

**Trạng thái ai_product_candidates**: PENDING → APPROVED / REJECTED

---

## WF-02: Quy trình đặt hàng

```
VN Branch Staff          Hệ thống               JP Agency Staff/Owner
     │                      │                           │
     │── Chọn SP + số lượng─>│                          │
     │── Gửi đơn ───────────>│                          │
     │                      │── Tạo đơn (PENDING) ──────│
     │                      │── Tạm giữ tồn kho         │
     │                      │── Email notification ─────>│
     │                      │                           │── Xem đơn PENDING
     │                      │                           │── Kiểm tra hàng tồn kho thực tế
     │                      │<── Xác nhận đơn ──────────│
     │                      │── Lock tỷ giá             │
     │                      │── Đơn → CONFIRMED         │
     │<── Email notification─│                           │
```

**Trạng thái đơn hàng**: DRAFT → PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED

---

## WF-03: Quy trình chuyến hàng JP → VN

```
JP Agency Staff         Hệ thống              VN Branch
     │                      │                      │
     │── Tạo batch ─────────>│                     │
     │   (chọn các đơn CONFIRMED)                  │
     │                      │── Batch: PREPARING    │
     │                      │── Đơn → PROCESSING   │
     │                      │── Email ─────────────>│
     │                      │                      │
     │── Khai báo HQ Nhật ──>│                     │
     │                      │── Batch: CUSTOMS_JP  │
     │                      │                      │
     │── Hàng lên máy bay───>│                     │
     │                      │── Batch: IN_TRANSIT  │
     │                      │── Email ─────────────>│
     │                      │                      │
     │── HQ VN thông quan ──>│                     │
     │                      │── Batch: CUSTOMS_VN  │
     │                      │                      │
     │── Giao hàng thành công>│                    │
     │                      │── Batch: DELIVERED   │
     │                      │── Đơn → DELIVERED    │
     │                      │── Email ─────────────>│
```

**Trạng thái batch**: PREPARING → CUSTOMS_JP → IN_TRANSIT → CUSTOMS_VN → DELIVERED

---

## WF-04: Quy trình đăng nhập và lưu đăng nhập

```
User                    Hệ thống (API)              Database
  │                          │                          │
  │── POST /auth/login ──────>│                         │
  │   {email, password,       │                         │
  │    remember_me: true}     │── Kiểm tra credentials─>│
  │                          │<── User record ───────────│
  │                          │                          │
  │                          │ [remember_me = true]      │
  │                          │── Tạo token TTL 30 ngày  │
  │                          │── Lưu vào personal_access_tokens
  │                          │                          │
  │                          │ [remember_me = false]     │
  │                          │── Tạo token TTL 24 giờ   │
  │                          │                          │
  │<── { token, expires_at }──│                         │
  │── Lưu token vào httpOnly  │                         │
  │   cookie (frontend)       │                         │
```

---

## WF-05: Quy trình cấu hình và deploy hệ thống (DevOps)

```
Developer                GitHub Actions              Railway/Vercel
     │                        │                           │
     │── git push main ───────>│                          │
     │                        │── Chạy tests             │
     │                        │── Build Laravel/Next.js   │
     │                        │── Deploy ─────────────────>│
     │                        │                           │── migrate --force
     │                        │                           │── Restart service
     │<── Deploy success ──────│                          │
```

---

## WF-06: Luồng dữ liệu tổng thể hệ thống

```
Internet (Rakuten/Amazon JP)
        │
        │ Web Scraping (AI)
        ▼
[ai_product_candidates] ──duyệt──> [products] ──chọn──> [order_details]
                                       │                      │
                               [product_images]         [orders] ──gom──> [shipment_batches]
                                   [inventories]              │
                                [exchange_rates] ─────────────┘
                                 (lock khi confirm)
```
