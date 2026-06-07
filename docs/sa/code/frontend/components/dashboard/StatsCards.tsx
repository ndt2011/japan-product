'use client';

/**
 * Dashboard Stats Cards — kết nối GET /dashboard/stats
 *
 * Cần implement BE endpoint: GET /dashboard/stats (xem upgrade-roadmap.md T1-002)
 *
 * Cách dùng:
 *   import StatsCards from '@/components/dashboard/StatsCards';
 *   <StatsCards />
 */

import useSWR from 'swr';
import { TrendingUp, ShoppingCart, Package, AlertTriangle } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface DashboardStats {
  orders_today:     number;
  orders_month:     number;
  revenue_month_vnd: number;
  inventory_alerts: InventoryAlert[];
  orders_by_status: Record<string, number>;
  exchange_rate_current: { jpy_vnd: number; updated_at: string };
}

interface InventoryAlert {
  product_id: number;
  name_jp:    string;
  quantity:   number;
  min_threshold: number;
}

// ─── Fetcher ─────────────────────────────────────────────────────────────────
const fetcher = (url: string) =>
  fetch(url, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  }).then((r) => r.json().then((d) => d.data));

// ─── Format helpers ───────────────────────────────────────────────────────────
function formatVND(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B ₫`;
  if (amount >= 1_000_000)     return `${(amount / 1_000_000).toFixed(1)}M ₫`;
  return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100 animate-pulse">
      <div className="h-4 w-24 bg-gray-200 rounded mb-4" />
      <div className="h-8 w-32 bg-gray-200 rounded mb-2" />
      <div className="h-3 w-20 bg-gray-100 rounded" />
    </div>
  );
}

// ─── Single stat card ────────────────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  iconBg: string;
  trend?: number;  // % thay đổi so với kỳ trước (optional)
}

function StatCard({ title, value, sub, icon, iconBg, trend }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
          {trend !== undefined && (
            <p className={`text-xs mt-1 ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}% so với tháng trước
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${iconBg}`}>{icon}</div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function StatsCards() {
  const { data: stats, isLoading, error } = useSWR<DashboardStats>(
    '/api/dashboard/stats',
    fetcher,
    { refreshInterval: 5 * 60 * 1000 } // refresh 5 phút
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="text-sm text-red-500 p-4 bg-red-50 rounded-lg">
        Không tải được thống kê. Kiểm tra kết nối API.
      </div>
    );
  }

  const cards: StatCardProps[] = [
    {
      title:   'Đơn hàng hôm nay',
      value:   String(stats.orders_today),
      sub:     `Tháng này: ${stats.orders_month} đơn`,
      icon:    <ShoppingCart size={20} className="text-blue-600" />,
      iconBg:  'bg-blue-50',
    },
    {
      title:   'Doanh thu tháng',
      value:   formatVND(stats.revenue_month_vnd),
      sub:     `Tỷ giá: ¥1 = ${stats.exchange_rate_current.jpy_vnd}đ`,
      icon:    <TrendingUp size={20} className="text-green-600" />,
      iconBg:  'bg-green-50',
    },
    {
      title:   'Chờ xác nhận',
      value:   String(stats.orders_by_status['PENDING'] ?? 0),
      sub:     `Đang xử lý: ${stats.orders_by_status['PROCESSING'] ?? 0}`,
      icon:    <Package size={20} className="text-yellow-600" />,
      iconBg:  'bg-yellow-50',
    },
    {
      title:   'Cảnh báo tồn kho',
      value:   String(stats.inventory_alerts.length),
      sub:     stats.inventory_alerts.length > 0
        ? `"${stats.inventory_alerts[0].name_jp}" còn ${stats.inventory_alerts[0].quantity}`
        : 'Tồn kho ổn định',
      icon:    <AlertTriangle size={20} className={stats.inventory_alerts.length > 0 ? 'text-red-600' : 'text-gray-400'} />,
      iconBg:  stats.inventory_alerts.length > 0 ? 'bg-red-50' : 'bg-gray-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <StatCard key={card.title} {...card} />
      ))}
    </div>
  );
}

// ─── ExchangeRateBadge — dùng trong Header ───────────────────────────────────
export function ExchangeRateBadge() {
  const { data: stats } = useSWR<DashboardStats>('/api/dashboard/stats', fetcher, {
    refreshInterval: 30 * 60 * 1000, // 30 phút
  });

  if (!stats) return null;

  const { jpy_vnd, updated_at } = stats.exchange_rate_current;
  const time = new Date(updated_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
      ¥1 = <span className="font-semibold text-gray-700">{jpy_vnd.toLocaleString()}đ</span>
      <span className="ml-1 text-gray-400">· {time}</span>
    </div>
  );
}
