# BRD — Business Requirements Document

**Dự án**: Hệ thống quản lý hàng hóa Nhật-Việt  
**Phiên bản**: 1.0 | **Ngày**: 2026-06-07 | **Author**: PM/SA

---

## 1. Bối cảnh nghiệp vụ

Hiện tại, quy trình nhập khẩu thực phẩm chức năng Nhật Bản sang Việt Nam được thực hiện thủ công qua email, Zalo, và Excel. Điều này dẫn đến sai sót, chậm trễ, và không có khả năng kiểm soát tổng thể. Dự án này nhằm số hóa toàn bộ quy trình từ tìm kiếm sản phẩm đến giao hàng.

---

## 2. Yêu cầu nghiệp vụ

### BR-01 — Quản lý người dùng và phân quyền

| Mã | Yêu cầu |
|----|---------|
| BR-01-1 | Hệ thống hỗ trợ 5 role: SUPER_ADMIN, JP_AGENCY_OWNER, JP_AGENCY_STAFF, VN_BRANCH_OWNER, VN_BRANCH_STAFF |
| BR-01-2 | SUPER_ADMIN có thể cấu hình permission matrix (tắt/bật từng quyền theo role) |
| BR-01-3 | Có thể override permission cho từng user cụ thể |
| BR-01-4 | Mỗi user thuộc đúng một company (JP Agency hoặc VN Branch) |
| BR-01-5 | Chức năng "Lưu đăng nhập" (Remember Me) — duy trì session tối đa 30 ngày |
| BR-01-6 | Tài khoản bị khóa sau 5 lần đăng nhập sai liên tiếp |

### BR-02 — Quản lý sản phẩm

| Mã | Yêu cầu |
|----|---------|
| BR-02-1 | Sản phẩm có tên tiếng Nhật, tên tiếng Việt, mô tả, ảnh, giá JPY/VND |
| BR-02-2 | Hỗ trợ nhiều ảnh cho mỗi sản phẩm (ảnh chính + ảnh phụ) |
| BR-02-3 | Sản phẩm thuộc 1 danh mục, liên kết với 1 nhà cung cấp Nhật |
| BR-02-4 | Giá VND tự động tính từ giá JPY × tỷ giá hiện tại + % margin |
| BR-02-5 | Trạng thái sản phẩm: ACTIVE, INACTIVE, OUT_OF_STOCK, DISCONTINUED |

### BR-03 — AI Tìm kiếm sản phẩm

| Mã | Yêu cầu |
|----|---------|
| BR-03-1 | User nhập từ khóa tiếng Nhật/Việt → AI hiểu và tìm trên Rakuten/Amazon JP |
| BR-03-2 | Kết quả trả về: tên JP, ảnh, giá JPY, link nguồn, mô tả ngắn |
| BR-03-3 | User chọn (✓) sản phẩm muốn thêm → tạo bản ghi `ai_product_candidates` |
| BR-03-4 | Admin (JP_AGENCY_OWNER) duyệt → chuyển thành `products` chính thức |
| BR-03-5 | Giá JPY từ AI search được cập nhật vào sản phẩm tự động |

### BR-04 — Quản lý đơn hàng

| Mã | Yêu cầu |
|----|---------|
| BR-04-1 | VN_BRANCH_STAFF/OWNER tạo đơn hàng chọn sản phẩm + số lượng |
| BR-04-2 | Đơn hàng có trạng thái: DRAFT → PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED → CANCELLED |
| BR-04-3 | JP_AGENCY xác nhận đơn, có thể sửa giá/số lượng trước khi confirm |
| BR-04-4 | Hệ thống tự động tính tổng tiền JPY và VND theo tỷ giá tại thời điểm confirm |
| BR-04-5 | Thông báo email tự động khi trạng thái đơn thay đổi |

### BR-05 — Quản lý chuyến hàng (Shipment Batch)

| Mã | Yêu cầu |
|----|---------|
| BR-05-1 | Nhiều đơn hàng được gom vào 1 chuyến hàng (batch) |
| BR-05-2 | Chuyến hàng có trạng thái: PREPARING → CUSTOMS_JP → IN_TRANSIT → CUSTOMS_VN → DELIVERED |
| BR-05-3 | Lưu thông tin khai báo hải quan: số tờ khai, ngày khai báo, port xuất/nhập |
| BR-05-4 | Theo dõi tracking number từ công ty logistics |
| BR-05-5 | VN Branch chỉ xem chuyến hàng liên quan đến đơn của mình |

### BR-06 — Tỷ giá và định giá

| Mã | Yêu cầu |
|----|---------|
| BR-06-1 | Lưu lịch sử tỷ giá JPY/VND theo ngày |
| BR-06-2 | Tỷ giá mới nhất được dùng cho đơn hàng chưa confirm |
| BR-06-3 | Tỷ giá tại thời điểm confirm được lock cho đơn đó |
| BR-06-4 | SUPER_ADMIN có thể nhập tỷ giá thủ công hoặc lấy tự động từ API |

### BR-07 — Thông báo và Email

| Mã | Yêu cầu |
|----|---------|
| BR-07-1 | Email tự động khi: đơn hàng mới, đơn được confirm, chuyến hàng cập nhật |
| BR-07-2 | Template email quản lý bởi SUPER_ADMIN |
| BR-07-3 | Lưu lịch sử email đã gửi |

---

## 3. Yêu cầu phi chức năng

| Loại | Yêu cầu |
|------|---------|
| **Hiệu năng** | API response < 500ms cho 95% requests |
| **Bảo mật** | HTTPS, JWT auth, SQL injection prevention, XSS prevention |
| **Khả dụng** | Uptime 99% (Railway/Vercel SLA) |
| **Khả năng mở rộng** | Hỗ trợ tối thiểu 50 user đồng thời giai đoạn đầu |
| **Đa ngôn ngữ** | Giao diện tiếng Việt chính, hỗ trợ tiếng Nhật |
| **Responsive** | Desktop-first, mobile secondary |

---

## 4. Các bên liên quan

| Bên liên quan | Vai trò | Ảnh hưởng |
|---------------|---------|-----------|
| PM/SA Owner | Định hướng, phê duyệt yêu cầu | Cao |
| JP Agency Owner | Primary user | Cao |
| VN Branch Owner/Staff | Primary user | Cao |
| Backend Developer | Implement API | Trung bình |
| Frontend Developer | Implement UI | Trung bình |
| QA Engineer | Kiểm thử | Trung bình |

---

## Phần bổ sung V3 — Business Requirements (2026-06-08)

### BR-V3-001: Thông báo thời gian thực
- Hệ thống PHẢI gửi thông báo tự động khi: đơn hàng đổi trạng thái, hóa đơn quá hạn, tồn kho dưới ngưỡng.
- Thông báo PHẢI lưu vào database và hiện badge số chưa đọc trên header.
- User PHẢI có thể đánh dấu đọc từng thông báo hoặc tất cả cùng lúc.

### BR-V3-002: Quản lý tồn kho nâng cao
- Admin PHẢI có thể đặt ngưỡng cảnh báo tồn kho (min_stock_qty) cho từng bản ghi inventory.
- Hệ thống PHẢI tự động gán restock_status: NORMAL (≥ min), LOW (< min), CRITICAL (≤ min/2), ON_ORDER (đã đặt).
- Admin PHẢI có thể import hàng loạt bằng CSV với báo cáo lỗi từng dòng.

### BR-V3-003: Luồng đơn hàng đầy đủ
- Đơn hàng PHẢI đi qua đúng thứ tự: DRAFT → PENDING → APPROVED → PAID → SHIPPING → DELIVERED → COMPLETED.
- Admin PHẢI ghi nhận thanh toán trước khi nhập tracking. Branch PHẢI xác nhận nhận hàng trước khi auto-complete.
- Hệ thống PHẢI tự động chuyển DELIVERED → COMPLETED sau 24 giờ nếu không có khiếu nại.

### BR-V3-004: Dashboard tài chính
- Dashboard PHẢI hiển thị: doanh thu tháng, công nợ tổng, đơn chờ duyệt, tồn kho thấp.
- Biểu đồ doanh thu 30 ngày và cashflow 6 tháng PHẢI cập nhật theo thời gian thực.
- Dữ liệu hiển thị PHẢI phân quyền theo role (Admin xem full, Company xem limited).

### BR-V3-005: Giá 3 tầng
- Sản phẩm CÓ THỂ có 3 mức giá: cost_price_jpy (giá vốn), wholesale_price_vnd (giá buôn), retail_price_vnd (giá lẻ).
- Company và Branch CHỈ thấy giá bán phù hợp — không thấy giá vốn.
- Giá VND PHẢI được tính hoặc nhập thủ công, không tự động theo tỷ giá.

### BR-AI-001: AI Purchasing Specialist
- Hệ thống PHẢI hỗ trợ phân tích thu mua bằng tiếng Việt tự do.
- AI PHẢI tìm kiếm song song Rakuten (10 kết quả) và catalog nội bộ (5 kết quả).
- Mỗi sản phẩm PHẢI được chấm điểm 5 tiêu chí với trọng số: Giá 30%, Chất lượng 30%, Độ phổ biến 20%, Bảo hành 10%, Thương hiệu 10%.
- Kết quả PHẢI trả về Top 5, có đánh dấu khuyến nghị và báo cáo phân tích tiếng Việt.
- Báo cáo GPT PHẢI được cache 1 giờ để tiết kiệm chi phí API.
