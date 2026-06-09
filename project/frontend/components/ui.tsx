"use client";

import { clsx } from "clsx";
import { AlertTriangle, Search, X } from "lucide-react";
import Link from "next/link";
import React, { useEffect } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success" | "outline";
type ButtonSize = "sm" | "md" | "lg" | "icon";

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all cursor-pointer select-none whitespace-nowrap",
        {
          "bg-brand text-white hover:bg-brand-hover active:bg-brand-active": variant === "primary",
          "bg-white text-text-body border border-border hover:bg-surface-muted": variant === "secondary",
          "bg-transparent text-text-body hover:bg-surface-subtle": variant === "ghost",
          "bg-danger text-white hover:bg-red-700": variant === "danger",
          "bg-success text-white hover:bg-green-700": variant === "success",
          "border border-brand text-brand bg-transparent hover:bg-brand-light": variant === "outline",
          "px-3 py-1.5 text-xs": size === "sm",
          "px-4 py-2 text-sm": size === "md",
          "px-5 py-2.5 text-base": size === "lg",
          "w-8 h-8 p-0": size === "icon",
        },
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export type BadgeVariant =
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "gray"
  | "info"
  | "purple"
  | "orange"
  | "teal";

export function Badge({
  variant = "gray",
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-medium",
        {
          "bg-surface-subtle text-text-muted border-border": variant === "gray",
          "bg-brand-light text-brand border-brand/20": variant === "primary",
          "bg-green-50 text-success border-green-200": variant === "success",
          "bg-amber-50 text-warning border-amber-200": variant === "warning",
          "bg-red-50 text-danger border-red-200": variant === "danger",
          "bg-sky-50 text-sky-600 border-sky-200": variant === "info",
          "bg-violet-50 text-purple-accent border-violet-200": variant === "purple",
          "bg-orange-50 text-orange-600 border-orange-200": variant === "orange",
          "bg-teal-50 text-teal-600 border-teal-200": variant === "teal",
        },
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function IconButton({
  variant = "default",
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "primary" | "danger" | "success";
}) {
  return (
    <button
      type="button"
      className={clsx(
        "w-7 h-7 flex items-center justify-center rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
        {
          "text-text-muted hover:bg-surface-muted hover:text-text-primary": variant === "default",
          "text-text-muted hover:bg-brand-light hover:text-brand": variant === "primary",
          "text-text-muted hover:bg-red-50 hover:text-danger": variant === "danger",
          "text-text-muted hover:bg-green-50 hover:text-success": variant === "success",
        },
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function DetailGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx("grid grid-cols-2 gap-4", className)}>{children}</div>;
}

export function DetailField({
  label,
  children,
  className,
  span = 1,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  span?: 1 | 2;
}) {
  return (
    <div
      className={clsx(
        "p-4 rounded-xl bg-surface-muted/50 border border-border/50",
        span === 2 && "col-span-2",
        className,
      )}
    >
      <p className="text-[11px] font-medium text-text-muted uppercase tracking-wide mb-1">{label}</p>
      <div className="text-sm text-text-primary">{children}</div>
    </div>
  );
}

export function DetailTotal({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-end mt-3 p-3 bg-brand/5 rounded-xl border border-brand/20">
      <div className="text-right">
        <span className="text-text-muted text-sm">{label}</span>
        <span className="font-semibold text-brand ml-2 text-base">{value}</span>
      </div>
    </div>
  );
}

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx("bg-white rounded-xl border border-border shadow-sm", className)} {...props}>
      {children}
    </div>
  );
}

export function Select({
  label,
  error,
  options,
  placeholder,
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  options: { value: string | number; label: string }[];
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm text-text-body">{label}</label>}
      <select
        className={clsx(
          "w-full px-3 py-2 rounded-xl border border-border bg-white text-text-primary text-sm",
          "focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all",
          error && "border-danger",
          className,
        )}
        {...props}
      >
        {placeholder && (
          <option value="">{placeholder}</option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}

export function Input({
  className,
  label,
  error,
  hint,
  requiredMark,
  optional,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
  requiredMark?: boolean;
  optional?: boolean;
}) {
  const showRequired = requiredMark ?? props.required;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-text-body flex items-center gap-1.5 flex-wrap">
          <span>{label}</span>
          {showRequired && (
            <span className="text-danger text-xs" title="Bắt buộc">
              *
            </span>
          )}
          {optional && <span className="text-xs font-normal text-text-muted">(tùy chọn)</span>}
        </label>
      )}
      {hint && <p className="text-xs text-text-muted -mt-0.5 leading-relaxed">{hint}</p>}
      <input
        className={clsx(
          "w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface-subtle/50 text-text-primary text-sm",
          "placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand focus:bg-white transition-all",
          error && "border-danger focus:ring-danger/20",
          className,
        )}
        {...props}
      />
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}

export function Table({ className, children }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto">
      <table className={clsx("w-full text-sm", className)}>{children}</table>
    </div>
  );
}

export function Thead({ children }: { children: React.ReactNode }) {
  return <thead className="bg-surface border-b border-border">{children}</thead>;
}

export function Th({ className, children }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={clsx("px-4 py-3 text-left text-xs text-text-muted uppercase tracking-wide", className)}>
      {children}
    </th>
  );
}

export function Td({ className, children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={clsx("px-4 py-3 text-text-body border-b border-surface-subtle", className)} {...props}>
      {children}
    </td>
  );
}

export function Tr({ className, children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={clsx("hover:bg-surface transition-colors", className)} {...props}>
      {children}
    </tr>
  );
}

export function StatCard({
  title,
  value,
  change,
  hint,
  icon,
  color = "blue",
  href,
  highlight,
}: {
  title: string;
  value: string;
  change?: string;
  hint?: string;
  icon: React.ReactNode;
  color?: "blue" | "green" | "yellow" | "red" | "purple";
  href?: string;
  highlight?: boolean;
}) {
  const colors = {
    blue: "bg-brand-light text-brand",
    green: "bg-green-50 text-success",
    yellow: "bg-amber-50 text-warning",
    red: "bg-red-50 text-danger",
    purple: "bg-violet-50 text-purple-accent",
  };

  const inner = (
    <Card
      className={clsx(
        "p-4 sm:p-5 h-full transition-all",
        href && "hover:shadow-md hover:border-brand/30 cursor-pointer",
        highlight && "ring-2 ring-brand/20 border-brand/40 bg-brand/[0.02]",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] sm:text-xs text-text-muted font-medium uppercase tracking-wide mb-1 truncate">
            {title}
          </p>
          <p className="text-xl sm:text-2xl font-semibold text-text-primary leading-tight break-words">{value}</p>
          {hint && <p className="text-[11px] text-text-muted mt-1 line-clamp-2">{hint}</p>}
          {change && (
            <p className="text-xs text-success mt-1 flex items-center gap-1">
              <span>↑</span> {change}
            </p>
          )}
        </div>
        <div
          className={clsx(
            "w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 text-lg",
            colors[color],
          )}
        >
          {icon}
        </div>
      </div>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full no-underline text-inherit">
        {inner}
      </Link>
    );
  }
  return inner;
}

export function SearchInput({
  placeholder = "Tìm kiếm...",
  value,
  onChange,
  className,
}: {
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "flex items-center gap-2 bg-surface-muted rounded-lg px-3 py-2 min-w-48",
        className,
      )}
    >
      <Search className="w-3.5 h-3.5 text-text-placeholder shrink-0" strokeWidth={2} />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent border-none outline-none text-sm text-text-primary placeholder:text-text-placeholder flex-1 min-w-0"
      />
    </div>
  );
}

export function EmptyState({ message, icon }: { message: string; icon?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-4xl mb-3">{icon || "📭"}</div>
      <p className="text-text-muted text-sm">{message}</p>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-text-primary text-lg font-semibold">{title}</h1>
        {subtitle && <p className="text-sm text-text-muted mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function ComingSoonPanel({
  title,
  description,
  docRef,
}: {
  title: string;
  description: string;
  docRef?: string;
}) {
  return (
    <Card className="p-8">
      <div className="max-w-lg mx-auto text-center space-y-3">
        <div className="text-5xl">🚧</div>
        <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
        <p className="text-sm text-text-muted">{description}</p>
        {docRef && (
          <p className="text-xs text-text-placeholder bg-surface rounded-xl px-4 py-2 inline-block">
            Chờ tài liệu: {docRef}
          </p>
        )}
      </div>
    </Card>
  );
}

export function ModalFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-2", className)}
      {...props}
    >
      {children}
    </div>
  );
}

const MODAL_SIZES = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
} as const;

export function Modal({
  open,
  onClose,
  title,
  description,
  icon,
  headerIcon,
  children,
  footer,
  size = "md",
  width,
  closeOnOverlay = true,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  headerIcon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: keyof typeof MODAL_SIZES;
  width?: string;
  closeOnOverlay?: boolean;
}) {
  const modalWidth = width ?? MODAL_SIZES[size];
  const leadingIcon = headerIcon ?? icon;
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={closeOnOverlay ? onClose : undefined}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={clsx(
          "relative bg-white rounded-xl shadow-2xl border border-border w-full max-h-[90vh] flex flex-col animate-slide-up",
          modalWidth,
        )}
      >
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {leadingIcon && (
              <span className="shrink-0 flex items-center justify-center w-9 h-9 rounded-xl bg-brand-light text-brand">
                {leadingIcon}
              </span>
            )}
            <div className="min-w-0">
              <h3 id="modal-title" className="text-base text-text-primary font-semibold">
                {title}
              </h3>
              {description && <p className="text-sm text-text-muted mt-0.5">{description}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-muted text-text-muted transition-colors shrink-0"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
        {footer && <div className="px-6 pb-6 pt-0 shrink-0">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  detail,
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy",
  variant = "danger",
  loading = false,
  icon,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  detail?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  loading?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      headerIcon={icon ?? <AlertTriangle className="w-4 h-4" />}
      size="sm"
      footer={
        <ModalFooter>
          <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "danger" ? "danger" : "primary"}
            type="button"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Đang xử lý..." : confirmLabel}
          </Button>
        </ModalFooter>
      }
    >
      <p className="text-sm text-text-muted">{message}</p>
      {detail}
    </Modal>
  );
}
