# Product Roadmap

**Dự án**: Hệ thống quản lý hàng hóa Nhật-Việt  
**Phiên bản**: 1.0 | **Ngày**: 2026-06-07

---

## Tổng quan lộ trình

```
Phase 1 — MVP          Phase 2 — Extended       Phase 3 — Scale
[2026-06 → 2026-09]    [2026-10 → 2027-01]      [2027-02 →]
         │                      │                      │
   Auth + RBAC           Báo cáo tổng hợp       Mobile App (PWA)
   Sản phẩm + AI         Website catalog         Multi-supplier
   Đơn hàng              HQ điện tử              ERP Integration
   Chuyến hàng           Email nâng cao           Warehouse mgmt
   Deploy cơ bản         CI/CD Production
```

---

## Phase 1 — MVP (Tháng 6–9/2026)

**Mục tiêu**: Hệ thống hoạt động cơ bản cho 1 JP Agency + 2-3 VN Branch

| Sprint | Thời gian | Nội dung |
|--------|-----------|---------|
| Sprint 1 | 06/2026 W3-W4 | Auth, RBAC, User Management |
| Sprint 2 | 07/2026 W1-W2 | Quản lý sản phẩm (CRUD + ảnh) |
| Sprint 3 | 07/2026 W3-W4 | AI tìm kiếm sản phẩm |
| Sprint 4 | 08/2026 W1-W2 | Quản lý đơn hàng |
| Sprint 5 | 08/2026 W3-W4 | Chuyến hàng + theo dõi |
| Sprint 6 | 09/2026 W1-W2 | Tỷ giá + Email notification |
| Sprint 7 | 09/2026 W3-W4 | Bug fix, UAT, Deploy production |

**Deliverable Phase 1**: Hệ thống live trên ConoHa VPS, team sử dụng thực tế

---

## Phase 2 — Extended (Tháng 10/2026 – 1/2027)

**Mục tiêu**: Mở rộng tính năng và cải thiện trải nghiệm

| Feature | Ưu tiên | Thời gian dự kiến |
|---------|---------|------------------|
| Dashboard & báo cáo (doanh thu, tồn kho, đơn hàng) | P1 | Tháng 10/2026 |
| Website catalog công khai (xem SP không cần đăng nhập) | P1 | Tháng 11/2026 |
| Khai báo hải quan điện tử | P1 | Tháng 12/2026 |
| Email template editor (WYSIWYG) | P2 | Tháng 1/2027 |
| Tích hợp thêm nguồn scraping (Yahoo Shopping) | P2 | Tháng 1/2027 |

---

## Phase 3 — Scale (Từ tháng 2/2027)

**Mục tiêu**: Nền tảng scalable, hỗ trợ nhiều agency và chi nhánh

| Feature | Ghi chú |
|---------|---------|
| Progressive Web App (PWA) | Mobile-first cho VN Branch staff |
| Multi JP Agency support | Nhiều đại lý Nhật trong cùng hệ thống |
| ERP / Kế toán integration | Kết nối phần mềm kế toán VN |
| Warehouse management | Quản lý kho vật lý, barcode |
| B2C Module | Đặt hàng trực tiếp từ khách hàng cuối |

---

## Rủi ro và biện pháp

| Rủi ro | Mức độ | Biện pháp |
|--------|--------|-----------|
| Rakuten/Amazon block scraping | Cao | Rotate IP, dùng headless browser, có kế hoạch dự phòng |
| OpenAI API chi phí tăng | Trung bình | Cache kết quả AI, giới hạn request/user/ngày |
| Team thiếu nhân lực | Trung bình | Focus MVP, defer Phase 2 features nếu cần |
| Thay đổi quy định nhập khẩu VN-JP | Thấp | Thiết kế flexible fields cho khai báo HQ |
