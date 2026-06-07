"use client";

import { Badge, Card, StatCard } from "@/components/ui";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const monthlyData = [
  { month: "T1", nhap: 420, xuat: 380 },
  { month: "T2", nhap: 530, xuat: 490 },
  { month: "T3", nhap: 480, xuat: 450 },
  { month: "T4", nhap: 620, xuat: 580 },
  { month: "T5", nhap: 710, xuat: 660 },
  { month: "T6", nhap: 590, xuat: 540 },
];

const stockByWarehouse = [
  { name: "Kho Hà Nội", value: 3200, color: "#2563EB" },
  { name: "Kho TP.HCM", value: 4800, color: "#16A34A" },
  { name: "Kho Đà Nẵng", value: 1900, color: "#F59E0B" },
];

const recentOrders = [
  { id: "ĐH-2026-001", agent: "Chi nhánh Miền Nam", amount: "124.500.000đ", status: "Shipping" },
  { id: "ĐH-2026-002", agent: "Công ty ABC", amount: "89.200.000đ", status: "Confirmed" },
  { id: "ĐH-2026-003", agent: "Công ty Demo VN", amount: "205.800.000đ", status: "Delivered" },
];

const statusMap: Record<string, { label: string; variant: "primary" | "success" | "warning" | "gray" }> = {
  Confirmed: { label: "Xác nhận", variant: "primary" },
  Shipping: { label: "Đang giao", variant: "warning" },
  Delivered: { label: "Đã giao", variant: "success" },
};

export function DashboardScreen() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="Tổng Tồn Kho" value="11.000" change="demo" icon={<span>📦</span>} color="blue" />
        <StatCard title="Nhập Hôm Nay" value="248" change="+12%" icon={<span>📥</span>} color="green" />
        <StatCard title="Xuất Hôm Nay" value="186" change="+8%" icon={<span>📤</span>} color="yellow" />
        <StatCard title="Công Nợ" value="4.2 tỷ" icon={<span>💰</span>} color="red" />
        <StatCard title="Đơn Chờ XL" value="34" icon={<span>🛒</span>} color="purple" />
        <StatCard title="Đại Lý" value="128" change="+3 mới" icon={<span>🏪</span>} color="blue" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="p-5 xl:col-span-2">
          <h3 className="text-sm text-text-primary font-medium mb-1">Nhập Xuất Theo Tháng</h3>
          <p className="text-xs text-text-muted mb-4">Dữ liệu demo — chờ docs báo cáo</p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6B7280" }} />
              <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="nhap" name="Nhập" stroke="#2563EB" fill="#EFF6FF" />
              <Area type="monotone" dataKey="xuat" name="Xuất" stroke="#16A34A" fill="#F0FDF4" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm text-text-primary font-medium mb-4">Tồn Theo Kho</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={stockByWarehouse} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {stockByWarehouse.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="text-sm text-text-primary font-medium mb-4">Đơn Hàng Gần Đây</h3>
        <div className="space-y-3">
          {recentOrders.map((order) => (
            <div key={order.id} className="flex items-center justify-between py-2 border-b border-surface-subtle last:border-0">
              <div>
                <p className="text-sm text-text-primary">{order.id}</p>
                <p className="text-xs text-text-muted">{order.agent}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-text-primary">{order.amount}</p>
                <Badge variant={statusMap[order.status]?.variant ?? "gray"}>
                  {statusMap[order.status]?.label ?? order.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
