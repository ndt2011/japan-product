"use client";

import type { ElementType } from "react";
import {
  ArrowUpFromLine,
  BarChart3,
  Bot,
  Building,
  Building2,
  ClipboardList,
  CreditCard,
  Database,
  LayoutDashboard,
  MapPin,
  Package,
  Receipt,
  Settings,
  Ship,
  ShoppingBag,
  ShoppingCart,
  Store,
  Truck,
  User,
} from "lucide-react";
import type { NavPageId } from "@/lib/navigation";

const ICONS: Record<NavPageId, ElementType> = {
  dashboard: LayoutDashboard,
  "ai-center": Bot,
  purchasing: ShoppingBag,
  suppliers: Building2,
  agents: Store,
  branches: Building,
  products: Package,
  "stock-in": Truck,
  "stock-out": ArrowUpFromLine,
  inventory: ClipboardList,
  orders: ShoppingCart,
  shipments: Ship,
  invoices: Receipt,
  debts: CreditCard,
  reports: BarChart3,
  "my-branch": MapPin,
  admin: Settings,
  "master-data": Database,
  profile: User,
};

export function NavIcon({ id, className = "w-4 h-4" }: { id: NavPageId; className?: string }) {
  const Icon = ICONS[id];
  return <Icon className={className} strokeWidth={2} aria-hidden />;
}
