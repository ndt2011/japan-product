"use client";

import { useAuthStore } from "@/stores/useAuthStore";
import type { AuthUser } from "@/types/api";

export type Permission =
  | "products.create"
  | "products.edit"
  | "products.delete"
  | "orders.create"
  | "orders.confirm"
  | "orders.viewAll"
  | "warehouse.access"
  | "ai.candidates"
  | "shipments.create"
  | "admin.panel"
  | "reports.all"
  | "reports.orders";

const ADMIN_PERMISSIONS: Permission[] = [
  "products.create",
  "products.edit",
  "products.delete",
  "orders.confirm",
  "orders.viewAll",
  "warehouse.access",
  "ai.candidates",
  "shipments.create",
  "admin.panel",
  "reports.all",
  "reports.orders",
];

const COMPANY_PERMISSIONS: Permission[] = [
  "orders.create",
  "reports.orders",
];

const BRANCH_PERMISSIONS: Permission[] = [
  "orders.create",
  "reports.orders",
];

export function usePermission(permission?: Permission): boolean {
  const userType = useAuthStore((s) => s.user?.user_type);
  if (!permission) return true;
  if (!userType) return false;
  if (userType === "admin") return ADMIN_PERMISSIONS.includes(permission);
  if (userType === "company") return COMPANY_PERMISSIONS.includes(permission);
  if (userType === "branch_manager" || userType === "branch_staff") {
    return BRANCH_PERMISSIONS.includes(permission);
  }
  return false;
}

export function useIsAdmin(): boolean {
  return useAuthStore((s) => s.user?.user_type) === "admin";
}

export function useIsCompany(): boolean {
  return useAuthStore((s) => s.user?.user_type) === "company";
}

export function canAccessRoute(user: AuthUser | null, pathname: string): boolean {
  if (!user) return false;

  const adminOnlyPrefixes = [
    "/products/new",
    "/admin",
    "/stock-in",
    "/stock-out",
    "/inventory",
    "/shipments/new",
    "/agents",
    "/debts",
  ];

  const companyOrBranchPrefixes = ["/orders/new"];

  if (user.user_type === "company" || user.user_type === "branch_manager" || user.user_type === "branch_staff") {
    if (adminOnlyPrefixes.some((p) => pathname.startsWith(p))) {
      if (user.user_type === "branch_manager" && pathname.startsWith(`/admin/branches/${user.branch_id}/users`)) {
        return true;
      }
      return false;
    }
    if (/\/products\/\d+\/edit/.test(pathname)) return false;
    return true;
  }

  if (companyOrBranchPrefixes.some((p) => pathname.startsWith(p))) return false;

  return true;
}
