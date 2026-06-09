# Product Roadmap

**Dự án**: Hệ thống quản lý hàng hóa Nhật-Việt  
**Phiên bản**: 1.2 | **Ngày**: 2026-06-08

> **Tiến độ thực tế**: [docs/tasks/STATUS.md](../tasks/STATUS.md) — MVP + Phase 2 ~95% · V3 planning ✅

---

## Tổng quan lộ trình

```
Phase 1 — MVP          Phase 2 — Extended       V3 Upgrades         Phase 3 — Scale
[2026-06 → 2026-09]    [2026-10 → 2027-01]      [2026-06 sprint]    [2027-02 →]
         │                      │                      │                   │
   Auth + RBAC           Báo cáo tổng hợp       Order flow mới      Mobile App (PWA)
   Sản phẩm + AI ✅      Website catalog         AI Purchasing       Multi-supplier
   Đơn hàng ✅           HQ điện tử              Notification        ERP Integration
   Chuyến hàng ✅        Email nâng cao           Dashboard V2        Warehouse mgmt
   Invoice + Profit ✅   CI/CD Production         Mobile responsive
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

**Deliverable Phase 1**: Hệ thống live — **hiện tại staging Railway + Vercel** (ConoHa prod M8)

**Tiến độ Phase 1 (2026-06-08)**: S1–S5 ✅ · S6 Dashboard ✅ · Staging live ✅

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

## V3 Upgrades — Sprint (2026-06-08 → 2026-06-09)

**Mục tiêu**: 14 cải tiến UX/nghiệp vụ sau khi staging live  
**Tiến độ thực tế (2026-06-09)**: ✅ ~95% code local · ⏳ Chờ push main + OPS staging

> Phân tích chi tiết: `docs/sa/amendments/upgrade-v3-analysis.md`  
> Backlog: `docs/pm/backlog.md` — Phase 3 V3 Upgrades  
> OPS tasks: `docs/tasks/devops-tasks.md` (DO-013~019)

| Nhóm | Scope | Sprint | Tiến độ |
|------|-------|--------|---------|
| G1 — Critical | Order flow, Pricing, Inventory, Notifications | V3-G1 | ✅ ~97% (thiếu scheduler BE-V3-018) |
| G2 — Important | Dashboard V2, Product UX, Master Data, Profile | V3-G2 | ✅ ~92% (thiếu avatar R2, suppliers CRUD) |
| G3 — Enhancement | Mobile responsive, Form validation, AI diagram | V3-G3 | ✅ 100% |
| AI-P | AI Purchasing Specialist | Sprint AI-P | ✅ ~90% (thiếu History page, OPENAI key OPS) |
| **INV** | **StockIn autocomplete + warehouse fix** | **Hotfix** | **✅ 100% (2026-06-09)** |

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
