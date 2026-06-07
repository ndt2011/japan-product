"use client";

import { Badge, Card, EmptyState, StatCard } from "@/components/ui";
import { useIsAdmin } from "@/hooks/usePermission";
import type { OrderItem } from "@/types/api";
import { useEffect, useState } from "react";

interface DashboardStats {
  orders_today: number;
  orders_month: number;
  revenue_month_vnd: number;
  products_total: number;
  companies_total?: number;
  branches_total?: number;
  orders_by_status: Record<string, number>;
  top_products: Array<{ id: number; name: string; order_count: number; revenue_vnd: number }>;
  inventory_alerts: Array<{ product_id: number; name: string; available_qty: number }>;
  exchange_rate: { jpy_vnd: number; updated_at?: string | null };
}

const statusMap: Record<string, { label: string; variant: "primary" | "success" | "warning" | "gray" }> = {
  DRAFT: { label: "Nháp", variant: "gray" },
  PENDING: { label: "Chờ xác nhận", variant: "warning" },
  CONFIRMED: { label: "Đã xác nhận", variant: "primary" },
  DELIVERED: { label: "Đã giao", variant: "success" },
};

function fmtVnd(n: number) {
  return `${new Intl.NumberFormat("vi-VN").format(n)}đ`;
}

export function DashboardScreen() {
  const isAdmin = useIsAdmin();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [statsRes, ordersRes] = await Promise.all([
          fetch("/api/proxy/dashboard/stats"),
          fetch("/api/proxy/orders?per_page=5"),
        ]);
        const statsData = await statsRes.json();
        const ordersData = await ordersRes.json();

        if (!cancelled) {
          if (statsData.success && statsData.data) {
            setStats(statsData.data);
          }
          if (ordersData.success && ordersData.data?.items) {
            setRecentOrders(ordersData.data.items);
          }
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

  const alerts = stats?.inventory_alerts?.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Đơn Hôm Nay"
          value={loading ? "…" : String(stats?.orders_today ?? 0)}
          icon={<span>📋</span>}
          color="blue"
        />
        <StatCard
          title="Đơn Tháng"
          value={loading ? "…" : String(stats?.orders_month ?? 0)}
          icon={<span>🛒</span>}
          color="purple"
        />
        <StatCard
          title="Doanh Thu Tháng"
          value={loading ? "…" : fmtVnd(stats?.revenue_month_vnd ?? 0)}
          icon={<span>💰</span>}
          color="green"
        />
        <StatCard
          title="Sản Phẩm"
          value={loading ? "…" : String(stats?.products_total ?? 0)}
          icon={<span>📦</span>}
          color="yellow"
        />
        {isAdmin && (
          <>
            <StatCard
              title="Công Ty VN"
              value={loading ? "…" : String(stats?.companies_total ?? 0)}
              icon={<span>🏪</span>}
              color="blue"
            />
            <StatCard
              title="Cảnh Báo Tồn"
              value={loading ? "…" : String(alerts)}
              icon={<span>⚠️</span>}
              color="red"
            />
          </>
        )}
      </div>

      {isAdmin && stats?.inventory_alerts && stats.inventory_alerts.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-medium mb-3">Tồn kho thấp (&lt; 10)</h3>
          <ul className="text-sm space-y-1">
            {stats.inventory_alerts.map((a) => (
              <li key={a.product_id}>
                {a.name} — còn <strong>{a.available_qty}</strong>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {stats?.top_products && stats.top_products.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-medium mb-3">Top sản phẩm đặt hàng</h3>
          <div className="space-y-2">
            {stats.top_products.map((p) => (
              <div key={p.id} className="flex justify-between text-sm">
                <span>{p.name}</span>
                <span className="text-text-muted">{p.order_count} đơn · {fmtVnd(p.revenue_vnd)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-5">
        <h3 className="text-sm text-text-primary font-medium mb-4">Đơn Hàng Gần Đây</h3>
        {loading ? (
          <EmptyState message="Đang tải..." icon="⏳" />
        ) : recentOrders.length === 0 ? (
          <EmptyState message="Chưa có đơn hàng." />
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
                    <p className="text-xs text-text-muted">
                      {order.company_name ?? order.branch_name ?? "—"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-text-primary">
                      {order.total_vnd ? fmtVnd(Number(order.total_vnd)) : "—"}
                    </p>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {stats?.exchange_rate && (
        <p className="text-xs text-text-muted text-right">
          Tỷ giá JPY/VND: {stats.exchange_rate.jpy_vnd}
          {stats.exchange_rate.updated_at ? ` (${stats.exchange_rate.updated_at})` : ""}
        </p>
      )}
    </div>
  );
}
