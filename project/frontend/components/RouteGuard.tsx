"use client";

import { canAccessRoute } from "@/hooks/usePermission";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const loaded = useAuthStore((s) => s.loaded);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loaded) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!canAccessRoute(user, pathname)) {
      router.replace("/dashboard");
    }
  }, [loaded, user, pathname, router]);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-text-muted text-sm">
        Đang tải...
      </div>
    );
  }

  if (!user || !canAccessRoute(user, pathname)) {
    return null;
  }

  return <>{children}</>;
}
