# User Stories

**Dự án**: Hệ thống quản lý hàng hóa Nhật-Việt  
**Phiên bản**: 1.0 | **Ngày**: 2026-06-07

---

## Module 1 — Xác thực (Auth)

### US-101: Đăng nhập
> **Là** người dùng, **tôi muốn** đăng nhập bằng email và mật khẩu, **để** truy cập hệ thống theo quyền của mình.

**Acceptance Criteria:**
- Email + password hợp lệ → redirect đến dashboard theo role
- Sai thông tin → hiển thị lỗi M0102
- Sai 5 lần liên tiếp → khóa tài khoản 30 phút
- Tích "Lưu đăng nhập" → token có hiệu lực 30 ngày
- Không tích → token hết hạn sau 24 giờ

**Priority**: P0 — Must Have  
**Estimate**: 3 points

---

### US-102: Lưu đăng nhập (Remember Me)
> **Là** người dùng thường xuyên, **tôi muốn** chọn "Lưu đăng nhập", **để** không phải đăng nhập lại mỗi ngày.

**Acceptance Criteria:**
- Checkbox "Lưu đăng nhập" hiển thị trên form login
- Khi tích: token lưu trong cookie httpOnly, hết hạn 30 ngày
- Khi không tích: token session-based (mất khi đóng browser)
- Đăng xuất thủ công xóa cookie ngay lập tức
- Thiết bị mới yêu cầu đăng nhập lại (không dùng chung token)

**Priority**: P1 — Should Have  
**Estimate**: 2 points

---

### US-103: Đăng xuất
> **Là** người dùng, **tôi muốn** đăng xuất, **để** bảo mật tài khoản.

**Acceptance Criteria:**
- Click "Đăng xuất" → xóa token, redirect về trang login
- Token bị revoke ngay tại server

**Priority**: P0 | **Estimate**: 1 point

---

## Module 2 — Sản phẩm

### US-201: AI tìm kiếm sản phẩm
> **Là** VN_BRANCH_STAFF, **tôi muốn** nhập từ khóa và để AI tìm sản phẩm từ Nhật, **để** nhanh chóng thêm sản phẩm mới mà không cần tìm thủ công.

**Acceptance Criteria:**
- Nhập từ khóa → hiển thị loading → trả về danh sách sản phẩm (tối đa 10)
- Mỗi kết quả: tên JP, ảnh, giá JPY, link nguồn
- User tick ✓ sản phẩm muốn thêm → tạo `ai_product_candidates` với status PENDING
- Nếu AI không tìm được → hiển thị M0201

**Priority**: P0 | **Estimate**: 8 points

---

### US-202: Duyệt sản phẩm từ AI
> **Là** JP_AGENCY_OWNER, **tôi muốn** xem và duyệt sản phẩm do AI tìm, **để** kiểm soát chất lượng trước khi đưa vào catalog.

**Acceptance Criteria:**
- Xem danh sách sản phẩm đang chờ duyệt (PENDING)
- Xem chi tiết: tên, ảnh, giá JPY, link gốc
- Có thể sửa tên VN, thêm mô tả VN, điều chỉnh giá
- Duyệt → status APPROVED, tạo record trong bảng `products`
- Từ chối → status REJECTED, ghi lý do

**Priority**: P0 | **Estimate**: 5 points

---

### US-203: Quản lý sản phẩm (CRUD)
> **Là** JP_AGENCY_OWNER/STAFF, **tôi muốn** thêm/sửa/xóa sản phẩm, **để** duy trì catalog hàng hóa chính xác.

**Acceptance Criteria:**
- Tạo sản phẩm: tên JP, tên VN, danh mục, nhà cung cấp, giá JPY, ảnh
- Sửa: tất cả thông tin, thêm/xóa ảnh phụ
- Xóa mềm (soft delete), không xóa cứng
- Lọc theo: danh mục, trạng thái, nhà cung cấp

**Priority**: P0 | **Estimate**: 5 points

---

### US-204: Xem catalog sản phẩm
> **Là** VN_BRANCH_STAFF, **tôi muốn** xem danh sách sản phẩm có sẵn, **để** chọn sản phẩm khi tạo đơn hàng.

**Acceptance Criteria:**
- Xem danh sách sản phẩm ACTIVE
- Tìm kiếm theo tên JP/VN
- Xem giá VND tự động tính theo tỷ giá hiện tại
- Xem số lượng tồn kho

**Priority**: P0 | **Estimate**: 3 points

---

## Module 3 — Đơn hàng

### US-301: Tạo đơn hàng
> **Là** VN_BRANCH_STAFF, **tôi muốn** tạo đơn hàng chọn nhiều sản phẩm, **để** yêu cầu nhập hàng từ Nhật.

**Acceptance Criteria:**
- Chọn sản phẩm + số lượng → thêm vào giỏ
- Xem tổng tiền JPY và VND real-time
- Lưu nháp (DRAFT) hoặc gửi ngay (PENDING)
- Không thể đặt quá số lượng tồn kho

**Priority**: P0 | **Estimate**: 5 points

---

### US-302: Xác nhận đơn hàng
> **Là** JP_AGENCY_OWNER/STAFF, **tôi muốn** xem và xác nhận đơn từ VN, **để** bắt đầu chuẩn bị hàng.

**Acceptance Criteria:**
- Xem danh sách đơn PENDING
- Xem chi tiết: sản phẩm, số lượng, giá, branch đặt
- Confirm → status CONFIRMED, lock tỷ giá hiện tại
- Có thể sửa số lượng trước khi confirm (cần note lý do)
- Email tự động gửi VN Branch khi confirm

**Priority**: P0 | **Estimate**: 4 points

---

### US-303: Theo dõi trạng thái đơn hàng
> **Là** VN_BRANCH_STAFF, **tôi muốn** xem trạng thái đơn hàng, **để** biết tiến độ đơn của mình.

**Acceptance Criteria:**
- Xem timeline trạng thái đơn hàng
- Nhận email notification khi trạng thái thay đổi
- Lọc đơn theo trạng thái, ngày tạo

**Priority**: P0 | **Estimate**: 2 points

---

## Module 4 — Chuyến hàng

### US-401: Tạo chuyến hàng
> **Là** JP_AGENCY_OWNER/STAFF, **tôi muốn** gom các đơn hàng vào một chuyến, **để** quản lý vận chuyển theo lô.

**Acceptance Criteria:**
- Chọn nhiều đơn hàng CONFIRMED để gom vào 1 batch
- Nhập thông tin chuyến: ngày xuất, logistics partner, tracking number
- Tạo batch → status PREPARING
- Các đơn trong batch chuyển sang PROCESSING

**Priority**: P0 | **Estimate**: 5 points

---

### US-402: Cập nhật trạng thái chuyến hàng
> **Là** JP_AGENCY_STAFF, **tôi muốn** cập nhật trạng thái chuyến hàng, **để** VN Branch theo dõi được hàng đang ở đâu.

**Acceptance Criteria:**
- Cập nhật status: PREPARING → CUSTOMS_JP → IN_TRANSIT → CUSTOMS_VN → DELIVERED
- Nhập thông tin hải quan JP: số tờ khai, ngày khai báo
- Nhập thông tin hải quan VN (khi hàng về VN)
- Email tự động khi trạng thái thay đổi

**Priority**: P0 | **Estimate**: 3 points

---

## Module 5 — Quản trị

### US-501: Quản lý người dùng
> **Là** SUPER_ADMIN, **tôi muốn** tạo/sửa/khóa tài khoản, **để** kiểm soát ai truy cập hệ thống.

**Acceptance Criteria:**
- CRUD tài khoản: email, tên, role, company, trạng thái
- Reset mật khẩu gửi email
- Khóa/mở khóa tài khoản
- Xem lịch sử đăng nhập

**Priority**: P0 | **Estimate**: 4 points

---

### US-502: Cấu hình phân quyền
> **Là** SUPER_ADMIN, **tôi muốn** cấu hình permission matrix, **để** kiểm soát quyền truy cập theo role.

**Acceptance Criteria:**
- Giao diện bảng: rows = permissions, columns = roles
- Toggle từng ô để bật/tắt quyền
- Override cho user cụ thể
- Thay đổi có hiệu lực ngay không cần restart

**Priority**: P1 | **Estimate**: 6 points
