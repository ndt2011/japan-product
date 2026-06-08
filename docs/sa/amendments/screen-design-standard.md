# Chuẩn thiết kế màn hình (Screen Design Standard)

**Mã:** SA-STD-001  
**Phiên bản:** 1.0  
**Ngày:** 2026-06-08  
**Tham chiếu chuẩn:** `docs/sa/1-001_Đăng_nhập.xlsx` ← ĐÂY LÀ FILE MẪU CHUẨN

---

## 1. Quy tắc bắt buộc

> **MỌI file thiết kế màn hình PHẢI tuân theo chuẩn này.**  
> Không được thêm sheet, đổi tên sheet, hay thay đổi bố cục header.

---

## 2. Cấu trúc file Excel (4 sheet bắt buộc)

```
[File: X-XXX_Tên_màn_hình.xlsx]
│
├── Sheet 1: "1.Bìa"           → Metadata (tên, mã, tác giả, ngày, phiên bản)
├── Sheet 2: "2.Thiết kế màn hình" → Bảng DB dùng + Danh sách components
├── Sheet 3: "3.Thiết kế chi tiết"  → Sự kiện, luồng xử lý, SQL
└── Sheet 4: "4.Mô tả trường"   → Field mapping đến DB
```

---

## 3. Quy ước đặt tên file

```
{Nhóm}-{Số thứ tự}_{Tên_màn_hình_tiếng_Việt}.xlsx

Nhóm:
  0 = Tổng quan / Dashboard
  1 = Xác thực (Auth)
  2 = Sản phẩm / AI
  3 = Đơn hàng
  4 = Vận chuyển / Chuyến hàng
  5 = Người dùng / Phân quyền
  6 = Hóa đơn / Thanh toán
  7 = Báo cáo
  8 = Cài đặt hệ thống

Ví dụ: 6-001_Quản_lý_hóa_đơn.xlsx
```

---

## 4. Sheet 1 — "1.Bìa"

| Dòng | Cột A | Cột B |
|------|-------|-------|
| 1 | Hệ thống quản lý hàng hóa Nhật-Việt | _(merge) |
| 2 | Tài liệu thiết kế chi tiết ({Mã}-{Tên}) | _(merge) |
| 3 | Tên màn hình | {Tên tiếng Việt} |
| 4 | Mã chức năng | {mã-chức-năng} |
| 5 | Tác giả | BIT Corp. |
| 6 | Ngày tạo | YYYY-MM-DD |
| 7 | Phiên bản | {1, 2, ...} |

---

## 5. Sheet 2 — "2.Thiết kế màn hình"

### Header (8 cột, dòng 1-3)

```
Dòng 1: [Tên hệ thống] [値] [作成者] [値] [作成日] [値] [版数] [値]
Dòng 2: [Tên màn hình] [値] [更新者] [値] [更新日] [値]
Dòng 3: [Mã chức năng] [値]
```

### Bảng DB (【Bảng sử dụng】)

```
Dòng N:   【Bảng sử dụng】
Dòng N+1: No | Tên bảng | | | Tên vật lý | | I/O |
Dòng N+2: 1  | {Tên tiếng Việt} | | | {table_name} | | I/O/I-O
...
```

**I/O ký hiệu:**
- `I` = chỉ đọc (SELECT)
- `O` = chỉ ghi (INSERT/UPDATE/DELETE)
- `I/O` = đọc và ghi

### Danh sách Components (【Các thành phần màn hình】)

Nếu màn hình có nhiều luồng/flow → tách thành nhiều bảng:

```
【Luồng A — Tên luồng】
No | Tên thành phần | | | Loại | | Ghi chú |
```

**Loại thành phần chuẩn:**
| Loại | Mô tả |
|------|-------|
| `text` | Input text 1 dòng |
| `textarea` | Input nhiều dòng |
| `password` | Input mật khẩu |
| `select` | Dropdown |
| `checkbox` | Checkbox |
| `radio` | Radio button |
| `date` | Date picker |
| `number` | Input số |
| `button` | Nút bấm |
| `link` | Liên kết |
| `label` | Text hiển thị |
| `table` | Bảng dữ liệu |
| `card` | Card UI |
| `modal` | Popup/Dialog |
| `toast` | Thông báo thoáng qua |
| `img` | Hình ảnh |
| `progress` | Thanh tiến trình |
| `badge` | Nhãn trạng thái |
| `tab` | Tab navigation |
| `pagination` | Phân trang |

---

## 6. Sheet 3 — "3.Thiết kế chi tiết"

### Header

```
Dòng 1: Tên hệ thống: {Hệ thống quản lý hàng hóa Nhật-Việt}
Dòng 2: Tên màn hình: {Tên màn hình}
Dòng 3: Mã chức năng: {mã}
```

### Cấu trúc nội dung

```
【Hiển thị ban đầu】
１）Mô tả state mặc định khi màn hình load

【Sự kiện: {Tên sự kiện}】
１）Bước 1: validate / kiểm tra điều kiện
    Nếu có lỗi → {mô tả xử lý lỗi}
２）Bước 2: Xử lý chính
    【SELECT / INSERT / UPDATE / DELETE】
    　　　{tên cột} = {giá trị / điều kiện}
    【FROM】
    　　　{tên bảng}
    【WHERE】
    　　　{điều kiện}
    Nếu không tìm thấy / lỗi → Hiển thị M{code}
３）Bước 3: Cập nhật UI / Chuyển màn hình
    → {mô tả UI update hoặc navigation}
```

**Quy ước SQL inline:**
- Dùng tiếng Việt cho mô tả, tiếng Anh cho tên cột/bảng
- Tham chiếu giá trị màn hình: `（Màn hình）{Tên trường}`
- Mã thông báo: `M{4 chữ số}` — tra cứu trong `06_Hằng_số_thông_báo.xlsx`

---

## 7. Sheet 4 — "4.Mô tả trường"

### Header

```
Dòng 1: Tên hệ thống | | {giá trị}
Dòng 2: Tên màn hình | | {giá trị}
Dòng 3: Mã chức năng | | {giá trị}
```

### Cột bắt buộc

| Cột | Tên | Kiểu | Ghi chú |
|-----|-----|------|---------|
| A | No | Số | Tự tăng |
| B | Tên trường | Chuỗi | Tên hiển thị tiếng Việt |
| C | Loại phần tử | Chuỗi | Xem bảng loại ở Sheet 2 |
| D | Bảng DB | Chuỗi | Để trống nếu không map DB |
| E | Tên cột DB | Chuỗi | snake_case |
| F | Kiểu DL | Chuỗi | Chuỗi / Số / DateTime / Boolean / JSON |
| G | Độ dài | Chuỗi | Độ dài tối đa, để trống nếu không giới hạn |
| H | Mô tả | Chuỗi | Mô tả chi tiết, giá trị mặc định, validate rules |
| I | Bắt buộc | Chuỗi | `○` = bắt buộc, để trống = không bắt buộc |

---

## 8. Danh sách màn hình hiện có

| File | Màn hình | Trạng thái |
|------|---------|------------|
| 0-001_Dashboard.xlsx | Dashboard tổng quan | ✅ Mới tạo |
| 1-001_Đăng_nhập.xlsx | Đăng nhập | ✅ Chuẩn (REFERENCE) |
| 2-001_Thông_tin_hàng_hóa.xlsx | Quản lý sản phẩm | ✅ Có sẵn |
| 2-101_AI_Tìm_sản_phẩm.xlsx | AI Tìm sản phẩm | ✅ Có sẵn |
| 2-102_AI_Chat_Nhân_viên.xlsx | AI Chat nhân viên | ✅ Mới tạo |
| 3-001_Tạo_sửa_đơn_hàng.xlsx | Đơn hàng | ✅ Có sẵn |
| 4-001_Quản_lý_chuyến_hàng.xlsx | Chuyến hàng | ✅ Có sẵn |
| 5-001_Quản_lý_người_dùng.xlsx | Người dùng | ✅ Có sẵn |
| 5-101_Cấu_hình_phân_quyền.xlsx | Phân quyền | ✅ Có sẵn |
| 6-001_Quản_lý_hóa_đơn.xlsx | Hóa đơn & Công nợ | ✅ Mới tạo |
| 7-001_Báo_cáo_lợi_nhuận.xlsx | Báo cáo lợi nhuận | ✅ Mới tạo |

---

## 9. Checklist trước khi submit file thiết kế

- [ ] File có đúng 4 sheet với đúng tên
- [ ] Sheet 1.Bìa đầy đủ 7 dòng metadata
- [ ] Sheet 2 có header theo chuẩn 8 cột
- [ ] Sheet 2 liệt kê ĐẦY ĐỦ bảng DB được dùng (kể cả external API)
- [ ] Sheet 2 liệt kê ĐẦY ĐỦ components với loại chuẩn
- [ ] Sheet 3 có mô tả TỪNG sự kiện người dùng
- [ ] Sheet 3 có SQL inline cho mọi thao tác DB
- [ ] Sheet 3 dùng mã thông báo M{code} cho lỗi
- [ ] Sheet 4 map đủ tất cả trường có trong sheet 2
- [ ] Sheet 4 điền đủ 9 cột (No, Tên, Loại, Bảng, Cột, Kiểu, Độ dài, Mô tả, Bắt buộc)
