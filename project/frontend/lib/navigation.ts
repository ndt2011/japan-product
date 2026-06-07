import type { AuthUser } from "@/types/api";

export type UserType = AuthUser["user_type"];

export type NavPageId =
  | "dashboard"
  | "ai-center"
  | "suppliers"
  | "agents"
  | "branches"
  | "products"
  | "stock-in"
  | "stock-out"
  | "inventory"
  | "orders"
  | "shipments"
  | "debts"
  | "reports"
  | "my-branch"
  | "admin";

export interface NavItem {
  id: NavPageId;
  label: string;
  icon: string;
  href: string;
  group?: string;
  roles: UserType[];
}

const BRANCH_ROLES: UserType[] = ["branch_manager", "branch_staff"];

export const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: "📊", href: "/dashboard", roles: ["admin", "company", ...BRANCH_ROLES] },
  { id: "ai-center", label: "AI Product Center", icon: "🤖", href: "/ai-center", roles: ["admin", "company", ...BRANCH_ROLES] },
  { id: "suppliers", label: "Nhà Cung Cấp", icon: "🏭", href: "/suppliers", group: "Danh Mục", roles: ["admin", "company"] },
  { id: "agents", label: "Đại Lý", icon: "🏪", href: "/agents", group: "Danh Mục", roles: ["admin"] },
  { id: "branches", label: "Chi Nhánh", icon: "🏢", href: "/admin/branches", group: "Danh Mục", roles: ["admin"] },
  { id: "products", label: "Hàng Hóa", icon: "📦", href: "/products", group: "Kho Hàng", roles: ["admin", "company", ...BRANCH_ROLES] },
  { id: "stock-in", label: "Phiếu Nhập Kho", icon: "📥", href: "/stock-in", group: "Kho Hàng", roles: ["admin"] },
  { id: "stock-out", label: "Xuất Kho", icon: "📤", href: "/stock-out", group: "Kho Hàng", roles: ["admin"] },
  { id: "inventory", label: "Kiểm Kê Kho", icon: "🗂️", href: "/inventory", group: "Kho Hàng", roles: ["admin"] },
  { id: "orders", label: "Đơn Đặt Hàng", icon: "🛒", href: "/orders", group: "Giao Dịch", roles: ["admin", "company", ...BRANCH_ROLES] },
  { id: "shipments", label: "Chuyến Hàng", icon: "🚢", href: "/shipments", group: "Giao Dịch", roles: ["admin", "company"] },
  { id: "debts", label: "Công Nợ", icon: "💰", href: "/debts", group: "Giao Dịch", roles: ["admin"] },
  { id: "reports", label: "Báo Cáo", icon: "📈", href: "/reports", group: "Phân Tích", roles: ["admin", "company", "branch_manager"] },
  { id: "my-branch", label: "Chi Nhánh Của Tôi", icon: "📍", href: "/my-branch", group: "Hệ Thống", roles: BRANCH_ROLES },
  { id: "admin", label: "Quản Trị", icon: "⚙️", href: "/admin", group: "Hệ Thống", roles: ["admin"] },
];

export function getNavForUser(userType: UserType | undefined): NavItem[] {
  if (!userType) return [];
  return NAV_ITEMS.filter((item) => item.roles.includes(userType));
}

export function getPageTitle(pathname: string): string {
  return NAV_ITEMS.find((item) => pathname.startsWith(item.href))?.label ?? "SupplyFlow";
}
