# Vision — Hệ Thống Quản Lý Hàng Hóa Nhật-Việt

**Phiên bản**: 1.0  
**Ngày**: 2026-06-07  
**Author**: PM/SA

---

## 1. Mục tiêu dự án

Xây dựng nền tảng B2B số hóa toàn bộ quy trình nhập khẩu và phân phối thực phẩm chức năng Nhật Bản sang Việt Nam, từ khâu tìm kiếm sản phẩm bằng AI, quản lý đơn hàng, đến theo dõi chuyến hàng và khai báo hải quan.

**Mục tiêu cụ thể**:
- Giảm 70% thời gian tìm kiếm và cập nhật giá sản phẩm từ thị trường Nhật
- Chuẩn hóa quy trình đặt hàng giữa đại lý Nhật và chi nhánh Việt Nam
- Tập trung hóa dữ liệu hàng hóa, tồn kho, và vận chuyển vào một hệ thống
- Cung cấp khả năng phân quyền linh hoạt theo cấu trúc tổ chức đa cấp

---

## 2. Vấn đề cần giải quyết

| # | Vấn đề hiện tại | Hệ quả |
|---|-----------------|--------|
| 1 | Tìm kiếm sản phẩm thủ công qua nhiều website Nhật (Rakuten, Amazon JP...) | Tốn thời gian, dễ bỏ sót sản phẩm mới, giá không cập nhật |
| 2 | Trao đổi đơn hàng qua email/Zalo | Dễ nhầm lẫn, không có lịch sử, khó theo dõi |
| 3 | Không có hệ thống quản lý chuyến hàng | Không biết hàng đang ở đâu trong chuỗi JP→VN |
| 4 | Phân quyền không rõ ràng | Staff có thể xem/sửa dữ liệu không thuộc phạm vi |
| 5 | Dữ liệu phân tán (Excel, Zalo, email) | Không có báo cáo tổng hợp, khó kiểm soát |
| 6 | Tỷ giá JPY/VND cập nhật thủ công | Sai sót trong định giá cho khách |

---

## 3. Đối tượng sử dụng

### Primary Users

| Role | Mô tả | Nhu cầu chính |
|------|-------|---------------|
| **SUPER_ADMIN** | Admin vận hành hệ thống | Quản lý toàn bộ, cấu hình phân quyền, xem báo cáo tổng |
| **JP_AGENCY_OWNER** | Chủ đại lý bên Nhật Bản | Quản lý sản phẩm, duyệt đơn, quản lý chuyến hàng |
| **JP_AGENCY_STAFF** | Nhân viên đại lý Nhật | Xử lý đơn hàng, nhập thông tin hải quan |
| **VN_BRANCH_OWNER** | Chủ chi nhánh Việt Nam | Xem tổng quan chi nhánh, quản lý staff |
| **VN_BRANCH_STAFF** | Nhân viên chi nhánh VN | Tìm sản phẩm, tạo đơn hàng, theo dõi chuyến hàng |

### Secondary Users
- Kế toán: Xem báo cáo tài chính, tỷ giá
- Khách hàng cuối (Phase 2): Xem catalog sản phẩm qua website public

---

## 4. Phạm vi dự án

### Trong phạm vi (In Scope)

**Phase 1 — MVP** (Tháng 1-4):
- Xác thực và phân quyền (5 roles + permission matrix)
- Quản lý danh mục sản phẩm (CRUD + ảnh)
- AI tìm kiếm sản phẩm từ Rakuten/Amazon JP
- Quản lý đơn hàng (tạo/sửa/duyệt)
- Quản lý chuyến hàng (batch ordering JP→VN)
- Tỷ giá JPY/VND tự động cập nhật
- Thông báo email tự động

**Phase 2 — Extended** (Tháng 5-8):
- Báo cáo & dashboard thống kê
- Website catalog công khai
- Khai báo hải quan điện tử
- App mobile (PWA)

**Phase 3 — Scale** (Tháng 9+):
- Tích hợp thêm nguồn sản phẩm (Yahoo Shopping, Yodobashi...)
- Hệ thống kho vật lý
- EDI với đối tác logistics

### Ngoài phạm vi (Out of Scope)

- Thanh toán online (dùng chuyển khoản ngoài hệ thống)
- Phần mềm kế toán (tích hợp sau)
- Logistics vận chuyển nội địa VN
- Hệ thống POS bán lẻ

---

## 5. Chỉ số thành công (KPIs)

| KPI | Baseline | Mục tiêu Phase 1 |
|-----|----------|-----------------|
| Thời gian tìm sản phẩm | ~2h/ngày | <30 phút/ngày |
| Tỷ lệ lỗi đơn hàng | ~15% | <3% |
| Thời gian xử lý đơn | 2-3 ngày | <24 giờ |
| Khả năng theo dõi chuyến hàng | 0% | 100% |
| Số chi nhánh có thể quản lý | 1-2 | Không giới hạn |

---

## 6. Ràng buộc và giả định

**Ràng buộc**:
- Ngân sách server: ~3,000円/tháng (test), ~5,000円/tháng (production)
- Team nhỏ: 1 Backend + 1 Frontend + 1 PM/SA
- Dữ liệu sản phẩm từ web scraping (không có API chính thức của Rakuten/Amazon)

**Giả định**:
- Người dùng sử dụng máy tính (desktop-first, mobile secondary)
- Kết nối internet ổn định (VN và JP)
- Admin sẽ duyệt sản phẩm AI tìm được trước khi đưa vào hệ thống
- Tỷ giá JPY/VND lấy từ API công khai (ExchangeRate-API hoặc tương đương)
