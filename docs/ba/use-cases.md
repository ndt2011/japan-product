# Use Cases

**Dự án**: Hệ thống quản lý hàng hóa Nhật-Việt  
**Phiên bản**: 1.0 | **Ngày**: 2026-06-07

---

## UC-101: Đăng nhập có lưu đăng nhập

**Actor**: Tất cả người dùng  
**Precondition**: User có tài khoản hợp lệ, chưa đăng nhập  
**Postcondition**: User đăng nhập thành công, có/không có persistent session

### Luồng chính
1. User mở trang login
2. User nhập email và mật khẩu
3. User chọn hoặc không chọn "Lưu đăng nhập"
4. User click "Đăng nhập"
5. Hệ thống xác thực thông tin
6. Hệ thống tạo token (24h hoặc 30 ngày tùy checkbox)
7. Hệ thống redirect đến dashboard theo role

### Luồng thay thế
- **5a** Sai mật khẩu: Hiển thị lỗi, tăng đếm sai lên 1
- **5b** Sai 5 lần: Khóa tài khoản, hiển thị M0103
- **5c** Tài khoản bị khóa thủ công: Hiển thị M0104, hướng dẫn liên hệ admin

---

## UC-201: AI tìm sản phẩm và gửi duyệt

**Actor**: VN_BRANCH_STAFF / VN_BRANCH_OWNER  
**Precondition**: Đã đăng nhập, có quyền AI_SEARCH  
**Postcondition**: Sản phẩm candidate được tạo với status PENDING

### Luồng chính
1. User vào màn hình "AI Tìm sản phẩm"
2. User nhập từ khóa (tên sản phẩm tiếng Nhật hoặc Việt)
3. User click "Tìm kiếm"
4. Hệ thống gửi query đến OpenAI GPT-4o
5. AI scrape Rakuten/Amazon JP, trả về tối đa 10 kết quả
6. Hệ thống hiển thị kết quả dạng card (tên JP, ảnh, giá JPY, link nguồn)
7. User tick ✓ sản phẩm muốn thêm
8. User click "Gửi duyệt"
9. Hệ thống tạo bản ghi `ai_product_candidates` với status PENDING
10. Hệ thống gửi notification cho JP Agency

### Luồng thay thế
- **5a** AI không tìm được kết quả: Hiển thị M0201, gợi ý từ khóa khác
- **5b** Timeout > 30s: Hiển thị M0202, cho retry
- **7a** User không chọn sản phẩm nào: Button "Gửi duyệt" bị disabled

---

## UC-202: JP Agency duyệt sản phẩm AI

**Actor**: JP_AGENCY_OWNER / JP_AGENCY_STAFF  
**Precondition**: Có ít nhất 1 ai_product_candidate với status PENDING  
**Postcondition**: Sản phẩm được APPROVED (vào products) hoặc REJECTED

### Luồng chính
1. JP Agency vào màn hình "Duyệt sản phẩm"
2. Hệ thống hiển thị danh sách PENDING
3. JP Agency click xem chi tiết 1 sản phẩm
4. JP Agency kiểm tra: tên JP, ảnh, giá, link gốc
5. JP Agency sửa tên VN, thêm mô tả, điều chỉnh giá nếu cần
6. JP Agency click "Duyệt"
7. Hệ thống tạo record trong `products` với status ACTIVE
8. Hệ thống cập nhật `ai_product_candidates` status = APPROVED

### Luồng thay thế
- **6a** JP Agency click "Từ chối": Hộp thoại nhập lý do → status = REJECTED
- **6b** Từ chối không có lý do: Validate, bắt nhập lý do tối thiểu 10 ký tự

---

## UC-301: Tạo và gửi đơn hàng

**Actor**: VN_BRANCH_STAFF / VN_BRANCH_OWNER  
**Precondition**: Có ít nhất 1 sản phẩm ACTIVE  
**Postcondition**: Đơn hàng được tạo với status PENDING

### Luồng chính
1. User vào "Tạo đơn hàng"
2. User tìm kiếm và chọn sản phẩm
3. User nhập số lượng cho từng sản phẩm
4. Hệ thống hiển thị tổng tiền JPY và VND real-time
5. User nhập ghi chú (nếu có)
6. User click "Gửi đơn"
7. Hệ thống validate: số lượng ≤ tồn kho, tất cả sản phẩm ACTIVE
8. Hệ thống tạo đơn hàng status PENDING, tạm giữ tồn kho
9. Hệ thống gửi email notification cho JP Agency

### Luồng thay thế
- **7a** Số lượng vượt tồn kho: Hiển thị cảnh báo, tô đỏ field
- **4a** User lưu nháp: Click "Lưu nháp" → status DRAFT, không tạm giữ tồn kho
- **7b** Sản phẩm vừa bị INACTIVE: Hiển thị lỗi M0301, yêu cầu xóa khỏi giỏ

---

## UC-401: Gom đơn vào chuyến hàng

**Actor**: JP_AGENCY_OWNER / JP_AGENCY_STAFF  
**Precondition**: Có ít nhất 1 đơn hàng CONFIRMED chưa vào chuyến nào  
**Postcondition**: Chuyến hàng được tạo, đơn hàng chuyển sang PROCESSING

### Luồng chính
1. JP Agency vào "Quản lý chuyến hàng"
2. Click "Tạo chuyến hàng mới"
3. Hệ thống hiển thị danh sách đơn CONFIRMED chưa có chuyến
4. JP Agency tick chọn các đơn muốn gom
5. JP Agency nhập: tên chuyến, logistics partner, estimated departure date
6. Click "Tạo chuyến"
7. Hệ thống tạo `shipment_batches` status PREPARING
8. Hệ thống cập nhật các đơn hàng status = PROCESSING
9. Email notification gửi cho VN Branch

### Luồng thay thế
- **4a** Không chọn đơn nào: Button "Tạo chuyến" disabled
- **5a** Thiếu thông tin bắt buộc: Validate highlight field lỗi

---

## UC-501: Cấu hình permission matrix

**Actor**: SUPER_ADMIN  
**Precondition**: Đăng nhập với role SUPER_ADMIN  
**Postcondition**: Permission matrix được cập nhật, áp dụng ngay

### Luồng chính
1. SUPER_ADMIN vào "Cấu hình phân quyền"
2. Hệ thống hiển thị bảng: rows = permissions, columns = roles
3. Ô được tích = role có quyền đó
4. SUPER_ADMIN toggle từng ô
5. Click "Lưu thay đổi"
6. Hệ thống lưu vào `role_permissions`
7. Permission cache được xóa, áp dụng ngay với request tiếp theo

### Luồng thay thế
- **4a** Cố tắt quyền của SUPER_ADMIN: Hệ thống không cho, hiển thị cảnh báo
- **5a** Click "Hủy": Reset về trạng thái ban đầu chưa lưu
