"use client";

import { toast } from "@/lib/toast";
import { useAuthStore } from "@/stores/useAuthStore";
import { useEffect, useRef } from "react";

/** Poll thông báo in-app — hiện toast khi có đơn / sự kiện mới */
export function NotificationPoller() {
  const user = useAuthStore((s) => s.user);
  const prevUnread = useRef<number | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/proxy/notifications/count");
        const data = await res.json();
        if (!data.success || cancelled) return;

        const unread = Number(data.data?.unread ?? 0);

        if (!initialized.current) {
          prevUnread.current = unread;
          initialized.current = true;
          return;
        }

        if (prevUnread.current !== null && unread > prevUnread.current) {
          const listRes = await fetch("/api/proxy/notifications?per_page=1&unread=1");
          const listData = await listRes.json();
          const latest = listData.data?.items?.[0] as
            | { title?: string; body?: string; type?: string }
            | undefined;

          const title = latest?.title ?? "Thông báo mới";
          const body = latest?.body ?? "Bạn có thông báo chưa đọc — mở chuông 🔔 để xem.";
          toast.info(body, title);
        }

        prevUnread.current = unread;
      } catch {
        /* ignore network */
      }
    }

    poll();
    const interval = setInterval(poll, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user]);

  return null;
}
