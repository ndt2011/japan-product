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

---

## V3 — User Stories (2026-06-08)

### Thông báo hệ thống

| ID | Vai trò | Mô tả | Tiêu chí chấp nhận |
|----|---------|-------|-------------------|
| US-V3-101 | Tất cả user | Nhận thông báo khi đơn hàng thay đổi trạng thái | Bell badge tăng, dropdown hiện thông báo mới |
| US-V3-102 | Admin | Nhận thông báo khi hóa đơn sắp hoặc đã quá hạn | Thông báo OVERDUE hiện trong bell |
| US-V3-103 | Admin | Nhận thông báo khi tồn kho xuống dưới ngưỡng | Thông báo LOW/CRITICAL hiện kèm tên sản phẩm |
| US-V3-104 | Tất cả | Đánh dấu đã đọc từng thông báo hoặc tất cả | Badge giảm về 0 sau "Đọc tất cả" |

### Quản lý kho V3

| ID | Vai trò | Mô tả | Tiêu chí chấp nhận |
|----|---------|-------|-------------------|
| US-V3-201 | Admin | Xem danh sách tồn kho kèm badge NORMAL/LOW/CRITICAL/ON_ORDER | Badge màu đúng theo ngưỡng |
| US-V3-202 | Admin | Chỉnh sửa ngưỡng tồn kho, trạng thái tái nhập, ghi chú | PUT /inventories/{id} thành công |
| US-V3-203 | Admin | Xóa bản ghi inventory khi không còn sử dụng | Soft-delete, không hiện trong danh sách |
| US-V3-204 | Admin | Import hàng loạt tồn kho từ file CSV | Báo số dòng thành công + lỗi cụ thể |

### Dashboard V2

| ID | Vai trò | Mô tả | Tiêu chí chấp nhận |
|----|---------|-------|-------------------|
| US-V3-301 | Admin/Company | Xem KPI tài chính trên Dashboard: doanh thu, công nợ, tồn kho thấp | Hiện đúng số liệu thực tế |
| US-V3-302 | Admin | Xem biểu đồ doanh thu 30 ngày và cashflow 6 tháng | Chart render đúng dữ liệu từ API |

### Đơn hàng V3

| ID | Vai trò | Mô tả | Tiêu chí chấp nhận |
|----|---------|-------|-------------------|
| US-V3-401 | Admin | Ghi nhận thanh toán (APPROVED → PAID) | Status chuyển đúng, thông báo gửi |
| US-V3-402 | Admin | Nhập tracking URL (PAID → SHIPPING) | Tracking URL lưu, hiển thị trong chi tiết |
| US-V3-403 | Branch | Xác nhận đã nhận hàng (SHIPPING → DELIVERED → COMPLETED) | Auto-complete sau 24h |

### Hồ sơ

| ID | Vai trò | Mô tả | Tiêu chí chấp nhận |
|----|---------|-------|-------------------|
| US-V3-501 | Tất cả | Xem và sửa thông tin profile: tên, SĐT, avatar URL | PUT /profile thành công |
| US-V3-502 | Tất cả | Đổi mật khẩu với xác thực mật khẩu cũ | Token không hết hiệu lực khi đổi |

---

## AI Purchasing Specialist — User Stories

| ID | Vai trò | Mô tả | Tiêu chí chấp nhận |
|----|---------|-------|-------------------|
| US-AI-001 | Admin/Company | Nhập yêu cầu thu mua bằng tiếng Việt tự do | AI hiểu và trả về kết quả liên quan |
| US-AI-002 | Admin/Company | Xem Top 5 sản phẩm được chấm điểm 5 tiêu chí | Điểm total đúng theo công thức weighted |
| US-AI-003 | Admin/Company | Biết sản phẩm nào được AI khuyến nghị nhất | Badge ⭐ "Khuyến nghị" trên rank 1 |
| US-AI-004 | Admin/Company | Nhập ngân sách JPY và số lượng để lọc kết quả | Kết quả phù hợp ngân sách |
| US-AI-005 | Admin/Company | Đọc báo cáo phân tích tiếng Việt từ AI | Báo cáo rõ ràng, cache 1h |
| US-AI-006 | Admin/Company | Click link xem sản phẩm trực tiếp trên Rakuten | Link mở đúng trang sản phẩm JP |
