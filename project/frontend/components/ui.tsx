"use client";

import { clsx } from "clsx";
import Link from "next/link";
import React from "react";

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
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset",
        {
          "bg-slate-100 text-slate-700 ring-slate-300": variant === "gray",
          "bg-blue-100 text-blue-800 ring-blue-300": variant === "primary",
          "bg-green-100 text-green-800 ring-green-300": variant === "success",
          "bg-amber-100 text-amber-800 ring-amber-300": variant === "warning",
          "bg-red-100 text-red-800 ring-red-300": variant === "danger",
          "bg-sky-100 text-sky-800 ring-sky-300": variant === "info",
          "bg-violet-100 text-violet-800 ring-violet-300": variant === "purple",
          "bg-orange-100 text-orange-800 ring-orange-300": variant === "orange",
          "bg-teal-100 text-teal-800 ring-teal-300": variant === "teal",
        },
        className,
      )}
      {...props}
    >
      {children}
    </span>
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
    <div className={clsx("relative", className)}>
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-placeholder text-sm">🔍</span>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-white text-sm text-text-primary placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
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

export function Modal({
  open,
  onClose,
  title,
  children,
  width = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={clsx("relative bg-white rounded-2xl shadow-2xl w-full", width)}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-base text-text-primary font-medium">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-subtle text-text-muted transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
