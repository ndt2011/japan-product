# Amendment — RBAC UI: Phân quyền màn hình

> **Ngày**: 2026-06-07 | **Liên quan**: `rbac-req003.md` (BE RBAC) + Frontend routing
> **Mục đích**: Dev FE biết chính xác màn hình nào hiển thị cho role nào

---

## Ma trận phân quyền (UI level)

| Màn hình / Route | Admin (JP) | Công ty VN | Ghi chú |
|------------------|:----------:|:----------:|---------|
| **Dashboard** `/dashboard` | ✅ Full | ✅ Limited | Admin thấy toàn hệ thống; Company chỉ thấy đơn mình |
| **Hàng hóa** `/products` | ✅ CRUD | ✅ Xem | Company không tạo/sửa/xóa |
| **Tạo/sửa hàng** `/products/new`, `/products/:id/edit` | ✅ | ❌ | Ẩn route + button |
| **AI Center** `/ai-center` | ✅ | ✅ | Cả 2 dùng tìm kiếm |
| **AI Candidates** `/admin/ai-candidates` | ✅ Duyệt | ❌ | Chỉ Admin |
| **Đơn hàng** `/orders` | ✅ Tất cả đơn | ✅ Chỉ đơn mình | Filter backend |
| **Tạo đơn** `/orders/new` | ❌ | ✅ | Admin không tạo đơn |
| **Chi tiết đơn** `/orders/:id` | ✅ | ✅ Chỉ của mình | BE check owner |
| **Confirm/Cancel đơn** | ✅ Admin | ✅ Limited | Company chỉ cancel DRAFT |
| **Chuyến hàng** `/shipments` | ✅ Full | ✅ Xem | Company thấy shipment có đơn mình |
| **Tạo chuyến** `/shipments/new` | ✅ | ❌ | |
| **Kho hàng** `/warehouse` | ✅ Full | ❌ | Company không thấy menu kho |
| **Nhập kho** `/warehouse/stock-in` | ✅ | ❌ | |
| **Xuất kho** `/warehouse/stock-out` | ✅ | ❌ | |
| **Kiểm kê** `/warehouse/inventory-check` | ✅ | ❌ | |
| **Báo cáo** `/reports` | ✅ All | ✅ Limited | Company chỉ thấy báo cáo đơn mình |
| **Nhà cung cấp** `/suppliers` | ✅ CRUD | ✅ Xem | |
| **Tỷ giá** `/exchange-rates` | ✅ Sửa | ✅ Xem | |
| **Quản trị** `/admin` | ✅ Full | ❌ | Tạo Admin + Công ty VN ✅ |
| **Quản lý Admin** `/admin` tab Admin | ✅ | ❌ | API `/admin-users` |
| **Quản lý Company** `/admin` tab Công ty VN | ✅ | ❌ | API `/company-users` |
| **Chi nhánh** `/admin/branches` | ✅ | ❌ | Branch user tại `/branches/{id}/users` |
| **Tờ khai HQ** `/import-declarations` | ✅ Full | ✅ Xem | |

---

## Sidebar Menu — hiển thị theo role

### Admin thấy

```
📊 Dashboard
📦 Hàng hóa
   ├─ Danh sách
   └─ Thêm hàng hóa
🤖 AI Center
   ├─ Tìm kiếm
   └─ Duyệt đề xuất  ← chỉ Admin
📋 Đơn hàng
🚢 Chuyến hàng
🏭 Kho hàng          ← chỉ Admin
   ├─ Tồn kho
   ├─ Nhập kho
   ├─ Xuất kho
   └─ Kiểm kê
📈 Báo cáo
🏢 Nhà cung cấp
💱 Tỷ giá
📄 Tờ khai HQ
⚙️ Quản trị          ← chỉ Admin
   ├─ Tài khoản Admin
   └─ Công ty VN
```

### Công ty VN thấy

```
📊 Dashboard (limited)
📦 Hàng hóa (xem)
🤖 AI Center (tìm kiếm)
📋 Đơn hàng (đơn của tôi)
   └─ Tạo đơn mới
🚢 Chuyến hàng (xem)
📈 Báo cáo (đơn của tôi)
🏢 Nhà cung cấp (xem)
💱 Tỷ giá (xem)
```

---

## Implement FE — React/Next.js

### 1. Lấy thông tin user từ `/auth/me`

```typescript
// types/auth.ts
export type UserType = 'admin' | 'company';

export interface AuthUser {
  id: number;
  name: string;
  login_id: string;
  user_type: UserType;
  email?: string;
  company_name?: string;
}
```

### 2. Hook usePermission

```typescript
// hooks/usePermission.ts
import { useAuthStore } from '@/store/authStore';

type Permission =
  | 'products.create'
  | 'products.edit'
  | 'products.delete'
  | 'orders.create'
  | 'orders.confirm'
  | 'orders.viewAll'
  | 'warehouse.access'
  | 'ai.candidates'
  | 'admin.panel'
  | 'reports.all';

const ADMIN_PERMISSIONS: Permission[] = [
  'products.create', 'products.edit', 'products.delete',
  'orders.confirm', 'orders.viewAll',
  'warehouse.access', 'ai.candidates',
  'admin.panel', 'reports.all',
];

const COMPANY_PERMISSIONS: Permission[] = [
  'orders.create',
];

export function usePermission(permission: Permission): boolean {
  const userType = useAuthStore((s) => s.user?.user_type);
  if (!userType) return false;
  if (userType === 'admin') return ADMIN_PERMISSIONS.includes(permission);
  return COMPANY_PERMISSIONS.includes(permission);
}

// Tiện ích check nhanh
export function useIsAdmin(): boolean {
  const userType = useAuthStore((s) => s.user?.user_type);
  return userType === 'admin';
}
```

### 3. Bảo vệ route (Next.js App Router)

```typescript
// components/ProtectedRoute.tsx
'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { usePermission } from '@/hooks/usePermission';

interface Props {
  permission: Parameters<typeof usePermission>[0];
  children: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({ permission, children, redirectTo = '/dashboard' }: Props) {
  const router = useRouter();
  const hasPermission = usePermission(permission);

  useEffect(() => {
    if (!hasPermission) router.replace(redirectTo);
  }, [hasPermission]);

  if (!hasPermission) return null;
  return <>{children}</>;
}
```

Dùng:
```typescript
// app/(dashboard)/warehouse/page.tsx
export default function WarehousePage() {
  return (
    <ProtectedRoute permission="warehouse.access">
      <WarehouseContent />
    </ProtectedRoute>
  );
}
```

### 4. Ẩn/hiện nút theo role

```typescript
// Ẩn nút "Tạo hàng hóa" với Company
const canCreate = usePermission('products.create');

<Button hidden={!canCreate} onClick={openCreateModal}>
  + Thêm hàng hóa
</Button>
```

### 5. Sidebar — lọc menu theo role

```typescript
// config/navigation.ts
import { UserType } from '@/types/auth';

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles: UserType[];          // role nào thấy
  children?: NavItem[];
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',     href: '/dashboard',   icon: 'chart',    roles: ['admin', 'company'] },
  { label: 'Hàng hóa',     href: '/products',    icon: 'box',      roles: ['admin', 'company'] },
  {
    label: 'AI Center',     href: '/ai-center',   icon: 'sparkle',  roles: ['admin', 'company'],
    children: [
      { label: 'Tìm kiếm',   href: '/ai-center',                icon: 'search',  roles: ['admin', 'company'] },
      { label: 'Duyệt đề xuất', href: '/admin/ai-candidates',   icon: 'check',   roles: ['admin'] },
    ],
  },
  { label: 'Đơn hàng',     href: '/orders',      icon: 'file',     roles: ['admin', 'company'] },
  { label: 'Chuyến hàng',  href: '/shipments',   icon: 'ship',     roles: ['admin', 'company'] },
  {
    label: 'Kho hàng',     href: '/warehouse',   icon: 'warehouse', roles: ['admin'],
    children: [
      { label: 'Tồn kho',   href: '/warehouse',                icon: 'list',    roles: ['admin'] },
      { label: 'Nhập kho',  href: '/warehouse/stock-in',       icon: 'arrow-down', roles: ['admin'] },
      { label: 'Xuất kho',  href: '/warehouse/stock-out',      icon: 'arrow-up',   roles: ['admin'] },
      { label: 'Kiểm kê',   href: '/warehouse/inventory-check',icon: 'clipboard',  roles: ['admin'] },
    ],
  },
  { label: 'Báo cáo',      href: '/reports',     icon: 'bar-chart', roles: ['admin', 'company'] },
  { label: 'Nhà cung cấp', href: '/suppliers',   icon: 'building',  roles: ['admin', 'company'] },
  { label: 'Tỷ giá',       href: '/exchange-rates', icon: 'currency', roles: ['admin', 'company'] },
  { label: 'Tờ khai HQ',   href: '/import-declarations', icon: 'document', roles: ['admin', 'company'] },
  {
    label: 'Quản trị',     href: '/admin',       icon: 'settings',  roles: ['admin'],
    children: [
      { label: 'Tài khoản Admin', href: '/admin/admins',    icon: 'user',    roles: ['admin'] },
      { label: 'Công ty VN',      href: '/admin/companies', icon: 'building', roles: ['admin'] },
    ],
  },
];

// Filter dùng trong Sidebar component
export function getNavForUser(userType: UserType): NavItem[] {
  return NAV_ITEMS
    .filter((item) => item.roles.includes(userType))
    .map((item) => ({
      ...item,
      children: item.children?.filter((child) => child.roles.includes(userType)),
    }));
}
```

---

## API — BE phải filter theo role

### Đơn hàng: Company chỉ thấy đơn mình

```php
// OrderController::index
public function index(Request $request)
{
    $user = auth()->user();

    $query = Order::query()->with(['details', 'company']);

    // Company chỉ thấy đơn của mình
    if ($user->user_type === 'company') {
        $query->where('company_vn_id', $user->id);
    }

    // ... filter, paginate ...
}
```

### Dashboard: Company thấy stats đơn mình

```php
// DashboardController
if ($user->user_type === 'company') {
    $stats = [
        'my_orders'   => Order::where('company_vn_id', $user->id)->count(),
        'pending'     => Order::where('company_vn_id', $user->id)->where('status', 'PENDING')->count(),
        'in_transit'  => Order::where('company_vn_id', $user->id)->where('status', 'PROCESSING')->count(),
        'delivered'   => Order::where('company_vn_id', $user->id)->where('status', 'DELIVERED')->count(),
    ];
} else {
    $stats = [
        'total_orders'    => Order::count(),
        'pending_confirm' => Order::where('status', 'PENDING')->count(),
        'in_transit'      => Order::where('status', 'PROCESSING')->count(),
        'total_inventory' => Inventory::sum('quantity'),
        'low_stock_count' => Inventory::whereRaw('quantity < 10')->count(),
    ];
}
```

---

## Checklist cho dev FE

```
[ ] Lưu user_type từ /auth/me vào Zustand store
[ ] Tạo usePermission hook
[ ] Wrap các page admin-only bằng ProtectedRoute
[ ] Dùng getNavForUser() trong Sidebar component
[ ] Ẩn nút Create/Edit/Delete trên Products với company
[ ] Filter đơn hàng: company chỉ thấy đơn mình (BE đã filter, FE không cần làm thêm)
[ ] Ẩn menu Kho hàng và Quản trị với company
[ ] Test: login với company account → không vào được /warehouse/*, /admin/*
```
