"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export interface AppNotification {
  id: number;
  type: string;
  title: string;
  body?: string | null;
  data_type?: string | null;
  data_id?: number | null;
  is_read?: boolean;
}

function notificationLink(n: AppNotification): string | null {
  if (n.data_type === "order" && n.data_id) return `/orders/${n.data_id}`;
  if (n.data_type === "ai_candidate" && n.data_id) return `/admin/ai-candidates`;
  if (n.data_type === "shipment" && n.data_id) return `/shipments/${n.data_id}`;
  return null;
}

interface Props {
  legacyTotal: number;
  legacyTitle?: string;
}

export function NotificationDropdown({ legacyTotal, legacyTitle }: Props) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const badgeTotal = unread + legacyTotal;

  async function loadCount() {
    try {
      const res = await fetch("/api/proxy/notifications/count");
      const data = await res.json();
      if (data.success) {
        setUnread(Number(data.data?.unread ?? 0));
      }
    } catch {
      /* ignore */
    }
  }

  async function loadList() {
    setLoading(true);
    try {
      const res = await fetch("/api/proxy/notifications?per_page=15&unread=1");
      const data = await res.json();
      if (data.success && data.data?.items) {
        setItems(data.data.items);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCount();
    const interval = setInterval(loadCount, 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  async function markRead(id: number) {
    await fetch(`/api/proxy/notifications/${id}/read`, { method: "PUT" });
    setItems((prev) => prev.filter((n) => n.id !== id));
    setUnread((c) => Math.max(0, c - 1));
  }

  async function markAll() {
    await fetch("/api/proxy/notifications/read-all", { method: "PUT" });
    setItems([]);
    setUnread(0);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) loadList();
        }}
        title={legacyTitle ?? "Thông báo"}
        className="relative w-8 h-8 flex items-center justify-center rounded-xl hover:bg-surface-subtle text-text-muted"
      >
        🔔
        {badgeTotal > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-danger text-white text-[10px] font-medium rounded-full flex items-center justify-center">
            {badgeTotal > 9 ? "9+" : badgeTotal}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-hidden bg-white border border-border rounded-xl shadow-lg z-50">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <p className="text-xs font-medium text-text-primary">Thông báo</p>
            {unread > 0 && (
              <button type="button" onClick={markAll} className="text-[10px] text-brand hover:underline">
                Đọc tất cả
              </button>
            )}
          </div>
          <div className="overflow-y-auto max-h-72">
            {loading ? (
              <p className="p-4 text-xs text-text-muted text-center">Đang tải...</p>
            ) : items.length === 0 ? (
              <p className="p-4 text-xs text-text-muted text-center">
                {legacyTotal > 0 ? "Xem công nợ / đơn chờ bên dưới" : "Không có thông báo mới"}
              </p>
            ) : (
              items.map((n) => (
                <div
                  key={n.id}
                  className="px-3 py-2.5 border-b border-border last:border-0 hover:bg-surface-subtle text-left"
                >
                  <p className="text-xs font-medium text-text-primary">{n.title}</p>
                  {n.body && <p className="text-[10px] text-text-muted mt-0.5 line-clamp-2">{n.body}</p>}
                  <div className="flex gap-2 mt-1.5">
                    {notificationLink(n) && (
                      <Link
                        href={notificationLink(n)!}
                        onClick={() => {
                          markRead(n.id);
                          setOpen(false);
                        }}
                        className="text-[10px] text-brand hover:underline"
                      >
                        Xem
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => markRead(n.id)}
                      className="text-[10px] text-text-muted hover:underline"
                    >
                      Đã đọc
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          {legacyTotal > 0 && (
            <div className="border-t border-border p-2 flex gap-2">
              <Link href="/debts" onClick={() => setOpen(false)} className="text-[10px] text-brand hover:underline">
                Công nợ
              </Link>
              <Link
                href="/orders?status=DELIVERED_ADMIN"
                onClick={() => setOpen(false)}
                className="text-[10px] text-brand hover:underline"
              >
                Đơn chờ xác nhận
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
