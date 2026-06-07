import React from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, StatCard, Badge } from "./ui";

const monthlyData = [
  { month: "T1", nhap: 420, xuat: 380 },
  { month: "T2", nhap: 530, xuat: 490 },
  { month: "T3", nhap: 480, xuat: 450 },
  { month: "T4", nhap: 620, xuat: 580 },
  { month: "T5", nhap: 710, xuat: 660 },
  { month: "T6", nhap: 590, xuat: 540 },
  { month: "T7", nhap: 680, xuat: 620 },
  { month: "T8", nhap: 740, xuat: 700 },
  { month: "T9", nhap: 820, xuat: 750 },
  { month: "T10", nhap: 760, xuat: 710 },
  { month: "T11", nhap: 890, xuat: 830 },
  { month: "T12", nhap: 950, xuat: 890 },
];

const stockByWarehouse = [
  { name: "Kho Hà Nội", value: 3200, color: "#2563EB" },
  { name: "Kho TP.HCM", value: 4800, color: "#16A34A" },
  { name: "Kho Đà Nẵng", value: 1900, color: "#F59E0B" },
  { name: "Kho Cần Thơ", value: 1100, color: "#7C3AED" },
];

const topProducts = [
  { name: "Laptop Dell XPS 15", sku: "LPT-001", sold: 124, stock: 45, trend: "+12%" },
  { name: "iPhone 15 Pro Max", sku: "PHN-023", sold: 98, stock: 32, trend: "+8%" },
  { name: "Samsung QLED 55\"", sku: "TV-045", sold: 76, stock: 18, trend: "+5%" },
  { name: "AirPods Pro 2", sku: "AUD-012", sold: 210, stock: 67, trend: "+22%" },
  { name: "iPad Air M2", sku: "TAB-007", sold: 65, stock: 28, trend: "+3%" },
];

const recentOrders = [
  { id: "ĐH-2024-0891", agent: "Đại lý Miền Nam", amount: "124.500.000đ", status: "Shipping", time: "2 giờ trước" },
  { id: "ĐH-2024-0890", agent: "TechStore Hà Nội", amount: "89.200.000đ", status: "Confirmed", time: "4 giờ trước" },
  { id: "ĐH-2024-0889", agent: "Mobile World", amount: "205.800.000đ", status: "Delivered", time: "1 ngày trước" },
  { id: "ĐH-2024-0888", agent: "Siêu Thị Điện Máy", amount: "76.400.000đ", status: "Draft", time: "1 ngày trước" },
];

const statusMap: Record<string, { label: string; variant: "primary" | "success" | "warning" | "gray" | "danger" }> = {
  Draft: { label: "Nháp", variant: "gray" },
  Confirmed: { label: "Xác nhận", variant: "primary" },
  Shipping: { label: "Đang giao", variant: "warning" },
  Delivered: { label: "Đã giao", variant: "success" },
  Cancelled: { label: "Hủy", variant: "danger" },
};

export function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Tổng Tồn Kho"
          value="11.000"
          change="vs tuần trước"
          icon={<span>📦</span>}
          color="blue"
        />
        <StatCard
          title="Nhập Hôm Nay"
          value="248"
          change="+12%"
          icon={<span>📥</span>}
          color="green"
        />
        <StatCard
          title="Xuất Hôm Nay"
          value="186"
          change="+8%"
          icon={<span>📤</span>}
          color="yellow"
        />
        <StatCard
          title="Công Nợ"
          value="4.2 tỷ"
          change="cần thu"
          icon={<span>💰</span>}
          color="red"
        />
        <StatCard
          title="Đơn Chờ XL"
          value="34"
          icon={<span>🛒</span>}
          color="purple"
        />
        <StatCard
          title="Đại Lý"
          value="128"
          change="+3 mới"
          icon={<span>🏪</span>}
          color="blue"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Area Chart */}
        <Card className="p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm text-[#111827]">Nhập Xuất Theo Tháng</h3>
              <p className="text-xs text-[#6B7280]">Tổng hàng hóa năm 2024</p>
            </div>
            <select className="text-xs border border-[#E5E7EB] rounded-lg px-2 py-1 text-[#374151] bg-white">
              <option>2024</option>
              <option>2023</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="nhapGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="xuatGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16A34A" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="nhap" name="Nhập" stroke="#2563EB" fill="url(#nhapGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="xuat" name="Xuất" stroke="#16A34A" fill="url(#xuatGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Pie Chart */}
        <Card className="p-5">
          <div className="mb-4">
            <h3 className="text-sm text-[#111827]">Tồn Kho Theo Kho</h3>
            <p className="text-xs text-[#6B7280]">Phân bổ hàng hóa</p>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={stockByWarehouse}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
              >
                {stockByWarehouse.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {stockByWarehouse.map((w) => (
              <div key={w.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: w.color }}
                  />
                  <span className="text-[#374151]">{w.name}</span>
                </div>
                <span className="text-[#111827]">{w.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Top Products */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm text-[#111827]">Top Sản Phẩm Bán Chạy</h3>
            <button className="text-xs text-[#2563EB] hover:underline">Xem tất cả</button>
          </div>
          <div className="space-y-3">
            {topProducts.map((p, i) => (
              <div key={p.sku} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-[#EFF6FF] text-[#2563EB] text-xs flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#111827] truncate">{p.name}</p>
                  <p className="text-xs text-[#9CA3AF]">{p.sku} · Tồn: {p.stock}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-[#111827]">{p.sold} đã bán</p>
                  <p className="text-xs text-[#16A34A]">{p.trend}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Orders */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm text-[#111827]">Đơn Hàng Gần Đây</h3>
            <button className="text-xs text-[#2563EB] hover:underline">Xem tất cả</button>
          </div>
          <div className="space-y-3">
            {recentOrders.map((o) => {
              const s = statusMap[o.status];
              return (
                <div key={o.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#F8FAFC] flex items-center justify-center text-sm shrink-0">
                    🛒
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#111827]">{o.id}</p>
                    <p className="text-xs text-[#9CA3AF] truncate">{o.agent}</p>
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <Badge variant={s.variant}>{s.label}</Badge>
                    <p className="text-xs text-[#6B7280]">{o.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
