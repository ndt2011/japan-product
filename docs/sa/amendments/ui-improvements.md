# Amendment: Kế hoạch cải thiện UI/UX

> **Ngày**: 2026-06-07 | **Tác giả**: SA  
> **Mục đích**: Phân tích các điểm UI cần sửa — từng màn hình, từng component

---

## Tổng quan vấn đề

| Mức độ | Vấn đề | Số lượng |
|--------|--------|---------|
| 🔴 Critical | Thiếu UI, không dùng được | 3 màn hình |
| 🟡 Important | UI có nhưng thiếu tính năng quan trọng | 6 màn hình |
| 🟢 Polish | UX nhỏ, cải thiện trải nghiệm | Nhiều |

---

## 🔴 CRITICAL — Màn hình cần làm mới hoàn toàn

### UI-001: Dashboard (hiện là demo)

**Vấn đề**: Tất cả số liệu là hardcode / placeholder. Không phản ánh dữ liệu thật.

**Cần sửa**:
```
- Xóa tất cả mock data
- Kết nối GET /dashboard/stats (cần implement BE — xem T1-002 trong upgrade-roadmap.md)
- Cards thật: Đơn hôm nay / Tháng này / Doanh thu / Cảnh báo tồn kho
- Biểu đồ: Recharts LineChart đơn hàng 30 ngày + BarChart doanh thu theo tháng
- Loading skeleton khi fetch
- Auto refresh: useSWR({ refreshInterval: 300000 }) — 5 phút
```

**Component structure**:
```
/dashboard
  ├── StatsCards.tsx       (4 card tổng quan)
  ├── OrdersChart.tsx      (line chart 30 ngày)
  ├── RevenueChart.tsx     (bar chart theo tháng)
  ├── TopProductsList.tsx  (top 5 sản phẩm)
  └── InventoryAlerts.tsx  (cảnh báo tồn kho thấp)
```

---

### UI-002: Branch Management (Phase 1 ✅ — còn polish)

**Hiện trạng** (2026-06-08): Đã có `/admin/branches`, `/admin/branches/{id}/users`, `/my-branch` (commit `ecba6d1`). Còn thiếu edit form riêng, tab branch-stats trên SP.

**Màn hình cần tạo**:

**Admin JP side**:
```
/admin/branches
  - Bảng danh sách chi nhánh: Mã, Tên, Vùng, Tỉnh, Manager, Số nhân viên, Trạng thái
  - Filter: region (Bắc/Trung/Nam), province
  - Button: "+ Tạo chi nhánh"

/admin/branches/create + /admin/branches/{id}/edit
  - Form: branch_cd, branch_name, region (select), province (select → lọc theo region), address
  - Section "Quản lý viên": chọn/tạo branch_manager

/admin/branches/{id}
  - Info chi nhánh + bản đồ vùng (có thể dùng embedded Google Map)
  - Tab "Nhân viên": danh sách + button "+ Thêm nhân viên"
  - Tab "Đơn hàng": đơn của chi nhánh này
```

**Branch user side** (route `/branch/*`):
```
/branch/dashboard
  - Đơn hàng của chi nhánh mình (status breakdown)
  - Hàng hóa đang có ở chi nhánh

/branch/orders
  - Chỉ thấy đơn hàng có branch_id = branch của mình
  - Branch staff: chỉ xem
  - Branch manager: có thể cập nhật ghi chú
```

---

### UI-003: Invoice & Payment (chưa có FE)

Tham chiếu T1-001 trong `upgrade-roadmap.md`. Cần 3 màn hình mới.

---

## 🟡 IMPORTANT — Màn hình có sẵn nhưng cần sửa

### UI-004: Product Form — Thiếu trường + Image upload

**Vấn đề hiện tại**:
- Form tạo/sửa sản phẩm không có section upload ảnh
- Thiếu field `name_vi`, `description_vi` (cần cho AI search tiếng Việt)
- Thiếu field `cost_jpy`, `tax_rate`, `markup_rate` (cần cho auto price T1-003)

**Cần sửa** (`/products/create` và `/products/{id}/edit`):

```tsx
// Section 1: Thông tin cơ bản (hiện có)
// Section 2: TÊN & MÔ TẢ — thêm tab JP / VI
<Tabs defaultValue="jp">
  <TabsList>
    <TabsTrigger value="jp">日本語</TabsTrigger>
    <TabsTrigger value="vi">Tiếng Việt</TabsTrigger>
  </TabsList>
  <TabsContent value="jp">
    <Input name="name_jp" label="Tên (JP)" required />
    <Textarea name="description_jp" label="Mô tả (JP)" />
  </TabsContent>
  <TabsContent value="vi">
    <Input name="name_vi" label="Tên (VI)" />
    <Textarea name="description_vi" label="Mô tả (VI)" />
  </TabsContent>
</Tabs>

// Section 3: Giá (thêm mới)
<div className="grid grid-cols-3 gap-4">
  <Input name="cost_jpy" label="Giá vốn (¥)" type="number" />
  <Input name="tax_rate" label="Thuế (%)" defaultValue="10" />
  <Input name="markup_rate" label="Markup (%)" defaultValue="20" />
</div>
// Preview tự tính: unit_price_vnd hiển thị ngay khi nhập

// Section 4: ẢNH SẢN PHẨM (mới hoàn toàn)
<ImageUploader
  maxImages={8}
  onUpload={(files) => ...}
  // drag-drop, set primary, reorder
/>
// Xem chi tiết: amendments/product-image-upload.md
```

---

### UI-005: Product List — Thiếu ảnh và filter

**Vấn đề**:
- Card sản phẩm không hiển thị ảnh (chỉ có placeholder)
- Không có filter theo danh mục / nhà cung cấp
- Không có sort (giá, ngày tạo)

**Cần sửa**:
```tsx
// ProductCard.tsx — thêm ảnh
<Image
  src={product.primary_image_url ?? '/placeholder.png'}
  alt={product.name_jp}
  width={200} height={200}
  className="object-cover rounded-t-lg"
/>

// Bên trái: Filter panel
<FilterPanel>
  <Select name="category_id" options={categories} label="Danh mục" />
  <Select name="supplier_id" options={suppliers} label="Nhà cung cấp" />
  <RangeInput name="price" label="Giá (VND)" />
  <Select name="sort" options={['newest','price_asc','price_desc']} />
</FilterPanel>

// Chuyển đổi Grid / List view (icon góc phải)
<ViewToggle value={view} onChange={setView} />
```

---

### UI-006: Order List — Status filter + Timeline

**Vấn đề**:
- Không thể filter đơn theo status
- Không có timeline trực quan (đơn đang ở bước nào)
- Số lượng đơn nhiều → cần pagination rõ ràng hơn

**Cần sửa**:
```tsx
// Status tabs
<StatusTabs>
  <Tab value="all">Tất cả</Tab>
  <Tab value="PENDING">Chờ xác nhận (n)</Tab>
  <Tab value="CONFIRMED">Đã duyệt</Tab>
  <Tab value="PROCESSING">Đang xử lý</Tab>
  <Tab value="DELIVERED">Đã giao</Tab>
</StatusTabs>

// Order card — thêm progress bar
<OrderProgress steps={['DRAFT','PENDING','CONFIRMED','PROCESSING','DELIVERED']} current={order.status} />

// Pagination rõ ràng: "Trang 1/5 — 47 đơn" + per_page selector (10/25/50)
```

---

### UI-007: AI Search Results — Hiển thị ảnh + score

**Vấn đề**:
- Kết quả tìm kiếm AI không hiển thị ảnh sản phẩm
- Không hiển thị "relevance score" để user biết kết quả tốt không
- Layout chưa thân thiện để so sánh nhiều sản phẩm

**Cần sửa** (`/ai-center`):
```tsx
// SearchResultCard.tsx
<div className="flex gap-4 p-4 border rounded-lg">
  <Image src={product.primary_image_url} ... className="w-24 h-24 object-cover" />
  <div>
    <h3>{product.name_jp}</h3>
    <p className="text-sm text-gray-500">{product.name_vi}</p>
    <p>{formatVND(product.unit_price_vnd)}</p>
    {/* Score indicator */}
    <div className="flex items-center gap-2 mt-2">
      <div className="w-24 h-2 bg-gray-200 rounded">
        <div className="h-2 bg-green-500 rounded" style={{ width: `${score * 100}%` }} />
      </div>
      <span className="text-xs text-gray-500">{(score * 100).toFixed(0)}% phù hợp</span>
    </div>
  </div>
</div>
```

---

### UI-008: Sidebar — Filter theo role

**Vấn đề**: Tất cả user thấy tất cả menu → company_vn thấy menu admin.

**Cần sửa**: Đã có thiết kế đầy đủ trong `amendments/rbac-ui-permissions.md`.

**Tóm tắt**:
```tsx
// Sidebar.tsx — thay thế hardcode bằng
const navItems = getNavForUser(userType); // từ NAV_ITEMS config
// Admin: thấy tất cả
// Company VN: ẩn /admin/*, /warehouse/*
// Branch Manager: chỉ thấy /branch/*, /products (read-only)
// Branch Staff: chỉ thấy /branch/orders
```

---

## 🟢 POLISH — Cải thiện UX nhỏ

### UI-009: Form Validation — Thống nhất error display

**Hiện trạng**: Một số form dùng toast, một số inline error → không nhất quán.

**Chuẩn hóa**:
```tsx
// Dùng react-hook-form + zod cho tất cả form
// Inline error dưới mỗi field
<FormField error={errors.email?.message} />

// Toast chỉ cho: success save, network error
// Không dùng toast cho validation error (khó đọc)
```

---

### UI-010: Loading States — Thêm skeleton

**Hiện trạng**: Một số màn hình hiển thị spinner hoặc màn trắng khi load.

**Chuẩn**: Thêm skeleton cho:
- Product list (`ProductCardSkeleton` x 8)
- Order list (`OrderRowSkeleton` x 10)
- Dashboard stats cards
- Search results

---

### UI-011: Mobile Responsive

**Hiện trạng**: Layout không test mobile. Branch staff cần dùng điện thoại.

**Ưu tiên sửa responsive**:
1. `/branch/orders` — bảng → card layout trên mobile
2. `/products` — grid 4 col → 1 col trên mobile
3. Header/Sidebar → hamburger menu trên mobile (< 768px)
4. Form inputs — đủ lớn để tap (min 44px height)

---

### UI-012: Empty States

**Hiện trạng**: Nhiều màn hình hiển thị bảng rỗng không có message.

**Cần thêm**:
```tsx
// EmptyState component tái sử dụng
<EmptyState
  icon={<PackageIcon />}
  title="Chưa có sản phẩm nào"
  description="Bắt đầu bằng cách thêm sản phẩm đầu tiên"
  action={<Button href="/products/create">+ Thêm sản phẩm</Button>}
/>
```

---

### UI-013: Exchange Rate Indicator

**Hiện trạng**: Tỷ giá hiện tại không hiển thị rõ ở đâu cả.

**Cần thêm**:
```tsx
// Header hoặc Sidebar footer
<ExchangeRateBadge>
  ¥1 = 175.5đ  |  Cập nhật 08:00 hôm nay
</ExchangeRateBadge>
// Click vào → /admin/exchange-rates để xem lịch sử
```

---

## Thứ tự ưu tiên sửa UI

```
Đợt 1 (làm ngay sau RBAC):
  UI-008 Sidebar RBAC filter          ← unblock để demo được
  UI-004 Product Form (name_vi + ảnh) ← phụ thuộc vào BE đã xong
  UI-005 Product List (hiển thị ảnh)

Đợt 2 (song song với Tier 1 upgrade):
  UI-001 Dashboard (cần BE stats API)
  UI-006 Order List (status tabs + timeline)
  UI-007 AI Search Results (ảnh + score)

Đợt 3 (polish):
  UI-002 Branch Management screens
  UI-011 Mobile Responsive (branch)
  UI-009 Form Validation thống nhất
  UI-010 Loading Skeletons
  UI-012 Empty States
  UI-013 Exchange Rate Indicator
```

---

## Checklist Component tái sử dụng cần tạo

| Component | Dùng ở |
|-----------|--------|
| `StatusBadge` | Orders, Invoices, Shipments |
| `EmptyState` | Tất cả danh sách |
| `SkeletonCard` | Products, Orders, Dashboard |
| `FilterPanel` | Products, Orders, Reports |
| `ImageUploader` | Products |
| `OrderProgress` | Order detail |
| `ExchangeRateBadge` | Header |
| `ProtectedRoute` | Tất cả routes cần auth |
| `usePermission` | Buttons/actions ẩn theo role |
