"use client";

import React from "react";
import { clsx } from "clsx";

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

type BadgeVariant = "primary" | "success" | "warning" | "danger" | "gray" | "info";

export function Badge({
  variant = "gray",
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
        {
          "bg-brand-light text-brand": variant === "primary",
          "bg-green-50 text-success": variant === "success",
          "bg-amber-50 text-warning": variant === "warning",
          "bg-red-50 text-danger": variant === "danger",
          "bg-surface-subtle text-text-muted": variant === "gray",
          "bg-sky-50 text-sky-600": variant === "info",
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

export function Input({
  className,
  label,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm text-text-body">{label}</label>}
      <input
        className={clsx(
          "w-full px-3 py-2 rounded-xl border border-border bg-white text-text-primary text-sm",
          "placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all",
          error && "border-danger",
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
  icon,
  color = "blue",
}: {
  title: string;
  value: string;
  change?: string;
  icon: React.ReactNode;
  color?: "blue" | "green" | "yellow" | "red" | "purple";
}) {
  const colors = {
    blue: "bg-brand-light text-brand",
    green: "bg-green-50 text-success",
    yellow: "bg-amber-50 text-warning",
    red: "bg-red-50 text-danger",
    purple: "bg-violet-50 text-purple-accent",
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wide mb-1">{title}</p>
          <p className="text-2xl text-text-primary">{value}</p>
          {change && (
            <p className="text-xs text-success mt-1 flex items-center gap-1">
              <span>↑</span> {change}
            </p>
          )}
        </div>
        <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center", colors[color])}>
          {icon}
        </div>
      </div>
    </Card>
  );
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
