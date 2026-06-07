'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePermission } from '@/hooks/usePermission';
import {
  LayoutDashboard, Package, ShoppingCart, Truck,
  Warehouse, BarChart3, Users, Settings, Store,
  Bot, ClipboardList,
} from 'lucide-react';

// ─── Nav config ──────────────────────────────────────────────────────────────
interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  permission: string;
  children?: NavItem[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard size={18} />,
    permission: 'products.view', // tất cả đều xem được
  },
  {
    label: 'Hàng hóa',
    href: '/products',
    icon: <Package size={18} />,
    permission: 'products.view',
  },
  {
    label: 'AI Center',
    href: '/ai-center',
    icon: <Bot size={18} />,
    permission: 'products.view',
  },
  {
    label: 'Đơn hàng',
    href: '/orders',
    icon: <ShoppingCart size={18} />,
    permission: 'orders.view',
  },
  {
    label: 'Chuyến hàng',
    href: '/shipments',
    icon: <Truck size={18} />,
    permission: 'orders.confirm', // chỉ admin
  },
  {
    label: 'Kho hàng',
    href: '/warehouse',
    icon: <Warehouse size={18} />,
    permission: 'warehouse.view', // chỉ admin
    children: [
      { label: 'Tổng quan', href: '/warehouse', icon: null, permission: 'warehouse.view' },
      { label: 'Nhập kho',  href: '/warehouse/stock-in',  icon: null, permission: 'warehouse.stock_in' },
      { label: 'Xuất kho',  href: '/warehouse/stock-out', icon: null, permission: 'warehouse.stock_out' },
      { label: 'Kiểm kê',   href: '/warehouse/inventory-check', icon: null, permission: 'warehouse.adjust' },
    ],
  },
  {
    label: 'Báo cáo',
    href: '/reports',
    icon: <BarChart3 size={18} />,
    permission: 'reports.inventory', // chỉ admin
  },
  {
    label: 'Chi nhánh',
    href: '/admin/branches',
    icon: <Store size={18} />,
    permission: 'branches.view', // chỉ admin
  },
  {
    label: 'Nhà cung cấp',
    href: '/suppliers',
    icon: <ClipboardList size={18} />,
    permission: 'admin.users', // chỉ admin
  },
  {
    label: 'Quản trị',
    href: '/admin',
    icon: <Settings size={18} />,
    permission: 'admin.settings', // chỉ admin
  },
];

// Branch-specific nav (hiện khi user_type bắt đầu bằng 'branch_')
const BRANCH_NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/branch/dashboard',
    icon: <LayoutDashboard size={18} />,
    permission: 'orders.view',
  },
  {
    label: 'Đơn hàng',
    href: '/branch/orders',
    icon: <ShoppingCart size={18} />,
    permission: 'orders.view',
  },
  {
    label: 'Hàng hóa',
    href: '/products',
    icon: <Package size={18} />,
    permission: 'products.view',
  },
  {
    label: 'Nhân viên',
    href: '/branch/users',
    icon: <Users size={18} />,
    permission: 'branch_users.view', // chỉ branch_manager
  },
];

// ─── Component ───────────────────────────────────────────────────────────────
export default function Sidebar() {
  const pathname = usePathname();
  const { can, isBranch } = usePermission();

  const items = isBranch ? BRANCH_NAV_ITEMS : NAV_ITEMS;
  const visibleItems = items.filter((item) => can(item.permission));

  return (
    <aside className="w-64 min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-700">
        <span className="text-lg font-bold tracking-wide">TT Product JP</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => (
          <NavItemComponent
            key={item.href}
            item={item}
            pathname={pathname}
            can={can}
          />
        ))}
      </nav>
    </aside>
  );
}

// ─── NavItem ─────────────────────────────────────────────────────────────────
function NavItemComponent({
  item,
  pathname,
  can,
}: {
  item: NavItem;
  pathname: string;
  can: (p: string) => boolean;
}) {
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div>
      <Link
        href={hasChildren ? '#' : item.href}
        className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
          isActive
            ? 'bg-blue-600 text-white'
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
        }`}
      >
        {item.icon}
        <span>{item.label}</span>
      </Link>

      {/* Children (sub-menu) */}
      {hasChildren && (
        <div className="ml-6 mt-1 space-y-1">
          {item.children!
            .filter((child) => can(child.permission))
            .map((child) => (
              <Link
                key={child.href}
                href={child.href}
                className={`block px-3 py-1.5 rounded-md text-sm transition-colors ${
                  pathname === child.href
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {child.label}
              </Link>
            ))}
        </div>
      )}
    </div>
  );
}
