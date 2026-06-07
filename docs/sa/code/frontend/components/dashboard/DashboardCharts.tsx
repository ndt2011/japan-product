'use client';

/**
 * DashboardCharts — Biểu đồ đơn hàng + doanh thu
 *
 * Requires:  npm install recharts
 * Endpoints: GET /dashboard/charts/orders?period=30d
 *            GET /dashboard/charts/revenue?period=30d
 */

import { useState } from 'react';
import useSWR from 'swr';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';

// ─── Fetcher ─────────────────────────────────────────────────────────────────
const fetcher = (url: string) =>
  fetch(url, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  }).then((r) => r.json().then((d) => d.data));

// ─── Format helpers ───────────────────────────────────────────────────────────
function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function formatVNDShort(val: number): string {
  if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}B`;
  if (val >= 1_000_000)     return `${(val / 1_000_000).toFixed(0)}M`;
  return `${(val / 1000).toFixed(0)}K`;
}

// ─── Period selector ─────────────────────────────────────────────────────────
const PERIODS = [
  { label: '7 ngày',  value: '7d' },
  { label: '30 ngày', value: '30d' },
  { label: '90 ngày', value: '90d' },
];

// ─── Orders line chart ────────────────────────────────────────────────────────
export function OrdersChart() {
  const [period, setPeriod] = useState('30d');

  const { data, isLoading } = useSWR<{ date: string; count: number }[]>(
    `/api/dashboard/charts/orders?period=${period}`,
    fetcher,
    { refreshInterval: 5 * 60 * 1000 }
  );

  const chartData = (data ?? []).map((d) => ({
    date:  formatDate(d.date),
    count: d.count,
  }));

  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">Đơn hàng theo ngày</h3>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {isLoading ? (
        <ChartSkeleton />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
              formatter={(val: number) => [`${val} đơn`, 'Số đơn']}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 3, fill: '#3b82f6' }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ─── Revenue bar chart ────────────────────────────────────────────────────────
export function RevenueChart() {
  const [period, setPeriod] = useState('30d');

  const { data, isLoading } = useSWR<{ date: string; revenue: number }[]>(
    `/api/dashboard/charts/revenue?period=${period}`,
    fetcher,
    { refreshInterval: 5 * 60 * 1000 }
  );

  const chartData = (data ?? []).map((d) => ({
    date:    formatDate(d.date),
    revenue: d.revenue,
  }));

  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">Doanh thu (đơn đã giao)</h3>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {isLoading ? (
        <ChartSkeleton />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={formatVNDShort}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
              formatter={(val: number) => [
                new Intl.NumberFormat('vi-VN').format(val) + ' ₫',
                'Doanh thu',
              ]}
            />
            <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ─── Top products list ────────────────────────────────────────────────────────
interface TopProduct {
  id: number;
  product_cd: string;
  name_jp: string;
  order_count: number;
  revenue: number;
}

export function TopProductsList({ products }: { products: TopProduct[] }) {
  if (!products.length) return null;

  const max = products[0].revenue;

  return (
    <div className="bg-white rounded-xl border p-6">
      <h3 className="font-semibold text-gray-800 mb-4">Top sản phẩm tháng này</h3>
      <div className="space-y-3">
        {products.map((p, i) => (
          <div key={p.id} className="flex items-center gap-3">
            <span className="text-xs text-gray-400 w-4">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{p.name_jp}</p>
              <p className="text-xs text-gray-400">{p.product_cd} · {p.order_count} đơn</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-green-700">
                {formatVNDShort(p.revenue)}₫
              </p>
              {/* Mini progress bar */}
              <div className="w-24 h-1.5 bg-gray-100 rounded mt-1">
                <div
                  className="h-1.5 bg-green-500 rounded"
                  style={{ width: `${(p.revenue / max) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function PeriodSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex rounded-lg border overflow-hidden">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={`px-3 py-1 text-xs transition-colors ${
            value === p.value
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-500 hover:bg-gray-50'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="h-60 bg-gray-50 rounded-lg animate-pulse flex items-end gap-2 px-4 pb-4">
      {Array.from({ length: 15 }).map((_, i) => (
        <div
          key={i}
          className="flex-1 bg-gray-200 rounded-t"
          style={{ height: `${20 + Math.random() * 60}%` }}
        />
      ))}
    </div>
  );
}

// ─── Full dashboard page layout ───────────────────────────────────────────────
// Dùng trong app/dashboard/page.tsx:
//
// import StatsCards, { ExchangeRateBadge } from '@/components/dashboard/StatsCards';
// import { OrdersChart, RevenueChart, TopProductsList } from '@/components/dashboard/DashboardCharts';
// import useSWR from 'swr';
//
// export default function DashboardPage() {
//   const { data: stats } = useSWR('/api/dashboard/stats', fetcher, { refreshInterval: 300000 });
//
//   return (
//     <div className="space-y-6 p-6">
//       <StatsCards />
//       <div className="grid grid-cols-2 gap-6">
//         <OrdersChart />
//         <RevenueChart />
//       </div>
//       {stats?.top_products && <TopProductsList products={stats.top_products} />}
//     </div>
//   );
// }
