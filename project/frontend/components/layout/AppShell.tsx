"use client";

import { AppLogo } from "@/components/AppLogo";
import { AiStaffChatWidget } from "@/components/layout/AiStaffChatWidget";
import { NotificationDropdown } from "@/components/layout/NotificationDropdown";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useNotificationCounts } from "@/hooks/useNotificationCounts";
import { getNavForUser, type NavItem } from "@/lib/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { clsx } from "clsx";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clear);
  const displayName =
    user?.user_type === "company"
      ? user?.company_name ?? user?.login_id
      : user?.full_name ?? user?.login_id ?? "User";
  const userEmail = user?.email ?? user?.login_id ?? "";
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const notifications = useNotificationCounts();

  const navItems = getNavForUser(user?.user_type);
  const groups = Array.from(new Set(navItems.map((i) => i.group || ""))).filter(Boolean);
  const topItems = navItems.filter((i) => !i.group);
  const pageTitle = navItems.find((item) => pathname.startsWith(item.href))?.label ?? "SupplyFlow";

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    clearAuth();
    router.push("/login");
    router.refresh();
  }

  const mobileNav = navItems.filter((i) =>
    ["dashboard", "orders", "products", "ai-center", "profile"].includes(i.id),
  );

  return (
    <div className="flex h-screen bg-surface">
      <aside
        className={clsx(
          "h-screen bg-white border-r border-border flex flex-col transition-all duration-300 shrink-0",
          collapsed ? "w-16" : "w-60",
          "hidden md:flex",
        )}
      >
        <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
          <AppLogo size="sm" />
          {!collapsed && (
            <div>
              <p className="text-sm text-text-primary leading-tight font-medium">SupplyFlow</p>
              <p className="text-xs text-text-muted">Nhật-Việt ERP</p>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {topItems.map((item) => (
            <NavLink key={item.id} item={item} active={pathname.startsWith(item.href)} collapsed={collapsed} />
          ))}
          {groups.map((group) => (
            <div key={group} className="pt-3">
              {!collapsed && (
                <p className="px-3 py-1 text-xs text-text-placeholder uppercase tracking-wider mb-1">{group}</p>
              )}
              {navItems.filter((i) => i.group === group).map((item) => (
                <NavLink key={item.id} item={item} active={pathname.startsWith(item.href)} collapsed={collapsed} />
              ))}
            </div>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          {!collapsed && (
            <div className="flex items-center gap-2 px-2 py-2 mb-2">
              <UserAvatar name={displayName} avatarUrl={user?.avatar_url} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-text-primary truncate">{displayName}</p>
                <p className="text-xs text-text-placeholder truncate">{userEmail || "—"}</p>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-text-muted hover:bg-surface-subtle text-sm transition-colors"
          >
            {collapsed ? "→" : "← Thu gọn"}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden pb-14 md:pb-0">
        <header className="h-14 bg-white border-b border-border flex items-center justify-between px-4 md:px-6 shrink-0">
          <h2 className="text-sm text-text-primary font-medium truncate">{pageTitle}</h2>
          <div className="flex items-center gap-2">
            <NotificationDropdown
              legacyTotal={notifications.total}
              legacyTitle={
                notifications.total > 0
                  ? `${notifications.overdueInvoices} HĐ quá hạn · ${notifications.pendingReceipt} đơn chờ xác nhận`
                  : undefined
              }
            />
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-1.5 text-xs rounded-xl border border-border text-text-muted hover:bg-surface-subtle"
            >
              Đăng xuất
            </button>
            <Link href="/profile" title="Hồ sơ">
              <UserAvatar name={displayName} avatarUrl={user?.avatar_url} size="md" />
            </Link>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>

      {/* Mobile bottom navigation — V3 #13 */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-border flex justify-around py-2 px-1 safe-area-pb">
        {mobileNav.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={clsx(
              "flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] min-w-0 flex-1",
              pathname.startsWith(item.href) ? "text-brand font-medium" : "text-text-muted",
            )}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="truncate w-full text-center">{item.label.split(" ")[0]}</span>
          </Link>
        ))}
      </nav>

      <AiStaffChatWidget />
    </div>
  );
}

function NavLink({
  item,
  active,
  collapsed,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={clsx(
        "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all",
        active ? "bg-brand-light text-brand font-medium" : "text-text-body hover:bg-surface-muted hover:text-text-primary",
      )}
    >
      <span className="text-base shrink-0">{item.icon}</span>
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );
}
