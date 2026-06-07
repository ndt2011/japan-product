'use client';

/**
 * Branch Management Screens
 *
 * Gồm 3 component chính:
 * 1. BranchListPage     → /admin/branches       (admin only)
 * 2. BranchFormModal    → tạo/sửa chi nhánh     (admin only)
 * 3. BranchDashboard    → /branch/dashboard     (branch_manager)
 *
 * Note: Phase 1 đã done (commit ecba6d1) — file này bổ sung phần còn thiếu:
 *   - BranchFormModal (edit riêng + validate region/province)
 *   - BranchDashboard cho branch user
 */

import { useState } from 'react';
import { Plus, X, MapPin, Users, ShoppingCart } from 'lucide-react';
import useSWR from 'swr';
import { OrderProgress, StatusBadge } from '../orders/OrderStatusTabs';

const fetcher = (url: string) =>
  fetch(url, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  }).then((r) => r.json().then((d) => d.data));

// ─── Region → Province map ────────────────────────────────────────────────────
const REGIONS = ['Bắc', 'Trung', 'Nam'] as const;
type Region = (typeof REGIONS)[number];

const PROVINCES: Record<Region, string[]> = {
  Bắc: ['Hà Nội', 'Hải Phòng', 'Quảng Ninh', 'Bắc Ninh', 'Hải Dương', 'Hưng Yên', 'Thái Nguyên', 'Nam Định'],
  Trung: ['Đà Nẵng', 'Huế', 'Quảng Nam', 'Quảng Ngãi', 'Bình Định', 'Phú Yên', 'Khánh Hòa'],
  Nam: ['TP. Hồ Chí Minh', 'Bình Dương', 'Đồng Nai', 'Long An', 'Tiền Giang', 'Cần Thơ', 'An Giang', 'Vũng Tàu'],
};

// ─── 1. BranchListPage ────────────────────────────────────────────────────────
export function BranchListPage() {
  const [showForm, setShowForm] = useState(false);
  const [editBranch, setEditBranch] = useState<any>(null);
  const [regionFilter, setRegionFilter] = useState('');

  const { data: branches = [], mutate } = useSWR(
    `/api/branches${regionFilter ? `?region=${regionFilter}` : ''}`,
    fetcher
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý chi nhánh</h1>
        <button
          className="btn-primary flex items-center gap-2"
          onClick={() => { setEditBranch(null); setShowForm(true); }}
        >
          <Plus size={16} /> Tạo chi nhánh
        </button>
      </div>

      {/* Region filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setRegionFilter('')}
          className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
            !regionFilter ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:border-blue-400'
          }`}
        >
          Tất cả
        </button>
        {REGIONS.map((r) => (
          <button
            key={r}
            onClick={() => setRegionFilter(r)}
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
              regionFilter === r ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:border-blue-400'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Branch cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {branches.map((branch: any) => (
          <div key={branch.id} className="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">
                  {branch.branch_cd}
                </span>
                <h3 className="font-semibold text-gray-900 mt-1">{branch.branch_name}</h3>
              </div>
              <button
                onClick={() => { setEditBranch(branch); setShowForm(true); }}
                className="text-xs text-blue-600 hover:underline"
              >
                Sửa
              </button>
            </div>

            <div className="space-y-1.5 text-sm text-gray-500">
              <div className="flex items-center gap-1.5">
                <MapPin size={13} />
                {branch.region} · {branch.province}
              </div>
              <div className="flex items-center gap-1.5">
                <Users size={13} />
                {branch.users_count ?? 0} nhân viên
                {branch.manager && (
                  <span className="text-gray-400"> · Manager: {branch.manager.full_name}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Form modal */}
      {showForm && (
        <BranchFormModal
          branch={editBranch}
          onClose={() => setShowForm(false)}
          onSaved={() => { mutate(); setShowForm(false); }}
        />
      )}
    </div>
  );
}

// ─── 2. BranchFormModal ───────────────────────────────────────────────────────
interface BranchFormModalProps {
  branch?: any;
  onClose: () => void;
  onSaved: () => void;
}

export function BranchFormModal({ branch, onClose, onSaved }: BranchFormModalProps) {
  const isEdit = !!branch?.id;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fields, setFields] = useState({
    branch_cd:   branch?.branch_cd   ?? '',
    branch_name: branch?.branch_name ?? '',
    region:      (branch?.region ?? 'Bắc') as Region,
    province:    branch?.province    ?? '',
    address:     branch?.address     ?? '',
  });

  const set = (k: string, v: string) => setFields((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const url    = isEdit ? `/api/branches/${branch.id}` : '/api/branches';
      const method = isEdit ? 'PUT' : 'POST';

      const res  = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(fields),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.message ?? 'Lỗi');
        return;
      }

      onSaved();
    } catch {
      setError('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-900">
            {isEdit ? 'Sửa chi nhánh' : 'Tạo chi nhánh mới'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Mã chi nhánh *</label>
              <input required className="input" value={fields.branch_cd}
                onChange={(e) => set('branch_cd', e.target.value)} placeholder="HN-01"
                disabled={isEdit}
              />
            </div>
            <div>
              <label className="label">Vùng miền *</label>
              <select required className="input" value={fields.region}
                onChange={(e) => set('region', e.target.value)}>
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Tên chi nhánh *</label>
            <input required className="input" value={fields.branch_name}
              onChange={(e) => set('branch_name', e.target.value)} placeholder="Chi nhánh Hà Nội" />
          </div>

          <div>
            <label className="label">Tỉnh / Thành phố *</label>
            <select required className="input" value={fields.province}
              onChange={(e) => set('province', e.target.value)}>
              <option value="">-- Chọn tỉnh --</option>
              {PROVINCES[fields.region].map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Địa chỉ</label>
            <input className="input" value={fields.address}
              onChange={(e) => set('address', e.target.value)} placeholder="123 Đường ABC, Phường XYZ" />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Hủy</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo chi nhánh'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── 3. BranchDashboard ───────────────────────────────────────────────────────
// Route: /branch/dashboard — dành cho branch_manager + branch_staff
export function BranchDashboard() {
  const { data: orders = [], isLoading } = useSWR('/api/branch/orders?per_page=5', fetcher);
  const { data: stats } = useSWR('/api/dashboard/stats', fetcher);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard Chi nhánh</h1>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Đơn hôm nay',   value: stats?.orders_today ?? '—',                    color: 'blue' },
          { label: 'Tháng này',      value: stats?.orders_month ?? '—',                    color: 'purple' },
          { label: 'Chờ xác nhận',  value: stats?.orders_by_status?.['PENDING'] ?? 0,     color: 'yellow' },
          { label: 'Đang xử lý',    value: stats?.orders_by_status?.['PROCESSING'] ?? 0,  color: 'orange' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-xl border">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <ShoppingCart size={16} /> Đơn hàng gần đây
          </h2>
          <a href="/branch/orders" className="text-sm text-blue-600 hover:underline">Xem tất cả →</a>
        </div>

        <div className="divide-y">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="px-6 py-4 animate-pulse">
                <div className="h-4 w-48 bg-gray-200 rounded mb-2" />
                <div className="h-3 w-32 bg-gray-100 rounded" />
              </div>
            ))
          ) : orders.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-400">Chưa có đơn hàng nào</div>
          ) : (
            (orders.data ?? orders).slice(0, 5).map((order: any) => (
              <div key={order.id} className="px-6 py-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-sm font-medium text-gray-800">Đơn #{order.id}</span>
                    <span className="text-xs text-gray-400 ml-2">{order.created?.substring(0, 10)}</span>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
                <OrderProgress currentStatus={order.status} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
