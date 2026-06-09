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

## UC-V3-101: Xem và đọc thông báo (V3)

**Actor**: Branch Manager / Branch Staff / JP Agency  
**Precondition**: Đã đăng nhập, có thông báo chưa đọc  
**Postcondition**: Thông báo được đánh dấu đã đọc

### Luồng chính
1. User thấy badge số đỏ trên bell icon header
2. Click bell → dropdown hiển thị 10 thông báo gần nhất (type icon + nội dung + timestamp)
3. Click vào 1 thông báo → `read_at` được set, badge giảm 1
4. Click "Đọc tất cả" → toàn bộ `read_at` được set, badge = 0

### Luồng thay thế
- **2a** Không có thông báo: Dropdown hiển thị "Không có thông báo mới"
- **3a** Thông báo liên kết đến đơn hàng: Click → navigate đến trang đơn hàng đó

---

## UC-V3-201: Nhập kho CSV bulk import (V3)

**Actor**: Admin / JP Agency  
**Precondition**: Đã có file CSV đúng định dạng  
**Postcondition**: Tồn kho được cập nhật, báo cáo import hiển thị

### Luồng chính
1. Vào trang Kho hàng → Click "📥 Import CSV"
2. Modal hiển thị: format mẫu + nút upload
3. Chọn file `.csv` (tối đa 2MB)
4. Click "Import"
5. Hệ thống parse từng dòng, gọi `stockIn()` cho dòng hợp lệ
6. Hiển thị kết quả: `imported X dòng / errors Y dòng`

### Luồng thay thế
- **3a** File không phải .csv: HTTP 422, thông báo lỗi định dạng
- **5a** Dòng thiếu `product_cd` hoặc `warehouse_id`: bỏ qua dòng đó, ghi vào errors, tiếp tục
- **6a** Không có dòng nào hợp lệ: `imported = 0`, hiển thị toàn bộ errors

---

## UC-V3-202: Nhập kho thủ công (V3)

**Actor**: Admin / JP Agency  
**Precondition**: Biết sản phẩm cần nhập  
**Postcondition**: Stock movement IN được tạo, tồn kho tăng

### Luồng chính
1. Vào "Phiếu Nhập Kho"
2. Gõ tên/mã sản phẩm vào ô tìm kiếm → dropdown gợi ý xuất hiện
3. Chọn sản phẩm → ID được lưu ngầm
4. Chọn kho, nhập số lượng, nhập lý do (optional)
5. Click "Nhập kho"
6. Hệ thống gọi `POST /stock-movements {movement_type: IN}`, lịch sử cập nhật

### Luồng thay thế
- **2a** Gõ < 2 ký tự: dropdown không xuất hiện
- **2b** Không tìm thấy sản phẩm: hiển thị "Không tìm thấy sản phẩm"
- **4a** Số lượng ≤ 0: validation error

---

## UC-V3-301: Xem Dashboard tài chính (V3)

**Actor**: Admin / JP Agency  
**Precondition**: Có dữ liệu đơn hàng  
**Postcondition**: Dashboard hiển thị KPI + biểu đồ

### Luồng chính
1. Vào Dashboard → Tab "Doanh thu"
2. Hệ thống load KPI cards: tổng đơn, công nợ, SP tồn kho thấp, doanh thu tháng
3. Biểu đồ Revenue (JPY/VND) theo tháng hiển thị
4. Tab "Cashflow" → biểu đồ In/Out/Net 12 tháng
5. Tỷ giá hiện tại hiển thị góc phải, Admin có thể chỉnh inline

### Luồng thay thế
- **1a** Branch Manager: chỉ thấy số liệu của branch mình
- **3a** Không có dữ liệu tháng này: biểu đồ hiển thị 0, không lỗi

---

## UC-V3-401: Luồng đơn hàng đầy đủ V3 (V3)

**Actor**: JP Agency (approve/pay/ship) · VN Branch (confirm receipt)  
**Precondition**: Đơn hàng đã CONFIRMED  
**Postcondition**: Đơn COMPLETED, kho được cập nhật

### Luồng chính
1. JP Agency Approve đơn CONFIRMED → status = APPROVED
2. JP Agency đánh dấu Paid → status = PAID, `locked_rate` ghi DB
3. JP Agency Mark Shipped → status = SHIPPING
4. Batch DELIVERED → đơn = DELIVERED_ADMIN, kho VN +stockIn tự động
5. VN Branch nhấn "Đã nhận hàng" → status = COMPLETED, kho -stockOut tự động

### Luồng thay thế
- **Bất kỳ bước nào** skip: HTTP 422, "Không thể chuyển trạng thái"

---

## UC-V3-501: Cập nhật hồ sơ tài khoản (V3)

**Actor**: Tất cả user đã đăng nhập  
**Precondition**: Đã đăng nhập  
**Postcondition**: Thông tin profile được cập nhật

### Luồng chính
1. Vào "/profile"
2. Hệ thống load: tên, email (readonly), phone, avatar_url
3. User sửa tên / phone / avatar URL
4. Click "Lưu" → `PUT /profile`
5. Toast xác nhận thành công

### Luồng thay thế
- **3a** Nhập phone có chữ: validation error "Số điện thoại không hợp lệ"
- **3b** Cố sửa email qua DevTools: field ignored, email không thay đổi

---

## UC-AI-001: Phân tích AI Purchasing (V3/AI)

**Actor**: Admin / JP Agency  
**Precondition**: OPENAI_API_KEY đã được set, có danh sách sản phẩm  
**Postcondition**: Kết quả gợi ý mua hàng với AI score hiển thị

### Luồng chính
1. Vào "AI Purchasing" từ menu
2. Chọn/nhập danh sách sản phẩm cần phân tích
3. Click "Phân tích AI"
4. Hệ thống gọi `POST /ai/purchasing`, chờ ≤ 15s
5. Kết quả hiển thị: danh sách sắp xếp theo ai_score giảm dần
6. Mỗi sản phẩm: ScoreBar với 5 tiêu chí + text giải thích

### Luồng thay thế
- **1a** VN Branch Staff: HTTP 403
- **4a** OPENAI_API_KEY chưa set: thông báo "AI service chưa được cấu hình"
- **4b** Timeout > 15s: thông báo lỗi kết nối AI

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
