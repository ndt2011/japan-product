# Acceptance Criteria — Tiêu chí nghiệm thu

**Dự án**: Hệ thống quản lý hàng hóa Nhật-Việt  
**Phiên bản**: 1.0 | **Ngày**: 2026-06-07

> Mỗi User Story chỉ được coi là **Done** khi TẤT CẢ tiêu chí dưới đây pass.

---

## US-101 + US-102: Đăng nhập & Lưu đăng nhập

- [ ] Đăng nhập thành công với email + password đúng → redirect đúng dashboard theo role
- [ ] Hiển thị lỗi rõ ràng khi sai thông tin (không tiết lộ email hay password cái nào sai)
- [ ] Sau 5 lần sai → tài khoản bị khóa tự động 30 phút
- [ ] Checkbox "Lưu đăng nhập" hiển thị trên form, mặc định không tích
- [ ] Tích "Lưu đăng nhập" → sau 25 ngày vẫn còn đăng nhập (token 30 ngày)
- [ ] Không tích → sau 25 giờ token hết hạn, redirect về login
- [ ] Đăng xuất → token bị revoke, không thể dùng token cũ để gọi API

---

## US-201: AI Tìm sản phẩm

- [ ] Nhập từ khóa → kết quả trả về trong vòng 30 giây
- [ ] Mỗi kết quả hiển thị: ảnh sản phẩm, tên tiếng Nhật, giá JPY, link gốc
- [ ] Khi không có kết quả → hiển thị message thân thiện (không crash)
- [ ] Chọn ít nhất 1 sản phẩm → button "Gửi duyệt" active
- [ ] Sau khi gửi duyệt → thông báo thành công, số lượng pending candidate tăng

---

## US-202: Duyệt sản phẩm AI

- [ ] Danh sách chỉ hiển thị candidate status=PENDING
- [ ] JP Agency sửa được tên VN và giá trước khi duyệt
- [ ] Duyệt → sản phẩm xuất hiện trong catalog với status ACTIVE
- [ ] Từ chối bắt buộc nhập lý do (≥ 10 ký tự)
- [ ] Từ chối → candidate không hiển thị trong danh sách PENDING nữa

---

## US-203: CRUD Sản phẩm

- [ ] Tạo sản phẩm không có ảnh chính → validation error
- [ ] SKU trùng → validation error với message rõ ràng
- [ ] Xóa sản phẩm → soft delete, sản phẩm không hiển thị nhưng dữ liệu vẫn còn trong DB
- [ ] Giá VND = Giá JPY × tỷ giá × (1 + margin), làm tròn lên 1,000 VND

---

## US-301 + US-302: Đặt hàng & Confirm

- [ ] Tạo đơn → tổng tiền JPY và VND hiển thị real-time khi thay đổi số lượng
- [ ] Số lượng vượt tồn kho → không cho tạo đơn, hiển thị cảnh báo cụ thể
- [ ] Đơn DRAFT → tồn kho không bị ảnh hưởng
- [ ] Đơn PENDING → tồn kho bị tạm giữ ngay
- [ ] JP confirm đơn → tỷ giá bị lock, ghi vào trường `locked_rate`
- [ ] Thay đổi tỷ giá sau khi confirm → đơn cũ không bị ảnh hưởng
- [ ] Email gửi đúng người: tạo đơn → JP Agency, confirm → VN Branch

---

## US-401 + US-402: Chuyến hàng

- [ ] Chỉ đơn CONFIRMED mới được gom vào batch
- [ ] Một đơn không thể thuộc 2 batch cùng lúc
- [ ] Khi batch = DELIVERED → tất cả đơn trong batch → DELIVERED tự động
- [ ] VN Branch chỉ xem được batch có đơn của branch mình

---

## US-501: Quản lý người dùng

- [ ] SUPER_ADMIN tạo user mới → user nhận email hướng dẫn đặt mật khẩu
- [ ] Khóa user → user không thể login ngay lập tức (không cần restart)
- [ ] Reset mật khẩu → email gửi link reset, link hết hạn sau 24 giờ

---

## US-502: Cấu hình phân quyền

- [ ] Bảng permission matrix hiển thị đủ rows và columns
- [ ] Toggle permission → thay đổi có hiệu lực với request tiếp theo (không cần logout/login lại)
- [ ] Không thể tắt quyền của SUPER_ADMIN (UI disable hoặc API reject)

---

## Tiêu chí chung (áp dụng cho mọi US)

- [ ] API response time < 500ms cho 95% requests trong điều kiện bình thường
- [ ] Không có lỗi console (JS errors) trên frontend
- [ ] Tất cả form có validation rõ ràng, message theo `06_Hằng_số_thông_báo.xlsx`
- [ ] Giao diện responsive (desktop 1280px trở lên không bị vỡ layout)
- [ ] Không có dữ liệu của company/branch khác bị lọt qua
