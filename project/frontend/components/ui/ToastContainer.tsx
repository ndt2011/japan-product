"use client";

import { useToastStore, type ToastItem } from "@/stores/useToastStore";
import { clsx } from "clsx";
import { useEffect } from "react";

const STYLES: Record<ToastItem["type"], { bar: string; icon: string }> = {
  success: { bar: "border-l-success bg-green-50/95", icon: "✅" },
  error: { bar: "border-l-danger bg-red-50/95", icon: "❌" },
  info: { bar: "border-l-brand bg-brand/5", icon: "🔔" },
  warning: { bar: "border-l-warning bg-amber-50/95", icon: "⚠️" },
};

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const style = STYLES[item.type];

  useEffect(() => {
    const ms = item.duration ?? 4000;
    const t = setTimeout(onDismiss, ms);
    return () => clearTimeout(t);
  }, [item.duration, onDismiss]);

  return (
    <div
      role="alert"
      className={clsx(
        "pointer-events-auto w-full max-w-sm rounded-xl border border-border shadow-lg border-l-4 px-4 py-3",
        "transition-all",
        style.bar,
      )}
    >
      <div className="flex gap-3 items-start">
        <span className="text-lg shrink-0 leading-none mt-0.5" aria-hidden>
          {style.icon}
        </span>
        <div className="flex-1 min-w-0">
          {item.title && <p className="text-sm font-semibold text-text-primary">{item.title}</p>}
          <p className={clsx("text-sm text-text-body", item.title && "mt-0.5")}>{item.message}</p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 text-text-muted hover:text-text-primary text-xs p-1"
          aria-label="Đóng"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-16 right-3 md:right-6 z-[100] flex flex-col gap-2 w-[min(100vw-1.5rem,24rem)] pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((item) => (
        <ToastCard key={item.id} item={item} onDismiss={() => dismiss(item.id)} />
      ))}
    </div>
  );
}
