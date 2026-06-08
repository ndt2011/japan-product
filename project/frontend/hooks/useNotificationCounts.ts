"use client";

import { useAuthStore } from "@/stores/useAuthStore";
import { useEffect, useState } from "react";

export interface NotificationCounts {
  overdueInvoices: number;
  pendingReceipt: number;
  total: number;
}

export function useNotificationCounts(): NotificationCounts {
  const userType = useAuthStore((s) => s.user?.user_type);
  const [counts, setCounts] = useState<NotificationCounts>({
    overdueInvoices: 0,
    pendingReceipt: 0,
    total: 0,
  });

  useEffect(() => {
    if (!userType) return;

    let cancelled = false;

    async function load() {
      let overdue = 0;
      let pending = 0;

      try {
        if (userType === "admin") {
          const debtRes = await fetch("/api/proxy/invoices/debt-summary");
          const debtData = await debtRes.json();
          if (debtData.success && debtData.data) {
            overdue = Number(debtData.data.overdue_count ?? 0);
          }
        }

        const canConfirm =
          userType === "company" ||
          userType === "branch_manager" ||
          userType === "branch_staff";

        if (canConfirm || userType === "admin") {
          const orderRes = await fetch(
            "/api/proxy/orders?status=DELIVERED_ADMIN&per_page=1",
          );
          const orderData = await orderRes.json();
          if (orderData.success && orderData.data?.pagination) {
            pending = Number(orderData.data.pagination.total ?? 0);
          }
        }

        if (!cancelled) {
          setCounts({
            overdueInvoices: overdue,
            pendingReceipt: pending,
            total: overdue + pending,
          });
        }
      } catch {
        if (!cancelled) {
          setCounts({ overdueInvoices: 0, pendingReceipt: 0, total: 0 });
        }
      }
    }

    load();
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [userType]);

  return counts;
}
