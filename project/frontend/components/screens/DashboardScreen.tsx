"use client";

import { Badge, Card, EmptyState, StatCard } from "@/components/ui";
import type { OrderItem } from "@/types/api";
import { useEffect, useState } from "react";

const statusMap: Record<string, { label: string; variant: "primary" | "success" | "warning" | "gray" }> = {
  DRAFT: { label: "Nháp", variant: "gray" },
  PENDING: { label: "Chờ xác nhận", variant: "warning" },
  CONFIRMED: { label: "Đã xác nhận", variant: "primary" },
  PROCESSING: { label: "Đang xử lý", variant: "warning" },
  SHIPPED: { label: "Đang giao", variant: "primary" },
  DELIVERED: { label: "Đã giao", variant: "success" },
  CANCELLED: { label: "Hủy", variant: "gray" },
};

function fmtVnd(value: string | null | undefined) {
  if (!value) return "—";
  const n = Number(value);
  if (Number.isNaN(n)) return value;
  return `${new Intl.NumberFormat("vi-VN").format(n)}đ`;
}

export function DashboardScreen() {
  const [productTotal, setProductTotal] = useState(0);
  const [orderTotal, setOrderTotal] = useState(0);
  const [recentOrders, setRecentOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [productsRes, ordersRes] = await Promise.all([
          fetch("/api/proxy/products?per_page=1"),
          fetch("/api/proxy/orders?per_page=5"),
        ]);
        const productsData = await productsRes.json();
        const ordersData = await ordersRes.json();

        if (!cancelled) {
          if (productsData.success) {
            setProductTotal(productsData.data?.pagination?.total ?? 0);
          }
          if (ordersData.success && ordersData.data?.items) {
            setRecentOrders(ordersData.data.items);
            setOrderTotal(ordersData.data.pagination?.total ?? ordersData.data.items.length);
          }
        }
      } catch {
        if (!cancelled) {
          setProductTotal(0);
          setOrderTotal(0);
          setRecentOrders([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Sản Phẩm"
          value={loading ? "…" : String(productTotal)}
          icon={<span>📦</span>}
          color="blue"
        />
        <StatCard
          title="Đơn Hàng"
          value={loading ? "…" : String(orderTotal)}
          icon={<span>🛒</span>}
          color="purple"
        />
        <StatCard title="Nhập Hôm Nay" value="—" icon={<span>📥</span>} color="green" />
        <StatCard title="Xuất Hôm Nay" value="—" icon={<span>📤</span>} color="yellow" />
        <StatCard title="Công Nợ" value="—" icon={<span>💰</span>} color="red" />
        <StatCard title="Đại Lý" value="—" icon={<span>🏪</span>} color="blue" />
      </div>

      <Card className="p-5">
        <h3 className="text-sm text-text-primary font-medium mb-4">Đơn Hàng Gần Đây</h3>
        {loading ? (
          <EmptyState message="Đang tải..." icon="⏳" />
        ) : recentOrders.length === 0 ? (
          <EmptyState message="Chưa có đơn hàng. Tạo đơn mới tại menu Đơn hàng." />
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => {
              const status = statusMap[order.status] ?? { label: order.status, variant: "gray" as const };
              return (
                <div
                  key={order.id}
                  className="flex items-center justify-between py-2 border-b border-surface-subtle last:border-0"
                >
                  <div>
                    <p className="text-sm text-text-primary">{order.order_no}</p>
                    <p className="text-xs text-text-muted">{order.company_name ?? "—"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-text-primary">{fmtVnd(order.total_vnd)}</p>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card className="p-5">
        <EmptyState
          message="Biểu đồ nhập xuất, tồn kho và báo cáo sẽ hiển thị khi có dữ liệu thực từ hệ thống."
          icon="📊"
        />
      </Card>
    </div>
  );
}
