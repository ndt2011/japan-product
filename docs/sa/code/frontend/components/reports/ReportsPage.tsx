'use client';

/**
 * ReportsPage — Trang báo cáo với 4 tab
 *
 * Route: /reports
 * Permission: admin (inventory/movements/revenue), all (orders)
 */

import { useState } from 'react';
import { Download, Filter } from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';

type ReportTab = 'inventory' | 'stock_movements' | 'orders' | 'revenue';

const TABS: { value: ReportTab; label: string; permission: string }[] = [
  { value: 'inventory',       label: 'Tồn kho',         permission: 'reports.inventory' },
  { value: 'stock_movements', label: 'Nhập/Xuất kho',   permission: 'reports.movements' },
  { value: 'orders',          label: 'Đơn hàng',         permission: 'reports.orders' },
  { value: 'revenue',         label: 'Doanh thu',        permission: 'reports.revenue' },
];

export default function ReportsPage() {
  const { can } = usePermission();
  const visibleTabs = TABS.filter((t) => can(t.permission));
  const [activeTab, setActiveTab] = useState<ReportTab>(visibleTabs[0]?.value ?? 'orders');

  const exportCsv = () => {
    const token = localStorage.getItem('token');
    const url   = `/api/reports/${activeTab.replace('_', '-')}?export=csv`;
    const link  = document.createElement('a');
    link.href   = url + '&token=' + token;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Báo cáo</h1>
        <button onClick={exportCsv} className="btn-secondary flex items-center gap-2">
          <Download size={16} />
          Xuất CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-1">
          {visibleTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.value
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'inventory'       && <InventoryReport />}
      {activeTab === 'stock_movements' && <StockMovementsReport />}
      {activeTab === 'orders'          && <OrdersReport />}
      {activeTab === 'revenue'         && <RevenueReport />}
    </div>
  );
}

// ─── 1. Inventory report ──────────────────────────────────────────────────────
function InventoryReport() {
  const [warehouseId, setWarehouseId] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch_ = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (warehouseId) params.set('warehouse_id', warehouseId);

    const res  = await fetch(`/api/reports/inventory?${params}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    const json = await res.json();
    setData(json.data ?? []);
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Kho</label>
          <input className="input w-40" placeholder="ID kho" value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} />
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={fetch_}>
          <Filter size={14} /> Lọc
        </button>
      </div>

      <ReportTable
        loading={loading}
        headers={['Kho', 'Mã SP', 'Tên SP (JP)', 'Danh mục', 'Tồn kho', 'Đơn giá (VND)', 'Tổng giá trị']}
        rows={data.map((r) => [
          r.warehouse_name, r.product_cd, r.name_jp, r.category_name,
          r.quantity, formatVND(r.unit_price_vnd), formatVND(r.total_value_vnd),
        ])}
      />
    </div>
  );
}

// ─── 2. Stock movements report ────────────────────────────────────────────────
function StockMovementsReport() {
  const [filters, setFilters] = useState({ warehouse_id: '', movement_type: '', date_from: '', date_to: '' });
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch_ = async () => {
    setLoading(true);
    const params = new URLSearchParams(Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v)
    ));
    const res  = await fetch(`/api/reports/stock-movements?${params}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    const json = await res.json();
    setData(json.data?.data ?? []);
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Loại</label>
          <select className="input w-36" value={filters.movement_type}
            onChange={(e) => setFilters((p) => ({ ...p, movement_type: e.target.value }))}>
            <option value="">Tất cả</option>
            <option value="IN">Nhập kho</option>
            <option value="OUT">Xuất kho</option>
            <option value="ADJUST">Kiểm kê</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Từ ngày</label>
          <input type="date" className="input" value={filters.date_from}
            onChange={(e) => setFilters((p) => ({ ...p, date_from: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Đến ngày</label>
          <input type="date" className="input" value={filters.date_to}
            onChange={(e) => setFilters((p) => ({ ...p, date_to: e.target.value }))} />
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={fetch_}>
          <Filter size={14} /> Lọc
        </button>
      </div>

      <ReportTable
        loading={loading}
        headers={['Ngày', 'Kho', 'Mã SP', 'Tên SP', 'Loại', 'SL', 'Trước', 'Sau', 'Ghi chú']}
        rows={data.map((r) => [
          r.created, r.warehouse_name, r.product_cd, r.name_jp,
          r.movement_type, r.quantity, r.quantity_before, r.quantity_after, r.note,
        ])}
      />
    </div>
  );
}

// ─── 3. Orders report ─────────────────────────────────────────────────────────
function OrdersReport() {
  const [filters, setFilters] = useState({ status: '', date_from: '', date_to: '' });
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch_ = async () => {
    setLoading(true);
    const params = new URLSearchParams(Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v)
    ));
    const res  = await fetch(`/api/reports/orders?${params}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    const json = await res.json();
    setData(json.data?.data ?? []);
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Trạng thái</label>
          <select className="input w-44" value={filters.status}
            onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}>
            <option value="">Tất cả</option>
            {['DRAFT','PENDING','CONFIRMED','PROCESSING','DELIVERED','CANCELLED'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Từ ngày</label>
          <input type="date" className="input" value={filters.date_from}
            onChange={(e) => setFilters((p) => ({ ...p, date_from: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Đến ngày</label>
          <input type="date" className="input" value={filters.date_to}
            onChange={(e) => setFilters((p) => ({ ...p, date_to: e.target.value }))} />
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={fetch_}>
          <Filter size={14} /> Lọc
        </button>
      </div>

      <ReportTable
        loading={loading}
        headers={['Mã đơn', 'Ngày đặt', 'Trạng thái', 'Công ty VN', 'Chi nhánh', 'Tổng tiền']}
        rows={data.map((r) => [
          r.order_id, r.order_date, r.status, r.company_name, r.branch_name, formatVND(r.total_amount_vnd),
        ])}
      />
    </div>
  );
}

// ─── 4. Revenue report ────────────────────────────────────────────────────────
function RevenueReport() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetch_ = async () => {
    setLoading(true);
    const res  = await fetch(`/api/reports/revenue?year=${year}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    const json = await res.json();
    setData(json.data);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Năm</label>
          <input type="number" min="2020" max="2099" className="input w-28"
            value={year} onChange={(e) => setYear(Number(e.target.value))} />
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={fetch_}>
          <Filter size={14} /> Xem
        </button>
      </div>

      {data && (
        <>
          <div className="bg-blue-50 rounded-lg px-6 py-4">
            <p className="text-sm text-gray-500">Tổng doanh thu năm {year}</p>
            <p className="text-3xl font-bold text-blue-700">{formatVND(data.total_revenue)}</p>
          </div>

          <ReportTable
            loading={loading}
            headers={['Tháng', 'Số đơn', 'Doanh thu (VND)', 'Tổng SL']}
            rows={(data.monthly ?? []).map((r: any) => [
              `Tháng ${r.month}`, r.order_count, formatVND(r.revenue_vnd), r.total_quantity,
            ])}
          />
        </>
      )}
    </div>
  );
}

// ─── Shared table component ───────────────────────────────────────────────────
function ReportTable({ headers, rows, loading }: {
  headers: string[];
  rows: (string | number | null | undefined)[][];
  loading: boolean;
}) {
  if (loading) {
    return <div className="h-48 flex items-center justify-center text-gray-400">Đang tải...</div>;
  }

  if (rows.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-400">
        Không có dữ liệu. Nhấn "Lọc" để tải báo cáo.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {headers.map((h) => (
              <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-gray-700">{cell ?? '—'}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatVND(n: number | null | undefined): string {
  if (!n) return '—';
  return new Intl.NumberFormat('vi-VN').format(n) + ' ₫';
}
