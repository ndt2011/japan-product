/**
 * Hook kiểm tra quyền dựa trên user_type.
 *
 * Cách dùng:
 *   const canCreate = usePermission('products.create');
 *   const { userType, isAdmin, isBranch } = usePermission();
 */

import { useAuthStore } from '@/store/authStore'; // Zustand / context tuỳ dự án

// ─── Permission map ──────────────────────────────────────────────────────────
// Key = permission name, Value = danh sách user_type được phép
const PERMISSIONS: Record<string, string[]> = {
  // Products
  'products.view':   ['admin', 'company_vn', 'branch_manager', 'branch_staff'],
  'products.create': ['admin'],
  'products.edit':   ['admin'],
  'products.delete': ['admin'],

  // Orders
  'orders.view':     ['admin', 'company_vn', 'branch_manager', 'branch_staff'],
  'orders.create':   ['company_vn', 'branch_manager', 'branch_staff'],
  'orders.confirm':  ['admin'],
  'orders.cancel':   ['admin', 'company_vn'],

  // Warehouse
  'warehouse.view':     ['admin'],
  'warehouse.stock_in': ['admin'],
  'warehouse.stock_out':['admin'],
  'warehouse.adjust':   ['admin'],

  // Reports
  'reports.inventory':   ['admin'],
  'reports.movements':   ['admin'],
  'reports.revenue':     ['admin'],
  'reports.orders':      ['admin', 'company_vn'],

  // Branches
  'branches.view':   ['admin'],
  'branches.create': ['admin'],
  'branches.edit':   ['admin'],

  // Branch users
  'branch_users.view':   ['admin', 'branch_manager'],
  'branch_users.create': ['admin', 'branch_manager'],
  'branch_users.edit':   ['admin', 'branch_manager'],

  // Admin panel
  'admin.users':     ['admin'],
  'admin.settings':  ['admin'],
};

// ─── Hook ────────────────────────────────────────────────────────────────────
export function usePermission(permission?: string) {
  const userType = useAuthStore((state) => state.user?.user_type ?? '');

  const hasPermission = (perm: string): boolean => {
    const allowed = PERMISSIONS[perm];
    if (!allowed) return false;
    return allowed.includes(userType);
  };

  return {
    userType,
    isAdmin:         userType === 'admin',
    isCompany:       userType === 'company_vn',
    isBranchManager: userType === 'branch_manager',
    isBranchStaff:   userType === 'branch_staff',
    isBranch:        userType.startsWith('branch_'),
    can:             hasPermission,
    // Nếu truyền permission trực tiếp vào hook
    allowed:         permission ? hasPermission(permission) : true,
  };
}

// ─── ProtectedRoute component ────────────────────────────────────────────────
// Dùng trong app layout để bảo vệ route:
//   <ProtectedRoute permission="warehouse.view">
//     <WarehousePage />
//   </ProtectedRoute>

import { redirect } from 'next/navigation';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function ProtectedRoute({ permission, children, fallback }: ProtectedRouteProps) {
  const { can } = usePermission();

  if (!can(permission)) {
    if (fallback) return <>{fallback}</>;
    // Server component: redirect('/dashboard');
    // Client component: return null hoặc show message
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Bạn không có quyền truy cập trang này.
      </div>
    );
  }

  return <>{children}</>;
}
