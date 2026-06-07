# Nguồn thiết kế UI — `project/demothietke`

> **Cập nhật**: 2026-06-07  
> **Trạng thái**: ✅ Đã port shell + 12 route vào `project/frontend` (2026-06-07)  
> **Nguồn gốc**: Figma Make export — SupplyFlow ERP

## Quy tắc

1. **UI/Layout** lấy từ `project/demothietke` cho đến khi có docs SA màn hình chính thức (xlsx).
2. **Nghiệp vụ / API** vẫn theo `docs/sa/*.xlsx` và `04_API_Contract.md` khi có.
3. Màn hình chưa có docs → hiển thị placeholder, chờ tài liệu mới.

## Design tokens (SupplyFlow)

| Token | Giá trị |
|-------|---------|
| Brand | `#2563EB` |
| Background | `#F8FAFC` |
| Border | `#E5E7EB` |
| Text | `#111827` / `#6B7280` |
| Radius card | `rounded-xl` |
| Font | Inter |

## Mapping màn hình

| Route Frontend | demothietke | Docs SA (khi có) |
|----------------|-------------|------------------|
| `/login` | — (tự thiết kế theo brand) | `1-001_Đăng_nhập.xlsx` ✅ |
| `/dashboard` | Dashboard.tsx | Chờ docs |
| `/products` | Products.tsx | `2-001_Thông_tin_hàng_hóa.xlsx` ✅ |
| `/ai-center` | AIProductCenter.tsx | `2-101` 📋 |
| `/suppliers` | Suppliers.tsx | Chờ docs |
| `/orders` | Orders.tsx | `3-001` 📋 |
| `/admin` | Administration.tsx | `5-001` 📋 |
