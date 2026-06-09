# Test Cases

**Dự án**: Hệ thống quản lý hàng hóa Nhật-Việt  
**Phiên bản**: 1.0 | **Ngày**: 2026-06-07

---

## Module AUTH — Xác thực

| ID | Tên test case | Điều kiện đầu vào | Kết quả kỳ vọng | Priority |
|----|--------------|-------------------|-----------------|---------|
| TC-AUTH-001 | Đăng nhập thành công | Email + password hợp lệ | HTTP 200, token trả về, redirect dashboard | P0 |
| TC-AUTH-002 | Đăng nhập sai password | Password sai | HTTP 401, message M0102 | P0 |
| TC-AUTH-003 | Email không tồn tại | Email không có trong DB | HTTP 401, message M0102 | P0 |
| TC-AUTH-004 | Remember Me = true | Login thành công + remember_me=true | Token expires_at = now + 30 ngày | P0 |
| TC-AUTH-005 | Remember Me = false | Login thành công + remember_me=false | Token expires_at = now + 24 giờ | P0 |
| TC-AUTH-006 | Khóa tài khoản | Sai password 5 lần liên tiếp | HTTP 423, message M0103, account locked | P0 |
| TC-AUTH-007 | Đăng xuất | Token hợp lệ, gọi logout | HTTP 200, token bị revoke, gọi lại API trả 401 | P0 |
| TC-AUTH-008 | Token hết hạn | Dùng token quá 24h (không remember) | HTTP 401, message M0105 | P0 |
| TC-AUTH-009 | RBAC: VN Branch gọi API chỉ JP mới có | VN_BRANCH_STAFF gọi PUT /products | HTTP 403 | P0 |
| TC-AUTH-010 | RBAC: SUPER_ADMIN toàn quyền | SUPER_ADMIN gọi mọi endpoint | HTTP 200 | P0 |

---

## Module PRODUCT — Sản phẩm

| ID | Tên test case | Điều kiện đầu vào | Kết quả kỳ vọng | Priority |
|----|--------------|-------------------|-----------------|---------|
| TC-PROD-001 | Tạo sản phẩm thành công | Đủ tên JP, danh mục, giá, ảnh chính | HTTP 201, sản phẩm tạo status ACTIVE | P0 |
| TC-PROD-002 | Tạo không có ảnh | Không upload ảnh chính | HTTP 422, validation error | P0 |
| TC-PROD-003 | SKU trùng | SKU đã tồn tại | HTTP 422, message "SKU đã tồn tại" | P0 |
| TC-PROD-004 | Soft delete | Xóa sản phẩm | HTTP 200, is_deleted=1, không hiển thị với VN Branch | P0 |
| TC-PROD-005 | Giá VND tự động | Giá JPY=1000, tỷ giá=170, margin=20% | Giá VND = 1000×170×1.2 = 204,000 VND | P0 |
| TC-PROD-006 | VN Branch xem catalog | VN_BRANCH_STAFF gọi GET /products | Chỉ thấy sản phẩm ACTIVE, không thấy DISCONTINUED | P0 |

---

## Module AI — Tìm kiếm sản phẩm

| ID | Tên test case | Điều kiện đầu vào | Kết quả kỳ vọng | Priority |
|----|--------------|-------------------|-----------------|---------|
| TC-AI-001 | Tìm sản phẩm có kết quả | Từ khóa hợp lệ (ví dụ: "コラーゲン") | Trả về 1-10 sản phẩm, mỗi cái có tên JP + ảnh + giá JPY | P0 |
| TC-AI-002 | Từ khóa không tìm được | Từ khóa ngẫu nhiên vô nghĩa | HTTP 200, data=[], message M0201 | P0 |
| TC-AI-003 | AI timeout | Mock AI service response > 30s | HTTP 504, message M0202 | P1 |
| TC-AI-004 | Gửi duyệt | Chọn 3 sản phẩm → gửi duyệt | 3 records tạo trong ai_product_candidates status=PENDING | P0 |
| TC-AI-005 | Duyệt sản phẩm | JP Agency duyệt 1 candidate | Record tạo trong products, candidate.status=APPROVED | P0 |
| TC-AI-006 | Từ chối không có lý do | Từ chối không nhập lý do | HTTP 422, validation error | P0 |
| TC-AI-007 | Từ chối có lý do | Nhập lý do tối thiểu 10 ký tự | HTTP 200, candidate.status=REJECTED | P0 |
| TC-AI-008 | Semantic search catalog | `POST /ai/product-search` query hợp lệ | HTTP 200, items từ DB + `image_url` | P1 |
| TC-AI-009 | Tìm catalog tiếng Việt | Query `"bổ gan"` sau `generate-vi` + `embed` | Match `name_vi`, `expanded_query` trong response | P1 |
| TC-AI-010 | Gợi ý UI catalog | Tab Tìm catalog → chọn gợi ý "Bổ gan" | Có kết quả hoặc M0201; hiển thị GPT mở rộng nếu có OpenAI | P2 |

> **Luồng A**: `AiSearchTest` — 6 tests · **Luồng B**: `AiProductSearchTest` — 5 tests  
> **Quy trình dạy AI (OPS):** `docs/sa/amendments/ai-catalog-teaching-process.md`

---

## Module ORDER — Đơn hàng

| ID | Tên test case | Điều kiện đầu vào | Kết quả kỳ vọng | Priority |
|----|--------------|-------------------|-----------------|---------|
| TC-ORD-001 | Tạo đơn hàng | Chọn 2 sản phẩm, số lượng hợp lệ | HTTP 201, đơn status=PENDING, tồn kho bị tạm giữ | P0 |
| TC-ORD-002 | Vượt tồn kho | Số lượng > tồn kho thực tế | HTTP 422, thông báo vượt tồn kho | P0 |
| TC-ORD-003 | Lưu nháp | Click "Lưu nháp" | Đơn status=DRAFT, tồn kho không thay đổi | P0 |
| TC-ORD-004 | Confirm đơn | JP Agency confirm đơn PENDING | Đơn status=CONFIRMED, locked_rate ghi vào DB | P0 |
| TC-ORD-005 | Lock tỷ giá | Confirm đơn khi tỷ giá=170, sau đó đổi tỷ giá=175 | Đơn vẫn tính theo 170, không bị ảnh hưởng | P0 |
| TC-ORD-006 | Cancel đơn PENDING | VN Branch cancel đơn đang PENDING | Đơn status=CANCELLED, tồn kho được hoàn lại | P0 |
| TC-ORD-007 | Cancel đơn đã SHIPPED | Thử cancel khi status=SHIPPED | HTTP 422, không thể cancel | P0 |
| TC-ORD-008 | Email đơn mới | Tạo đơn thành công | JP Agency nhận email thông báo | P0 |
| TC-ORD-009 | Email confirm | JP confirm đơn | VN Branch nhận email thông báo | P0 |

---

## Module BATCH — Chuyến hàng

| ID | Tên test case | Điều kiện đầu vào | Kết quả kỳ vọng | Priority |
|----|--------------|-------------------|-----------------|---------|
| TC-BATCH-001 | Tạo batch | Chọn 3 đơn CONFIRMED | Batch tạo status=PREPARING, đơn chuyển PROCESSING | P0 |
| TC-BATCH-002 | Thêm đơn PENDING vào batch | Đơn chưa CONFIRMED | HTTP 422, không thể thêm | P0 |
| TC-BATCH-003 | Update status đúng thứ tự | PREPARING → CUSTOMS_JP | HTTP 200, status cập nhật | P0 |
| TC-BATCH-004 | Skip status | PREPARING → IN_TRANSIT (bỏ qua CUSTOMS_JP) | HTTP 422, không hợp lệ | P1 |
| TC-BATCH-005 | Batch DELIVERED | Cập nhật batch → DELIVERED | Tất cả đơn trong batch → DELIVERED | P0 |
| TC-BATCH-006 | VN Branch data isolation | VN Branch A xem batch của VN Branch B | HTTP 403 hoặc data rỗng | P0 |

---

## Module SECURITY

| ID | Tên test case | Điều kiện đầu vào | Kết quả kỳ vọng | Priority |
|----|--------------|-------------------|-----------------|---------|
| TC-SEC-001 | SQL Injection | Email field: `' OR 1=1 --` | HTTP 401, không login được | P0 |
| TC-SEC-002 | XSS | Tên sản phẩm: `<script>alert(1)</script>` | Ký tự bị escape, không chạy JS | P0 |
| TC-SEC-003 | IDOR | VN Branch A GET /orders/{id của Branch B} | HTTP 403 | P0 |
| TC-SEC-004 | JWT manipulation | Sửa payload JWT (đổi role) | HTTP 401, signature invalid | P0 |

---

## Module NOTIFICATION — Thông báo (V3)

| ID | Tên test case | Điều kiện đầu vào | Kết quả kỳ vọng | Priority |
|----|--------------|-------------------|-----------------|---------|
| TC-NOTIF-001 | Tạo thông báo tự động | JP tạo đơn mới cho Branch | Bản ghi trong `notifications` với type=ORDER_CREATED, user_id=branch_manager | P0 |
| TC-NOTIF-002 | Bell badge count | GET /notifications/count | Trả về `unread_count` đúng số chưa đọc | P0 |
| TC-NOTIF-003 | Đọc 1 thông báo | PUT /notifications/{id}/read | `read_at` được set, unread_count giảm 1 | P0 |
| TC-NOTIF-004 | Đọc tất cả | PUT /notifications/read-all | Tất cả `read_at` được set, unread_count = 0 | P0 |
| TC-NOTIF-005 | Phân quyền thông báo | Branch A xem /notifications | Chỉ thấy thông báo của mình, không thấy của Branch B | P0 |
| TC-NOTIF-006 | Polling interval | Frontend poll mỗi 60s | Badge cập nhật đúng sau 60s khi có thông báo mới | P1 |
| TC-NOTIF-007 | Trigger khi confirm đơn | JP Agency confirm đơn | Notification tạo cho VN Branch với type=ORDER_CONFIRMED | P0 |
| TC-NOTIF-008 | Trigger khi batch DELIVERED | Batch status → DELIVERED | Notification tạo cho VN Branch với type=BATCH_DELIVERED | P0 |

---

## Module INVENTORY V3 — Kho nâng cao (V3)

| ID | Tên test case | Điều kiện đầu vào | Kết quả kỳ vọng | Priority |
|----|--------------|-------------------|-----------------|---------|
| TC-INV-001 | Restock badge | Product `available_qty` < `min_stock_qty` | badge trạng thái = LOW hoặc CRITICAL | P0 |
| TC-INV-002 | available_qty formula | quantity=100, reserved_qty=30 | available_qty = 70 | P0 |
| TC-INV-003 | Cập nhật inventory | PUT /inventories/{id} với quantity=150 | HTTP 200, quantity cập nhật, available_qty tính lại | P0 |
| TC-INV-004 | Xóa inventory | DELETE /inventories/{id} | HTTP 200, soft delete hoặc record bị xóa | P1 |
| TC-INV-005 | CSV bulk import — thành công | Upload file CSV hợp lệ 10 dòng | HTTP 200, imported=10, errors=[] | P0 |
| TC-INV-006 | CSV — dòng lỗi | CSV có 8 dòng hợp lệ + 2 dòng thiếu product_id | imported=8, errors chứa 2 thông báo lỗi | P0 |
| TC-INV-007 | CSV — file rỗng | Upload file CSV không có dòng dữ liệu | HTTP 422, validation error | P0 |
| TC-INV-008 | CSV — file không phải CSV | Upload file .xlsx | HTTP 422, message "File không hợp lệ" | P1 |
| TC-INV-009 | Restock status = ON_ORDER | Đặt đơn hàng cho sản phẩm LOW | restock_status tự cập nhật = ON_ORDER | P1 |

---

## Module PROFILE — Thông tin tài khoản (V3)

| ID | Tên test case | Điều kiện đầu vào | Kết quả kỳ vọng | Priority |
|----|--------------|-------------------|-----------------|---------|
| TC-PROF-001 | GET profile | User đã đăng nhập | HTTP 200, trả về name, email, phone, avatar_url | P0 |
| TC-PROF-002 | Cập nhật profile | PUT /profile {name, phone} hợp lệ | HTTP 200, DB cập nhật đúng | P0 |
| TC-PROF-003 | Email không thay đổi được | PUT /profile với email mới | Email không bị thay đổi (hoặc HTTP 422) | P1 |
| TC-PROF-004 | Validation phone | Phone có ký tự chữ | HTTP 422, validation error | P0 |
| TC-PROF-005 | Avatar URL | PUT /profile với avatar_url hợp lệ | HTTP 200, avatar hiển thị trên UI | P1 |

---

## Module DASHBOARD V2 — Dashboard tài chính (V3)

| ID | Tên test case | Điều kiện đầu vào | Kết quả kỳ vọng | Priority |
|----|--------------|-------------------|-----------------|---------|
| TC-DASH-001 | Revenue by period | GET /dashboard/revenue?period=month | HTTP 200, data gồm revenue_jpy, revenue_vnd theo tháng | P0 |
| TC-DASH-002 | Cashflow | GET /dashboard/cashflow | HTTP 200, in + out + net cho 12 tháng gần nhất | P0 |
| TC-DASH-003 | Phân quyền dashboard | VN Branch gọi /dashboard/revenue | HTTP 403 hoặc chỉ data của branch | P0 |
| TC-DASH-004 | Tỷ giá JPY/VND hiển thị | Dashboard load | Tỷ giá hiện tại hiển thị, có thể edit | P1 |
| TC-DASH-005 | KPI cards | Dashboard load | Hiển thị total_orders, outstanding_debt, low_stock_count, revenue_month | P0 |

---

## Module AI PURCHASING — AI Mua hàng (V3/AI)

| ID | Tên test case | Điều kiện đầu vào | Kết quả kỳ vọng | Priority |
|----|--------------|-------------------|-----------------|---------|
| TC-AIPUR-001 | Gợi ý AI mua hàng | POST /ai/purchasing {product_ids: [1,2,3]} | HTTP 200, mỗi sản phẩm có ai_score, breakdown (price/quality/popularity/warranty/brand) | P0 |
| TC-AIPUR-002 | Scoring weights | Sản phẩm A: giá tốt=100, chất lượng=80, phổ biến=70, BH=90, thương hiệu=85 | ai_score = 100×0.3 + 80×0.3 + 70×0.2 + 90×0.1 + 85×0.1 = 87.5 | P0 |
| TC-AIPUR-003 | Top N gợi ý | Request với top_n=5 | Trả về tối đa 5 sản phẩm được gợi ý mua, sắp xếp score giảm dần | P0 |
| TC-AIPUR-004 | Thiếu OPENAI_API_KEY | Key chưa set, gọi API | HTTP 503 hoặc lỗi rõ ràng "AI service not configured" | P0 |
| TC-AIPUR-005 | ProductCard hiển thị ScoreBar | FE gọi AI Purchasing screen | Mỗi sản phẩm hiển thị ScoreBar với breakdown 5 tiêu chí | P1 |
| TC-AIPUR-006 | Phân quyền AI Purchasing | VN Branch Staff gọi /ai/purchasing | HTTP 403 (chỉ JP Agency/Admin) | P0 |
| TC-AIPUR-007 | Empty product list | product_ids = [] | HTTP 422, validation error | P0 |
