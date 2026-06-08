"use client";

import { Badge, Button, Card, EmptyState, PageHeader, StatCard } from "@/components/ui";
import { useIsAdmin, useIsCompany } from "@/hooks/usePermission";
import { getOrderStatus } from "@/lib/status";
import { useAuthStore } from "@/stores/useAuthStore";
import type { AuthUser } from "@/types/api";
import { clsx } from "clsx";
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

/** Trạng thái chính trên pipeline V3 — ẩn legacy khi count = 0 */
const PIPELINE_STATUSES = [
  "PENDING",
  "APPROVED",
  "PAID",
  "SHIPPING",
  "DELIVERED_ADMIN",
  "COMPLETED",
  "CANCELLED",
] as const;

function fmtVnd(n: number) {
  return `${new Intl.NumberFormat("vi-VN").format(n)}đ`;
}

function fmtVndCompact(n: number) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} tỷ`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} tr`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return fmtVnd(n);
}

function fmtShortDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function greetingName(user: AuthUser | null) {
  if (!user) return "bạn";
  if (user.user_type === "company") return user.company_name ?? user.login_id;
  return user.full_name ?? user.login_id;
}

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-24 rounded-xl bg-surface-subtle animate-pulse" />
      ))}
    </div>
  );
}

function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
      <div>
        <h3 className="text-sm sm:text-base font-semibold text-text-primary">{title}</h3>
        {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function DashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = useIsAdmin();
  const isCompany = useIsCompany();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartPoints, setChartPoints] = useState<ChartPoint[]>([]);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [cashflow, setCashflow] = useState<CashflowMonth[]>([]);
  const [loading, setLoading] = useState(true);

  const canViewFinancial = stats?.can_view_financial !== false;
  const pendingCount = stats?.orders_by_status?.PENDING ?? 0;
  const lowStock = stats?.low_stock_count ?? stats?.inventory_alerts?.length ?? 0;

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
          if (statsData.success && statsData.data) setStats(statsData.data);
          if (chartData.success && chartData.data?.points) setChartPoints(chartData.data.points);
          if (revData.success && revData.data && !revData.data.restricted) setRevenue(revData.data);
          else setRevenue(null);
          if (cfData.success && cfData.data?.monthly && !cfData.data.restricted) {
            setCashflow(cfData.data.monthly);
          } else setCashflow([]);
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

  const statusPie = useMemo(() => {
    if (!stats?.orders_by_status) return [];
    return PIPELINE_STATUSES.map((key) => {
      const cfg = getOrderStatus(key);
      const value = stats.orders_by_status[key] ?? 0;
      return { key, name: cfg.label, value, color: cfg.color };
    }).filter((row) => row.value > 0);
  }, [stats?.orders_by_status]);

  const pipelineCards = useMemo(() => {
    if (!stats?.orders_by_status) return [];
    return PIPELINE_STATUSES.map((key) => {
      const cfg = getOrderStatus(key);
      const count = stats.orders_by_status[key] ?? 0;
      return { key, cfg, count };
    }).filter((row) => row.count > 0);
  }, [stats?.orders_by_status]);

  const chartData = useMemo(
    () => chartPoints.map((p) => ({ ...p, label: fmtShortDate(p.date) })),
    [chartPoints],
  );

  const revenueChart = useMemo(
    () => (revenue?.daily_chart ?? []).map((p) => ({ ...p, label: fmtShortDate(p.date) })),
    [revenue?.daily_chart],
  );

  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);
  const totalOrdersInPipeline = pipelineCards.reduce((s, r) => s + r.count, 0);

  const quickActions = [
    ...(isCompany ||
    user?.user_type === "branch_manager" ||
    user?.user_type === "branch_staff"
      ? [{ href: "/orders/new", label: "Tạo đơn", icon: "➕" }]
      : []),
    {
      href: pendingCount > 0 ? "/orders?status=PENDING" : "/orders",
      label: pendingCount > 0 ? `Chờ duyệt (${pendingCount})` : "Đơn hàng",
      icon: "📋",
    },
    { href: "/products", label: "Sản phẩm", icon: "📦" },
    ...(isAdmin
      ? [
          { href: "/inventory", label: lowStock > 0 ? `Tồn kho (${lowStock})` : "Tồn kho", icon: "🏭" },
          { href: "/reports", label: "Báo cáo", icon: "📈" },
        ]
      : [{ href: "/reports", label: "Báo cáo", icon: "📈" }]),
  ].slice(0, 5);

  return (
    <div className="space-y-5 sm:space-y-6 pb-6">
      {/* Hero + tỷ giá */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <PageHeader
          title={`Xin chào, ${greetingName(user)}`}
          subtitle={
            loading
              ? "Đang tải dữ liệu tổng quan..."
              : `Cập nhật theo thời gian thực · ${stats?.orders_month ?? 0} đơn trong tháng ${month}/${year}`
          }
        />
        {stats?.exchange_rate?.jpy_vnd ? (
          <Card className="px-4 py-3 bg-gradient-to-r from-brand/5 to-sky-50 border-brand/20 shrink-0">
            <p className="text-[11px] text-text-muted font-medium uppercase tracking-wide">Tỷ giá tham chiếu</p>
            <p className="text-lg font-semibold text-text-primary">
              1 JPY = {new Intl.NumberFormat("vi-VN").format(stats.exchange_rate.jpy_vnd)} VND
            </p>
            {stats.exchange_rate.updated_at && (
              <p className="text-[11px] text-text-muted">Cập nhật: {stats.exchange_rate.updated_at}</p>
            )}
          </Card>
        ) : null}
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {quickActions.map((action) => (
          <Link key={action.href + action.label} href={action.href}>
            <Button
              variant={action.label.includes("Chờ duyệt") ? "primary" : "secondary"}
              size="sm"
              className="whitespace-nowrap shadow-sm"
            >
              <span>{action.icon}</span>
              {action.label}
            </Button>
          </Link>
        ))}
      </div>

      {/* KPI chính */}
      {loading ? (
        <KpiSkeleton />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            title="Đơn hôm nay"
            value={String(stats?.orders_today ?? 0)}
            hint="Đơn tạo trong ngày"
            icon={<span>📋</span>}
            color="blue"
            href="/orders"
          />
          <StatCard
            title="Chờ xử lý"
            value={String(pendingCount)}
            hint={pendingCount > 0 ? "Cần duyệt sớm" : "Không có đơn chờ"}
            icon={<span>⏳</span>}
            color="yellow"
            href="/orders?status=PENDING"
            highlight={pendingCount > 0}
          />
          {canViewFinancial ? (
            <StatCard
              title="Doanh thu tháng"
              value={fmtVndCompact(stats?.revenue_month_vnd ?? 0)}
              hint={fmtVnd(stats?.revenue_month_vnd ?? 0)}
              icon={<span>💰</span>}
              color="green"
              href="/reports"
            />
          ) : (
            <StatCard
              title="Đơn tháng"
              value={String(stats?.orders_month ?? 0)}
              hint={`Tháng ${month}/${year}`}
              icon={<span>🛒</span>}
              color="purple"
              href="/orders"
            />
          )}
          <StatCard
            title="Sản phẩm"
            value={String(stats?.products_total ?? 0)}
            hint="Trong catalog"
            icon={<span>📦</span>}
            color="blue"
            href="/products"
          />
        </div>
      )}

      {/* KPI phụ — admin */}
      {isAdmin && !loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            title="Công nợ"
            value={fmtVndCompact(stats?.outstanding_debt_vnd ?? 0)}
            icon={<span>🧾</span>}
            color="red"
            href="/debts"
          />
          <StatCard
            title="Tồn thấp"
            value={String(lowStock)}
            hint={lowStock > 0 ? "Cần nhập hàng" : "Ổn định"}
            icon={<span>⚠️</span>}
            color={lowStock > 0 ? "red" : "green"}
            href="/inventory"
            highlight={lowStock > 0}
          />
          <StatCard
            title="Công ty VN"
            value={String(stats?.companies_total ?? 0)}
            icon={<span>🏪</span>}
            color="purple"
            href="/admin"
          />
          <StatCard
            title="Đơn tháng"
            value={String(stats?.orders_month ?? 0)}
            icon={<span>📊</span>}
            color="blue"
          />
        </div>
      )}

      {/* Pipeline đơn hàng — scroll ngang mobile */}
      <Card className="p-4 sm:p-5">
        <SectionTitle
          title="Luồng đơn hàng"
          subtitle={`${totalOrdersInPipeline} đơn đang theo dõi · bấm để lọc`}
          action={
            <Link href="/orders" className="text-xs font-medium text-brand hover:underline">
              Tất cả đơn →
            </Link>
          }
        />
        {loading ? (
          <div className="h-20 rounded-lg bg-surface-subtle animate-pulse" />
        ) : pipelineCards.length === 0 ? (
          <EmptyState message="Chưa có đơn hàng nào." icon="📭" />
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory">
            {pipelineCards.map(({ key, cfg, count }) => (
              <Link
                key={key}
                href={`/orders?status=${key}`}
                className="snap-start min-w-[140px] sm:min-w-[160px] flex-shrink-0 rounded-xl border border-border bg-white p-3 sm:p-4 hover:shadow-md hover:border-brand/30 transition-all"
                style={{ borderTopWidth: 3, borderTopColor: cfg.color }}
              >
                <Badge variant={cfg.variant} className="mb-2 text-[10px] sm:text-xs">
                  {cfg.label}
                </Badge>
                <p className="text-2xl sm:text-3xl font-bold text-text-primary tabular-nums">{count}</p>
                <p className="text-[11px] text-text-muted mt-1">Xem danh sách</p>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Cảnh báo tồn kho */}
      {isAdmin && !loading && stats?.inventory_alerts && stats.inventory_alerts.length > 0 && (
        <Card className="p-4 sm:p-5 border-l-4 border-l-danger bg-red-50/30">
          <SectionTitle
            title="Cảnh báo tồn kho thấp"
            subtitle="Sản phẩm dưới ngưỡng an toàn"
            action={
              <Link href="/inventory" className="text-xs font-medium text-danger hover:underline">
                Quản lý kho →
              </Link>
            }
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {stats.inventory_alerts.slice(0, 6).map((a) => (
              <div
                key={a.product_id}
                className="flex items-center justify-between gap-2 rounded-lg bg-white border border-red-100 px-3 py-2"
              >
                <span className="text-sm text-text-primary truncate">{a.name}</span>
                <Badge variant="danger" className="shrink-0">
                  {a.available_qty}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Doanh thu tháng */}
      {canViewFinancial && (
        <Card className="p-4 sm:p-5">
          <SectionTitle
            title="Doanh thu theo ngày"
            subtitle={
              revenue
                ? `${revenue.orders_count ?? 0} đơn · TB ${fmtVndCompact(revenue.avg_order_value_vnd ?? 0)}/đơn`
                : "Chọn tháng để xem chi tiết"
            }
            action={
              <div className="flex gap-2">
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="text-xs border border-border rounded-lg px-2.5 py-2 bg-white focus:ring-2 focus:ring-brand/30 focus:outline-none"
                  aria-label="Chọn tháng"
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
                  className="text-xs border border-border rounded-lg px-2.5 py-2 bg-white focus:ring-2 focus:ring-brand/30 focus:outline-none"
                  aria-label="Chọn năm"
                >
                  {[year - 1, year, year + 1].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            }
          />
          {loading ? (
            <div className="h-[220px] rounded-lg bg-surface-subtle animate-pulse" />
          ) : revenueChart.length === 0 ? (
            <EmptyState message="Chưa có doanh thu trong tháng này." icon="📉" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={revenueChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#6B7280" }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => fmtVndCompact(Number(v))}
                  width={48}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                  formatter={(value) => [fmtVnd(Number(value)), "Doanh thu"]}
                  labelFormatter={(_, payload) => {
                    const row = payload?.[0]?.payload as { date?: string } | undefined;
                    return row?.date ? `Ngày ${fmtShortDate(row.date)}` : "";
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#16A34A" fill="#16A34A18" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          )}
          {cashflow.length > 0 && (
            <div className="mt-5 pt-4 border-t border-border">
              <p className="text-xs font-medium text-text-muted mb-3 uppercase tracking-wide">Dòng tiền theo tháng</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {cashflow.slice(-4).map((row) => (
                  <div key={row.month} className="rounded-xl border border-border bg-surface-subtle/50 p-3">
                    <p className="text-xs text-text-muted">Tháng {row.month}</p>
                    <p className="text-sm font-semibold text-text-primary mt-0.5">{fmtVndCompact(row.revenue)}</p>
                    <p className="text-xs text-success mt-1">LN gộp {row.gross_margin_pct}%</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Biểu đồ đơn + pie */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <Card className="p-4 sm:p-5 xl:col-span-3">
          <SectionTitle
            title="Đơn hàng 30 ngày"
            subtitle="Số đơn tạo mỗi ngày"
          />
          {loading ? (
            <div className="h-[240px] rounded-lg bg-surface-subtle animate-pulse" />
          ) : chartData.length === 0 ? (
            <EmptyState message="Chưa có dữ liệu đơn hàng." icon="📊" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="orderGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#6B7280" }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                  formatter={(value) => [`${value} đơn`, "Số lượng"]}
                  labelFormatter={(_, payload) => {
                    const row = payload?.[0]?.payload as ChartPoint | undefined;
                    return row?.date ? `Ngày ${fmtShortDate(row.date)}` : "";
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Đơn hàng"
                  stroke="#2563EB"
                  fill="url(#orderGrad)"
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-4 sm:p-5 xl:col-span-2">
          <SectionTitle title="Phân bổ trạng thái" subtitle="Tỷ lệ đơn hiện tại" />
          {loading ? (
            <div className="h-[200px] rounded-lg bg-surface-subtle animate-pulse" />
          ) : statusPie.length === 0 ? (
            <EmptyState message="Chưa có đơn hàng." icon="🥧" />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={statusPie}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusPie.map((entry) => (
                      <Cell key={entry.key} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 12, fontSize: 12 }}
                    formatter={(value, name) => [`${value} đơn`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2 max-h-40 overflow-y-auto pr-1">
                {statusPie.map((row) => (
                  <Link
                    key={row.key}
                    href={`/orders?status=${row.key}`}
                    className="flex items-center justify-between text-xs rounded-lg px-2 py-1.5 hover:bg-surface-subtle transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: row.color }} />
                      <span className="text-text-body truncate">{row.name}</span>
                    </div>
                    <span className="text-text-primary font-semibold shrink-0 tabular-nums">{row.value}</span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Top sản phẩm */}
      <Card className="p-4 sm:p-5">
        <SectionTitle
          title="Top sản phẩm đặt hàng"
          subtitle="Theo số đơn trong kỳ gần nhất"
          action={
            <Link href="/products" className="text-xs font-medium text-brand hover:underline">
              Xem catalog →
            </Link>
          }
        />
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 rounded-lg bg-surface-subtle animate-pulse" />
            ))}
          </div>
        ) : !stats?.top_products?.length ? (
          <EmptyState message="Chưa có dữ liệu bán hàng." icon="🏆" />
        ) : (
          <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
            {stats.top_products.map((p, i) => (
              <Link
                key={p.id}
                href={`/products/${p.id}`}
                className="flex items-center gap-3 px-3 sm:px-4 py-3 hover:bg-surface-subtle/80 transition-colors"
              >
                <span
                  className={clsx(
                    "w-7 h-7 rounded-lg text-xs flex items-center justify-center shrink-0 font-bold",
                    i === 0 ? "bg-amber-100 text-amber-800" : i === 1 ? "bg-slate-200 text-slate-700" : i === 2 ? "bg-orange-100 text-orange-800" : "bg-brand-light text-brand",
                  )}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{p.name}</p>
                  <p className="text-xs text-text-muted">{p.order_count} đơn đặt</p>
                </div>
                {canViewFinancial && (
                  <p className="text-sm font-semibold text-text-primary shrink-0 tabular-nums">
                    {fmtVndCompact(p.revenue_vnd)}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
