"use client";

import { Badge, Card, EmptyState, PageHeader, StatCard } from "@/components/ui";
import { useIsAdmin } from "@/hooks/usePermission";
import { getOrderStatus, ORDER_STATUS_ORDER } from "@/lib/status";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface DashboardStats {
  can_view_financial?: boolean;
  orders_today: number;
  orders_month: number;
  revenue_month_vnd: number;
  outstanding_debt_vnd?: number;
  low_stock_count?: number;
  products_total: number;
  companies_total?: number;
  branches_total?: number;
  orders_by_status: Record<string, number>;
  top_products: Array<{ id: number; name: string; order_count: number; revenue_vnd: number }>;
  inventory_alerts: Array<{ product_id: number; name: string; available_qty: number }>;
  exchange_rate: { jpy_vnd: number; updated_at?: string | null };
}

interface ChartPoint {
  date: string;
  count: number;
}

interface RevenueData {
  restricted?: boolean;
  revenue_vnd?: number;
  orders_count?: number;
  avg_order_value_vnd?: number;
  daily_chart?: Array<{ date: string; revenue: number; orders: number }>;
}

interface CashflowMonth {
  month: number;
  revenue: number;
  cost_import: number;
  gross_profit: number;
  gross_margin_pct: number;
}

function fmtVnd(n: number) {
  return `${new Intl.NumberFormat("vi-VN").format(n)}đ`;
}

function fmtShortDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export function DashboardScreen() {
  const isAdmin = useIsAdmin();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartPoints, setChartPoints] = useState<ChartPoint[]>([]);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [cashflow, setCashflow] = useState<CashflowMonth[]>([]);
  const [loading, setLoading] = useState(true);

  const canViewFinancial = stats?.can_view_financial !== false;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [statsRes, chartRes, revRes, cfRes] = await Promise.all([
          fetch("/api/proxy/dashboard/stats"),
          fetch("/api/proxy/dashboard/charts/orders?period=30"),
          fetch(`/api/proxy/dashboard/revenue?year=${year}&month=${month}`),
          fetch(`/api/proxy/dashboard/cashflow?year=${year}&from_month=1&to_month=${month}`),
        ]);
        const statsData = await statsRes.json();
        const chartData = await chartRes.json();
        const revData = await revRes.json();
        const cfData = await cfRes.json();

        if (!cancelled) {
          if (statsData.success && statsData.data) {
            setStats(statsData.data);
          }
          if (chartData.success && chartData.data?.points) {
            setChartPoints(chartData.data.points);
          }
          if (revData.success && revData.data && !revData.data.restricted) {
            setRevenue(revData.data);
          } else {
            setRevenue(null);
          }
          if (cfData.success && cfData.data?.monthly && !cfData.data.restricted) {
            setCashflow(cfData.data.monthly);
          } else {
            setCashflow([]);
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
  }, [year, month]);

  const pendingCount = stats?.orders_by_status?.PENDING ?? 0;
  const statusPie = useMemo(() => {
    if (!stats?.orders_by_status) return [];
    return ORDER_STATUS_ORDER.map((key) => {
      const cfg = getOrderStatus(key);
      const value = stats.orders_by_status[key] ?? 0;
      return { key, name: cfg.label, value, color: cfg.color };
    }).filter((row) => row.value > 0);
  }, [stats?.orders_by_status]);

  const chartData = useMemo(
    () => chartPoints.map((p) => ({ ...p, label: fmtShortDate(p.date) })),
    [chartPoints],
  );

  const revenueChart = useMemo(
    () =>
      (revenue?.daily_chart ?? []).map((p) => ({
        ...p,
        label: fmtShortDate(p.date),
      })),
    [revenue?.daily_chart],
  );

  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle={
          loading
            ? "Đang tải dữ liệu..."
            : `Tổng quan hoạt động · Tỷ giá JPY/VND: ${stats?.exchange_rate?.jpy_vnd ?? "—"}${
                stats?.exchange_rate?.updated_at ? ` (${stats.exchange_rate.updated_at})` : ""
              }`
        }
      />

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
        {canViewFinancial && (
          <StatCard
            title="Doanh Thu Tháng"
            value={loading ? "…" : fmtVnd(stats?.revenue_month_vnd ?? 0)}
            icon={<span>💰</span>}
            color="green"
          />
        )}
        <StatCard
          title="Chờ Xác Nhận"
          value={loading ? "…" : String(pendingCount)}
          icon={<span>⏳</span>}
          color="yellow"
        />
        <StatCard
          title="Sản Phẩm"
          value={loading ? "…" : String(stats?.products_total ?? 0)}
          icon={<span>📦</span>}
          color="blue"
        />
        {isAdmin ? (
          <>
            <StatCard
              title="Công Nợ"
              value={loading ? "…" : fmtVnd(stats?.outstanding_debt_vnd ?? 0)}
              icon={<span>🧾</span>}
              color="red"
            />
            <StatCard
              title="Cảnh Báo Tồn"
              value={loading ? "…" : String(stats?.low_stock_count ?? stats?.inventory_alerts?.length ?? 0)}
              icon={<span>⚠️</span>}
              color="red"
            />
            <StatCard
              title="Công Ty VN"
              value={loading ? "…" : String(stats?.companies_total ?? 0)}
              icon={<span>🏪</span>}
              color="purple"
            />
          </>
        ) : null}
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Trạng thái đơn hàng</h3>
            <p className="text-xs text-text-muted mt-0.5">Phân bổ theo từng giai đoạn xử lý</p>
          </div>
          <Link href="/orders" className="text-xs text-brand hover:underline">
            Xem tất cả đơn
          </Link>
        </div>
        {loading ? (
          <p className="text-sm text-text-muted">Đang tải...</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-3">
            {ORDER_STATUS_ORDER.map((key) => {
              const cfg = getOrderStatus(key);
              const count = stats?.orders_by_status?.[key] ?? 0;
              return (
                <Link
                  key={key}
                  href={`/orders?status=${key}`}
                  className="rounded-xl border border-border bg-white p-3 hover:shadow-sm transition-shadow"
                  style={{ borderLeftWidth: 4, borderLeftColor: cfg.color }}
                >
                  <Badge variant={cfg.variant} className="mb-2">
                    {cfg.label}
                  </Badge>
                  <p className="text-xl font-semibold text-text-primary">{count}</p>
                </Link>
              );
            })}
          </div>
        )}
      </Card>

      {canViewFinancial && (
        <Card className="p-5">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Doanh thu theo tháng</h3>
              <p className="text-xs text-text-muted mt-0.5">
                {revenue?.orders_count ?? 0} đơn · TB {fmtVnd(revenue?.avg_order_value_vnd ?? 0)}/đơn
              </p>
            </div>
            <div className="flex gap-2">
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="text-xs border border-border rounded-lg px-2 py-1.5"
              >
                {monthOptions.map((m) => (
                  <option key={m} value={m}>
                    Tháng {m}
                  </option>
                ))}
              </select>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="text-xs border border-border rounded-lg px-2 py-1.5"
              >
                {[year - 1, year, year + 1].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {loading ? (
            <EmptyState message="Đang tải..." icon="⏳" />
          ) : revenueChart.length === 0 ? (
            <EmptyState message="Chưa có doanh thu trong tháng." />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={revenueChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 12 }}
                  formatter={(value) => [fmtVnd(Number(value)), "Doanh thu"]}
                />
                <Area type="monotone" dataKey="revenue" stroke="#16A34A" fill="#16A34A22" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
          {cashflow.length > 0 && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              {cashflow.slice(-4).map((row) => (
                <div key={row.month} className="rounded-lg border border-border p-2">
                  <p className="text-text-muted">T{row.month}</p>
                  <p className="font-medium text-text-primary">{fmtVnd(row.revenue)}</p>
                  <p className="text-success">LN gộp {row.gross_margin_pct}%</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="p-5 xl:col-span-2">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-text-primary">Đơn hàng 30 ngày gần đây</h3>
            <p className="text-xs text-text-muted mt-0.5">Số đơn tạo mỗi ngày</p>
          </div>
          {loading ? (
            <EmptyState message="Đang tải biểu đồ..." icon="⏳" />
          ) : chartData.length === 0 ? (
            <EmptyState message="Chưa có dữ liệu đơn hàng." />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="orderGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 12 }}
                  formatter={(value) => [`${value} đơn`, "Số lượng"]}
                  labelFormatter={(_, payload) => {
                    const row = payload?.[0]?.payload as ChartPoint | undefined;
                    return row?.date ?? "";
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Đơn hàng"
                  stroke="#2563EB"
                  fill="url(#orderGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-text-primary">Tỷ lệ trạng thái</h3>
            <p className="text-xs text-text-muted mt-0.5">Phân bổ đơn hiện tại</p>
          </div>
          {loading ? (
            <EmptyState message="Đang tải..." icon="⏳" />
          ) : statusPie.length === 0 ? (
            <EmptyState message="Chưa có đơn hàng." />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={statusPie}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusPie.map((entry) => (
                      <Cell key={entry.key} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {statusPie.map((row) => (
                  <div key={row.key} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: row.color }}
                      />
                      <span className="text-text-body truncate">{row.name}</span>
                    </div>
                    <span className="text-text-primary font-medium shrink-0">{row.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      {isAdmin && stats?.inventory_alerts && stats.inventory_alerts.length > 0 && (
        <Card className="p-5 border-l-4 border-l-danger">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Tồn kho thấp (&lt; 10)</h3>
          <ul className="text-sm space-y-1">
            {stats.inventory_alerts.map((a) => (
              <li key={a.product_id} className="flex justify-between gap-2">
                <span>{a.name}</span>
                <Badge variant="danger">Còn {a.available_qty}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text-primary">Top sản phẩm đặt hàng</h3>
          <Link href="/products" className="text-xs text-brand hover:underline">
            Xem hàng hóa
          </Link>
        </div>
        {loading ? (
          <p className="text-sm text-text-muted">Đang tải...</p>
        ) : !stats?.top_products?.length ? (
          <EmptyState message="Chưa có dữ liệu bán hàng." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {stats.top_products.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                <span className="w-6 h-6 rounded-lg bg-brand-light text-brand text-xs flex items-center justify-center shrink-0 font-semibold">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary truncate">{p.name}</p>
                  <p className="text-xs text-text-muted">{p.order_count} đơn</p>
                </div>
                {canViewFinancial && (
                  <p className="text-sm text-text-primary shrink-0">{fmtVnd(p.revenue_vnd)}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
