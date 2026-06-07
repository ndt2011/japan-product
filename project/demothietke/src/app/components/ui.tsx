import React from "react";
import { clsx } from "clsx";

// --- Button ---
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
          "bg-[#2563EB] text-white hover:bg-[#1D4ED8] active:bg-[#1E40AF]": variant === "primary",
          "bg-white text-[#374151] border border-[#E5E7EB] hover:bg-[#F9FAFB]": variant === "secondary",
          "bg-transparent text-[#374151] hover:bg-[#F3F4F6]": variant === "ghost",
          "bg-[#DC2626] text-white hover:bg-[#B91C1C]": variant === "danger",
          "bg-[#16A34A] text-white hover:bg-[#15803D]": variant === "success",
          "border border-[#2563EB] text-[#2563EB] bg-transparent hover:bg-[#EFF6FF]": variant === "outline",
          "px-3 py-1.5 text-xs": size === "sm",
          "px-4 py-2 text-sm": size === "md",
          "px-5 py-2.5 text-base": size === "lg",
          "w-8 h-8 p-0": size === "icon",
        },
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// --- Badge ---
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
          "bg-[#EFF6FF] text-[#2563EB]": variant === "primary",
          "bg-[#F0FDF4] text-[#16A34A]": variant === "success",
          "bg-[#FFFBEB] text-[#D97706]": variant === "warning",
          "bg-[#FEF2F2] text-[#DC2626]": variant === "danger",
          "bg-[#F3F4F6] text-[#6B7280]": variant === "gray",
          "bg-[#F0F9FF] text-[#0284C7]": variant === "info",
        },
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

// --- Card ---
export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx("bg-white rounded-xl border border-[#E5E7EB] shadow-sm", className)}
      {...props}
    >
      {children}
    </div>
  );
}

// --- Input ---
export function Input({
  className,
  label,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm text-[#374151]">{label}</label>}
      <input
        className={clsx(
          "w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-[#111827] text-sm",
          "placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]",
          "transition-all",
          error && "border-[#DC2626]",
          className
        )}
        {...props}
      />
      {error && <span className="text-xs text-[#DC2626]">{error}</span>}
    </div>
  );
}

// --- Select ---
export function Select({
  className,
  label,
  options,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm text-[#374151]">{label}</label>}
      <select
        className={clsx(
          "w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-[#111827] text-sm",
          "focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]",
          "transition-all appearance-none cursor-pointer",
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// --- Table ---
export function Table({ className, children }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto">
      <table className={clsx("w-full text-sm", className)}>{children}</table>
    </div>
  );
}

export function Thead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB]">
      {children}
    </thead>
  );
}

export function Th({ className, children }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={clsx(
        "px-4 py-3 text-left text-xs text-[#6B7280] uppercase tracking-wide select-none",
        className
      )}
    >
      {children}
    </th>
  );
}

export function Td({ className, children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={clsx("px-4 py-3 text-[#374151] border-b border-[#F3F4F6]", className)} {...props}>
      {children}
    </td>
  );
}

export function Tr({ className, children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={clsx("hover:bg-[#F8FAFC] transition-colors", className)} {...props}>
      {children}
    </tr>
  );
}

// --- Modal ---
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
          <h3 className="text-base text-[#111827]">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F3F4F6] text-[#6B7280] transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// --- Stat Card ---
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
    blue: "bg-[#EFF6FF] text-[#2563EB]",
    green: "bg-[#F0FDF4] text-[#16A34A]",
    yellow: "bg-[#FFFBEB] text-[#D97706]",
    red: "bg-[#FEF2F2] text-[#DC2626]",
    purple: "bg-[#F5F3FF] text-[#7C3AED]",
  };
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-[#6B7280] uppercase tracking-wide mb-1">{title}</p>
          <p className="text-2xl text-[#111827]">{value}</p>
          {change && (
            <p className="text-xs text-[#16A34A] mt-1 flex items-center gap-1">
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

// --- Search Input ---
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
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] text-sm">🔍</span>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
      />
    </div>
  );
}

// --- Empty State ---
export function EmptyState({ message, icon }: { message: string; icon?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-4xl mb-3">{icon || "📭"}</div>
      <p className="text-[#6B7280] text-sm">{message}</p>
    </div>
  );
}

// --- Page Header ---
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
        <h1 className="text-[#111827]">{title}</h1>
        {subtitle && <p className="text-sm text-[#6B7280] mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
