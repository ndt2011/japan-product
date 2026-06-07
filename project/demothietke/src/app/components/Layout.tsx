import React, { useState } from "react";
import { clsx } from "clsx";

export type Page =
  | "dashboard"
  | "suppliers"
  | "products"
  | "inventory"
  | "stock-in"
  | "stock-out"
  | "orders"
  | "agents"
  | "debts"
  | "reports"
  | "ai-center"
  | "admin";

const navItems: { id: Page; label: string; icon: string; group?: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "ai-center", label: "AI Product Center", icon: "🤖" },
  { id: "suppliers", label: "Nhà Cung Cấp", icon: "🏭", group: "Danh Mục" },
  { id: "agents", label: "Đại Lý", icon: "🏪", group: "Danh Mục" },
  { id: "products", label: "Hàng Hóa", icon: "📦", group: "Kho Hàng" },
  { id: "stock-in", label: "Phiếu Nhập Kho", icon: "📥", group: "Kho Hàng" },
  { id: "stock-out", label: "Xuất Kho", icon: "📤", group: "Kho Hàng" },
  { id: "inventory", label: "Kiểm Kê Kho", icon: "🗂️", group: "Kho Hàng" },
  { id: "orders", label: "Đơn Đặt Hàng", icon: "🛒", group: "Giao Dịch" },
  { id: "debts", label: "Công Nợ", icon: "💰", group: "Giao Dịch" },
  { id: "reports", label: "Báo Cáo", icon: "📈", group: "Phân Tích" },
  { id: "admin", label: "Quản Trị", icon: "⚙️", group: "Hệ Thống" },
];

export function Layout({
  currentPage,
  onNavigate,
  children,
}: {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  const groups = Array.from(new Set(navItems.map((i) => i.group || ""))).filter(Boolean);
  const topItems = navItems.filter((i) => !i.group);

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-['Inter',sans-serif]">
      {/* Sidebar */}
      <aside
        className={clsx(
          "h-screen bg-white border-r border-[#E5E7EB] flex flex-col transition-all duration-300 shrink-0",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-[#E5E7EB]">
          <div className="w-8 h-8 bg-[#2563EB] rounded-xl flex items-center justify-center text-white text-sm shrink-0">
            📦
          </div>
          {!collapsed && (
            <div>
              <p className="text-sm text-[#111827] leading-tight">SupplyFlow</p>
              <p className="text-xs text-[#6B7280]">ERP System</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {topItems.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              active={currentPage === item.id}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          ))}

          {groups.map((group) => {
            const groupItems = navItems.filter((i) => i.group === group);
            return (
              <div key={group} className="pt-3">
                {!collapsed && (
                  <p className="px-3 py-1 text-xs text-[#9CA3AF] uppercase tracking-wider mb-1">
                    {group}
                  </p>
                )}
                {groupItems.map((item) => (
                  <NavItem
                    key={item.id}
                    item={item}
                    active={currentPage === item.id}
                    collapsed={collapsed}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t border-[#E5E7EB] p-3">
          {!collapsed && (
            <div className="flex items-center gap-2 px-2 py-2 mb-2">
              <div className="w-7 h-7 rounded-full bg-[#2563EB] text-white text-xs flex items-center justify-center">
                A
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#111827] truncate">Admin User</p>
                <p className="text-xs text-[#9CA3AF]">admin@company.vn</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[#6B7280] hover:bg-[#F3F4F6] text-sm transition-colors"
          >
            {collapsed ? "→" : "← Thu gọn"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-14 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-sm text-[#111827]">
              {navItems.find((i) => i.id === currentPage)?.label}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[#F3F4F6] text-[#6B7280] transition-colors">
              🔔
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#DC2626] rounded-full" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[#F3F4F6] text-[#6B7280] transition-colors">
              ⚙️
            </button>
            <div className="w-8 h-8 rounded-full bg-[#2563EB] text-white text-xs flex items-center justify-center cursor-pointer">
              A
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

function NavItem({
  item,
  active,
  collapsed,
  onNavigate,
}: {
  item: { id: Page; label: string; icon: string };
  active: boolean;
  collapsed: boolean;
  onNavigate: (page: Page) => void;
}) {
  return (
    <button
      onClick={() => onNavigate(item.id)}
      title={collapsed ? item.label : undefined}
      className={clsx(
        "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all",
        active
          ? "bg-[#EFF6FF] text-[#2563EB]"
          : "text-[#374151] hover:bg-[#F9FAFB] hover:text-[#111827]"
      )}
    >
      <span className="text-base shrink-0">{item.icon}</span>
      {!collapsed && <span className="truncate">{item.label}</span>}
    </button>
  );
}
