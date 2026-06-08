import type { BadgeVariant } from "@/components/ui";

export interface StatusConfig {
  label: string;
  variant: BadgeVariant;
  /** Màu hex — dùng cho biểu đồ & viền thẻ trạng thái */
  color: string;
}

export const ORDER_STATUS_CONFIG: Record<string, StatusConfig> = {
  DRAFT: { label: "Nháp", variant: "gray", color: "#64748B" },
  PENDING: { label: "Chờ xác nhận", variant: "orange", color: "#EA580C" },
  CONFIRMED: { label: "Đã xác nhận", variant: "primary", color: "#2563EB" },
  PROCESSING: { label: "Đang xử lý", variant: "info", color: "#0284C7" },
  SHIPPED: { label: "Đang giao", variant: "purple", color: "#7C3AED" },
  DELIVERED: { label: "Đã giao", variant: "success", color: "#16A34A" },
  DELIVERED_ADMIN: { label: "Chờ xác nhận nhận", variant: "warning", color: "#D97706" },
  COMPLETED: { label: "Hoàn tất", variant: "teal", color: "#0D9488" },
  CANCELLED: { label: "Hủy", variant: "danger", color: "#DC2626" },
};

export const ORDER_STATUS_ORDER = [
  "DRAFT",
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "DELIVERED_ADMIN",
  "COMPLETED",
  "CANCELLED",
] as const;

export function getOrderStatus(status: string): StatusConfig {
  return ORDER_STATUS_CONFIG[status] ?? { label: status, variant: "gray", color: "#64748B" };
}
