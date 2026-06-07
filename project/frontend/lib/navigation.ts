export type NavPageId =
  | "dashboard"
  | "ai-center"
  | "suppliers"
  | "agents"
  | "products"
  | "stock-in"
  | "stock-out"
  | "inventory"
  | "orders"
  | "shipments"
  | "debts"
  | "reports"
  | "admin";

export interface NavItem {
  id: NavPageId;
  label: string;
  icon: string;
  href: string;
  group?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: "📊", href: "/dashboard" },
  { id: "ai-center", label: "AI Product Center", icon: "🤖", href: "/ai-center" },
  { id: "suppliers", label: "Nhà Cung Cấp", icon: "🏭", href: "/suppliers", group: "Danh Mục" },
  { id: "agents", label: "Đại Lý", icon: "🏪", href: "/agents", group: "Danh Mục" },
  { id: "products", label: "Hàng Hóa", icon: "📦", href: "/products", group: "Kho Hàng" },
  { id: "stock-in", label: "Phiếu Nhập Kho", icon: "📥", href: "/stock-in", group: "Kho Hàng" },
  { id: "stock-out", label: "Xuất Kho", icon: "📤", href: "/stock-out", group: "Kho Hàng" },
  { id: "inventory", label: "Kiểm Kê Kho", icon: "🗂️", href: "/inventory", group: "Kho Hàng" },
  { id: "orders", label: "Đơn Đặt Hàng", icon: "🛒", href: "/orders", group: "Giao Dịch" },
  { id: "shipments", label: "Chuyến Hàng", icon: "🚢", href: "/shipments", group: "Giao Dịch" },
  { id: "debts", label: "Công Nợ", icon: "💰", href: "/debts", group: "Giao Dịch" },
  { id: "reports", label: "Báo Cáo", icon: "📈", href: "/reports", group: "Phân Tích" },
  { id: "admin", label: "Quản Trị", icon: "⚙️", href: "/admin", group: "Hệ Thống" },
];

export function getPageTitle(pathname: string): string {
  return NAV_ITEMS.find((item) => pathname.startsWith(item.href))?.label ?? "SupplyFlow";
}
