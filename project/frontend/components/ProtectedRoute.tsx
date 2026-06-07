"use client";

import { canAccessRoute, usePermission, type Permission } from "@/hooks/usePermission";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

interface ProtectedRouteProps {
  permission?: Permission;
  children: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({
  permission,
  children,
  redirectTo = "/dashboard",
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const loaded = useAuthStore((s) => s.loaded);
  const hasPermission = usePermission(permission);
  const routeAllowed = canAccessRoute(user, pathname);

  useEffect(() => {
    if (!loaded) return;
    if (!user || !routeAllowed || !hasPermission) {
      router.replace(redirectTo);
    }
  }, [loaded, user, routeAllowed, hasPermission, router, redirectTo]);

  if (!loaded || !user || !routeAllowed || !hasPermission) {
    return null;
  }

  return <>{children}</>;
}
