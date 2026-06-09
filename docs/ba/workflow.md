# Workflow — Quy trình nghiệp vụ

**Dự án**: Hệ thống quản lý hàng hóa Nhật-Việt  
**Phiên bản**: 1.0 | **Ngày**: 2026-06-07

---

## WF-01: Quy trình thêm sản phẩm mới qua AI (Luồng A — đã triển khai)

> **Luồng B** (tìm catalog nội bộ): `POST /ai/product-search` — ✅ đã triển khai. Quy trình **dạy AI** tiếng Việt: [ai-catalog-teaching-process.md](../sa/amendments/ai-catalog-teaching-process.md)

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

## WF-01b: Quy trình dạy AI tìm catalog (Luồng B — đã triển khai)

> Chi tiết đầy đủ: `docs/sa/amendments/ai-catalog-teaching-process.md`

```
Admin / DevOps                    Hệ thống                         User (VN)
      │                               │                                │
      │── products:generate-vi ──────>│ GPT sinh name_vi, description_vi
      │── products:embed --force ────>│ OpenAI embedding → products.embedding
      │                               │                                │
      │                               │<── User gõ "bổ gan" ───────────│
      │                               │── QueryExpansion (few-shot)      │
      │                               │── Hybrid search catalog        │
      │                               │── expanded_query + kết quả ───>│
```

**Chu kỳ lặp lại:** Mỗi khi có sản phẩm mới (duyệt luồng A hoặc tạo tay) → `generate-vi` + `embed` cho SP đó.

**Màn hình:** `/ai-center` → tab **Tìm catalog nội bộ** (gợi ý: bổ gan, vitamin C, collagen…)

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

---

## WF-V3-01: Luồng đơn hàng đầy đủ (V3)

```
[Company/Branch]          [Admin]                  [System]
      │                       │                        │
      ├─ Tạo đơn (DRAFT)      │                        │
      ├─ Gui don ──────────► PENDING                   │
      │                  ├─ Duyet ──────────────────► APPROVED
      │                  ├─ Ghi nhan TT ────────────► PAID
      │                  ├─ Nhap Tracking URL ──────► SHIPPING
      │◄─────────── Thong bao giao hang              │
      ├─ Xac nhan nhan hang ──────────────────────► DELIVERED
      │                                    Auto 24h ► COMPLETED
```

**Trigger thông báo tự động:**
- PENDING → APPROVED: notify Company/Branch
- PAID → SHIPPING: notify Company/Branch (kèm tracking URL)
- DELIVERED: notify Admin (Branch đã xác nhận)

---

## WF-V3-02: Luồng CSV Import Kho

```
[Admin]
  │
  ├─ Click "📥 Import CSV"
  ├─ Chuẩn bị file: product_cd, warehouse_id, quantity (, min_stock_qty, notes)
  ├─ Upload file (max 2MB, UTF-8)
  │
  [Backend]
  ├─ Parse CSV header → validate cột bắt buộc
  ├─ Với mỗi dòng:
  │   ├─ Tìm inventory theo product_cd + warehouse_id
  │   ├─ Nếu tìm thấy → stockIn() + update min_stock_qty
  │   ├─ Nếu không → ghi lỗi dòng N: "Không tìm thấy SP"
  ├─ Return: { imported: N, total_rows: M, errors: [...] }
  │
  [Admin]
  └─ Xem kết quả: X dòng thành công / Y lỗi cụ thể
```

---

## WF-AI-01: Luồng AI Purchasing Specialist

```
[Admin/Company]
  │
  ├─ Nhập yêu cầu tiếng Việt (query + budget_jpy + qty + preferences)
  │
  [AiPurchasingService]
  ├─ Step 1: Dịch keyword VI → JP (RakutenKeywordTranslatorService)
  ├─ Step 2: Tìm Rakuten (10 kết quả) + catalog nội bộ (5 kết quả) song song
  ├─ Step 3: Merge & deduplicate (normalize tên 20 ký tự đầu)
  ├─ Step 4: Chấm điểm mỗi sản phẩm:
  │           priceScore(30%) + qualityScore(30%) + popularityScore(20%)
  │         + warrantyScore(10%) + brandScore(10%) = total_score
  ├─ Step 5: Sort desc → Top 5 → Sinh báo cáo GPT (cache 1h)
  │
  [Response]
  └─ { results: [Top5], recommendation: "...", report: "..." }
```

---

## WF-V3-03: Luồng Thông báo

```
[Event trigger]                [NotificationService]         [Frontend]
      │                               │                          │
Order status changed ──────► createNotification()               │
Invoice overdue (9h cron) ──► createNotification()              │
Inventory LOW (daily) ───────► createNotification()             │
      │                        ├─ INSERT notifications table    │
      │                        └─ (future: push/email)          │
      │                                                   Poll /count 60s
      │                                                   Badge tăng ──►
      │                                                   User click bell
      │                                                   GET /notifications
      │                                                   PUT /read-all
```
