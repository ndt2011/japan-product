"use client";

import { NAV_ITEMS } from "@/lib/navigation";
import { clsx } from "clsx";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

interface AppShellProps {
  children: React.ReactNode;
  userName?: string;
  userEmail?: string;
}

export function AppShell({ children, userName = "User", userEmail = "" }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const groups = Array.from(new Set(NAV_ITEMS.map((i) => i.group || ""))).filter(Boolean);
  const topItems = NAV_ITEMS.filter((i) => !i.group);
  const pageTitle = NAV_ITEMS.find((item) => pathname.startsWith(item.href))?.label ?? "SupplyFlow";

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex h-screen bg-surface">
      <aside
        className={clsx(
          "h-screen bg-white border-r border-border flex flex-col transition-all duration-300 shrink-0",
          collapsed ? "w-16" : "w-60",
        )}
      >
        <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
          <div className="w-8 h-8 bg-brand rounded-xl flex items-center justify-center text-white text-sm shrink-0">
            🇯🇵
          </div>
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
              {NAV_ITEMS.filter((i) => i.group === group).map((item) => (
                <NavLink key={item.id} item={item} active={pathname.startsWith(item.href)} collapsed={collapsed} />
              ))}
            </div>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          {!collapsed && (
            <div className="flex items-center gap-2 px-2 py-2 mb-2">
              <div className="w-7 h-7 rounded-full bg-brand text-white text-xs flex items-center justify-center">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-text-primary truncate">{userName}</p>
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

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 bg-white border-b border-border flex items-center justify-between px-6 shrink-0">
          <h2 className="text-sm text-text-primary font-medium">{pageTitle}</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="relative w-8 h-8 flex items-center justify-center rounded-xl hover:bg-surface-subtle text-text-muted"
            >
              🔔
              <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-1.5 text-xs rounded-xl border border-border text-text-muted hover:bg-surface-subtle"
            >
              Đăng xuất
            </button>
            <div className="w-8 h-8 rounded-full bg-brand text-white text-xs flex items-center justify-center">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

function NavLink({
  item,
  active,
  collapsed,
}: {
  item: (typeof NAV_ITEMS)[number];
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
