import type { BadgeVariant } from "@/components/ui";

export interface StatusConfig {
  label: string;
  variant: BadgeVariant;
  /** Màu hex — dùng cho biểu đồ & viền thẻ trạng thái */
  color: string;
}

export const ORDER_STATUS_CONFIG: Record<string, StatusConfig> = {
  DRAFT: { label: "Nháp", variant: "gray", color: "#64748B" },
  PENDING: { label: "Chờ duyệt", variant: "orange", color: "#EA580C" },
  APPROVED: { label: "Đã duyệt — chờ TT", variant: "primary", color: "#2563EB" },
  PAID: { label: "Đã thanh toán", variant: "teal", color: "#0D9488" },
  CONFIRMED: { label: "Đã xác nhận (cũ)", variant: "primary", color: "#2563EB" },
  PROCESSING: { label: "Chuẩn bị hàng", variant: "info", color: "#0284C7" },
  SHIPPING: { label: "Đang vận chuyển", variant: "purple", color: "#7C3AED" },
  SHIPPED: { label: "Đang giao", variant: "purple", color: "#7C3AED" },
  DELIVERED: { label: "Đã giao", variant: "success", color: "#16A34A" },
  DELIVERED_ADMIN: { label: "Chờ xác nhận nhận", variant: "warning", color: "#D97706" },
  COMPLETED: { label: "Hoàn tất", variant: "teal", color: "#0D9488" },
  CANCELLED: { label: "Hủy", variant: "danger", color: "#DC2626" },
};

export const ORDER_STATUS_ORDER = [
  "DRAFT",
  "PENDING",
  "APPROVED",
  "PAID",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPING",
  "SHIPPED",
  "DELIVERED",
  "DELIVERED_ADMIN",
  "COMPLETED",
  "CANCELLED",
] as const;

export function getOrderStatus(status: string): StatusConfig {
  return ORDER_STATUS_CONFIG[status] ?? { label: status, variant: "gray", color: "#64748B" };
}
