# Business Rules

**Dự án**: Hệ thống quản lý hàng hóa Nhật-Việt  
**Phiên bản**: 1.2 | **Ngày**: 2026-06-09 (thêm V3 + AI Purchasing rules)

---

## RULE-AUTH — Xác thực

| Mã | Quy tắc | Ưu tiên |
|----|---------|---------|
| RULE-AUTH-01 | Mật khẩu tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số | P0 |
| RULE-AUTH-02 | Sai mật khẩu 5 lần liên tiếp → khóa tài khoản tự động 30 phút | P0 |
| RULE-AUTH-03 | Token thường: hết hạn sau 24 giờ kể từ lần cuối hoạt động | P0 |
| RULE-AUTH-04 | Token "Lưu đăng nhập": hết hạn sau 30 ngày kể từ lần login | P1 |
| RULE-AUTH-05 | Một user chỉ có tối đa 5 phiên đăng nhập đồng thời (giới hạn thiết bị) | P1 |
| RULE-AUTH-06 | Đăng xuất thu hồi token ngay tại server (blacklist) | P0 |

---

## RULE-PERM — Phân quyền

| Mã | Quy tắc | Ưu tiên |
|----|---------|---------|
| RULE-PERM-01 | Mỗi user có đúng 1 role chính | P0 |
| RULE-PERM-02 | SUPER_ADMIN có tất cả quyền, không thể bị giới hạn | P0 |
| RULE-PERM-03 | Permission matrix được cấu hình theo role, áp dụng cho tất cả user của role đó | P0 |
| RULE-PERM-04 | User permission override được ưu tiên hơn role permission | P1 |
| RULE-PERM-05 | JP Agency chỉ xem dữ liệu của company mình | P0 |
| RULE-PERM-06 | VN Branch chỉ xem dữ liệu của branch mình | P0 |

---

## RULE-PROD — Sản phẩm

| Mã | Quy tắc | Ưu tiên |
|----|---------|---------|
| RULE-PROD-01 | Sản phẩm phải có ít nhất 1 ảnh chính | P0 |
| RULE-PROD-02 | SKU (mã hàng) phải duy nhất trong hệ thống | P0 |
| RULE-PROD-03 | Giá VND = Giá JPY × Tỷ giá × (1 + % margin) — làm tròn lên đến 1,000 VND | P0 |
| RULE-PROD-04 | Sản phẩm DISCONTINUED không thể đặt hàng thêm | P0 |
| RULE-PROD-05 | Xóa sản phẩm chỉ là soft delete (is_deleted = 1), không xóa cứng | P0 |
| RULE-PROD-06 | Sản phẩm từ AI search phải được admin duyệt trước khi hiển thị cho VN Branch | P0 |

---

## RULE-AI — AI Search

| Mã | Quy tắc | Ưu tiên |
|----|---------|---------|
| RULE-AI-01 | Mỗi lần tìm kiếm AI giới hạn tối đa 10 kết quả | P1 |
| RULE-AI-02 | User chỉ được lưu tối đa 50 sản phẩm đang chờ duyệt (PENDING) | P1 |
| RULE-AI-03 | Sản phẩm AI đề xuất bị từ chối (REJECTED) không được đề xuất lại trong 7 ngày | P2 |
| RULE-AI-04 | Giá JPY từ AI là giá tham khảo, admin có thể sửa trước khi duyệt | P0 |

---

## RULE-ORDER — Đơn hàng

| Mã | Quy tắc | Ưu tiên |
|----|---------|---------|
| RULE-ORDER-01 | Đơn hàng DRAFT không ảnh hưởng tồn kho | P0 |
| RULE-ORDER-02 | Đơn hàng PENDING → tồn kho bị tạm giữ (reserved) | P0 |
| RULE-ORDER-03 | Đơn hàng CANCELLED → hoàn lại tồn kho đã tạm giữ | P0 |
| RULE-ORDER-04 | Tỷ giá được lock tại thời điểm JP Agency CONFIRM đơn | P0 |
| RULE-ORDER-05 | Không thể sửa đơn khi đã ở trạng thái SHIPPED hoặc DELIVERED | P0 |
| RULE-ORDER-06 | Huỷ đơn chỉ được khi status là DRAFT hoặc PENDING | P0 |
| RULE-ORDER-07 | Số lượng đặt tối thiểu là 1, tối đa không vượt tồn kho | P0 |

---

## RULE-BATCH — Chuyến hàng

| Mã | Quy tắc | Ưu tiên |
|----|---------|---------|
| RULE-BATCH-01 | Chỉ đơn hàng status CONFIRMED mới được gom vào chuyến | P0 |
| RULE-BATCH-02 | Một đơn hàng chỉ thuộc 1 chuyến hàng tại một thời điểm | P0 |
| RULE-BATCH-03 | Chuyến hàng phải có ít nhất 1 đơn hàng | P0 |
| RULE-BATCH-04 | Không thể thêm/xóa đơn hàng khi chuyến đã ở IN_TRANSIT trở đi | P0 |
| RULE-BATCH-05 | Khi chuyến DELIVERED → tất cả đơn trong chuyến chuyển sang DELIVERED | P0 |

---

## RULE-RATE — Tỷ giá

| Mã | Quy tắc | Ưu tiên |
|----|---------|---------|
| RULE-RATE-01 | Chỉ lưu 1 tỷ giá JPY/VND có hiệu lực tại 1 thời điểm | P0 |
| RULE-RATE-02 | Tỷ giá mới không ảnh hưởng đơn hàng đã CONFIRMED | P0 |
| RULE-RATE-03 | Lịch sử tỷ giá được lưu giữ không giới hạn | P1 |
| RULE-RATE-04 | Chỉ SUPER_ADMIN mới được cập nhật tỷ giá | P0 |

---

## RULE-INV — Kho hàng (V3)

| Mã | Quy tắc | Ưu tiên |
|----|---------|---------|
| RULE-INV-01 | `available_qty = quantity - reserved_qty` — tính realtime, không lưu vào DB | P0 |
| RULE-INV-02 | Khi batch DELIVERED → `stockIn()` tự động cộng kho theo số lượng từng đơn | P0 |
| RULE-INV-03 | Khi đại lý confirmReceipt → `stockOut()` tự động trừ kho | P0 |
| RULE-INV-04 | `restock_status` tự cập nhật sau mỗi stockIn/stockOut: CRITICAL (qty≤0) / LOW (qty<min) / NORMAL | P0 |
| RULE-INV-05 | CSV bulk import: dòng lỗi không block dòng hợp lệ — import từng phần, báo lỗi theo row | P0 |
| RULE-INV-06 | CSV phải có header: `product_cd, warehouse_id, quantity, min_stock_qty, notes` | P0 |
| RULE-INV-07 | `min_stock_qty` mặc định = 5 nếu không được set | P1 |
| RULE-INV-08 | Nhập kho thủ công (`POST /stock-movements`) chỉ Admin/JP Agency được thực hiện | P0 |

---

## RULE-NOTIF — Thông báo (V3)

| Mã | Quy tắc | Ưu tiên |
|----|---------|---------|
| RULE-NOTIF-01 | Thông báo tạo tự động tại server khi có sự kiện: ORDER_NEW, ORDER_CONFIRMED, ORDER_CANCELLED, BATCH_DELIVERED | P0 |
| RULE-NOTIF-02 | Mỗi user chỉ nhận thông báo thuộc phạm vi mình: branch chỉ thấy của branch mình | P0 |
| RULE-NOTIF-03 | Frontend poll API mỗi 60 giây để cập nhật badge | P1 |
| RULE-NOTIF-04 | Đọc thông báo đặt `read_at = now()`, không xóa record | P0 |
| RULE-NOTIF-05 | `unread_count` = số record có `read_at IS NULL` của user | P0 |

---

## RULE-PROFILE — Hồ sơ tài khoản (V3)

| Mã | Quy tắc | Ưu tiên |
|----|---------|---------|
| RULE-PROFILE-01 | Email là định danh đăng nhập — không thay đổi được qua Profile | P0 |
| RULE-PROFILE-02 | Số điện thoại chỉ chứa số, tối thiểu 8 ký tự | P0 |
| RULE-PROFILE-03 | Avatar URL phải là URL hợp lệ (http/https) | P1 |
| RULE-PROFILE-04 | Mỗi user chỉ xem/sửa profile của chính mình | P0 |

---

## RULE-DASH — Dashboard tài chính (V3)

| Mã | Quy tắc | Ưu tiên |
|----|---------|---------|
| RULE-DASH-01 | Dashboard revenue chỉ hiển thị với Admin / JP Agency — Branch chỉ thấy số liệu của branch mình | P0 |
| RULE-DASH-02 | Tỷ giá hiển thị trên Dashboard là tỷ giá hiện tại từ `exchange_rates` mới nhất | P0 |
| RULE-DASH-03 | Revenue tính theo `locked_rate` của từng đơn (không tính theo tỷ giá hiện tại) | P0 |
| RULE-DASH-04 | KPI: `outstanding_debt` = tổng invoice chưa thanh toán; `low_stock_count` = số SP có restock_status=LOW/CRITICAL | P0 |

---

## RULE-AIPUR — AI Purchasing Specialist (V3/AI)

| Mã | Quy tắc | Ưu tiên |
|----|---------|---------|
| RULE-AIPUR-01 | AI Purchasing chỉ Admin / JP Agency mới được truy cập | P0 |
| RULE-AIPUR-02 | Công thức score: Price×30% + Quality×30% + Popularity×20% + Warranty×10% + Brand×10% | P0 |
| RULE-AIPUR-03 | Score mỗi tiêu chí từ 0–100, ai_score tổng từ 0–100 | P0 |
| RULE-AIPUR-04 | Kết quả trả về sắp xếp giảm dần theo ai_score | P0 |
| RULE-AIPUR-05 | Nếu OPENAI_API_KEY chưa set → trả lỗi graceful (HTTP 503), không crash | P0 |
| RULE-AIPUR-06 | Mỗi request tối đa 20 sản phẩm để phân tích | P1 |
