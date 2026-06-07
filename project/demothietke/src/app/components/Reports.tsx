import React, { useState } from "react";
import { Card, Button, Badge, PageHeader } from "./ui";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from "recharts";

const tabs = [
  { id: "stock", label: "Tồn Kho" },
  { id: "inout", label: "Nhập Xuất" },
  { id: "debt", label: "Công Nợ" },
  { id: "sales", label: "Hiệu Suất" },
];

const monthlyStock = [
  { month: "T1", ton: 8200 }, { month: "T2", ton: 9100 }, { month: "T3", ton: 8700 },
  { month: "T4", ton: 10200 }, { month: "T5", ton: 11000 }, { month: "T6", ton: 9800 },
  { month: "T7", ton: 10500 }, { month: "T8", ton: 11200 }, { month: "T9", ton: 10800 },
  { month: "T10", ton: 11500 }, { month: "T11", ton: 12000 }, { month: "T12", ton: 11000 },
];

const inOutData = [
  { month: "T7", nhap: 420, xuat: 380, loi: 40 },
  { month: "T8", nhap: 380, xuat: 350, loi: 30 },
  { month: "T9", nhap: 560, xuat: 520, loi: 40 },
  { month: "T10", nhap: 490, xuat: 460, loi: 30 },
  { month: "T11", nhap: 620, xuat: 580, loi: 40 },
  { month: "T12", nhap: 340, xuat: 310, loi: 30 },
];

const debtTrend = [
  { month: "T7", thu: 420, chua: 180 }, { month: "T8", thu: 380, chua: 220 },
  { month: "T9", thu: 560, chua: 140 }, { month: "T10", thu: 490, chua: 310 },
  { month: "T11", thu: 620, chua: 280 }, { month: "T12", thu: 340, chua: 490 },
];

const salesData = [
  { agent: "TGDĐ", revenue: 2400, orders: 87 },
  { agent: "MWG", revenue: 1800, orders: 63 },
  { agent: "ĐL MN", revenue: 3100, orders: 52 },
  { agent: "TechStore", revenue: 980, orders: 34 },
  { agent: "CellS", revenue: 1450, orders: 41 },
];

const categoryStock = [
  { name: "Điện thoại", value: 38, color: "#2563EB" },
  { name: "Laptop", value: 22, color: "#16A34A" },
  { name: "Phụ kiện", value: 25, color: "#F59E0B" },
  { name: "Màn hình", value: 10, color: "#7C3AED" },
  { name: "Âm thanh", value: 5, color: "#DC2626" },
];

export function Reports() {
  const [tab, setTab] = useState("stock");
  const [range, setRange] = useState("6m");

  const kpiCards = [
    { label: "Tổng Doanh Thu", value: "9.73 tỷ", change: "+18%", color: "text-[#2563EB]" },
    { label: "Tổng Nhập Kho", value: "3,310", change: "+12%", color: "text-[#16A34A]" },
    { label: "Tổng Xuất Kho", value: "2,600", change: "+9%", color: "text-[#D97706]" },
    { label: "Tỷ Lệ Thu Hồi", value: "68%", change: "+5%", color: "text-[#7C3AED]" },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Báo Cáo Vận Hành"
        subtitle="Phân tích dữ liệu kinh doanh"
        actions={
          <div className="flex items-center gap-2">
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="px-3 py-2 rounded-xl border border-[#E5E7EB] text-sm bg-white text-[#374151]"
            >
              <option value="1m">1 tháng</option>
              <option value="3m">3 tháng</option>
              <option value="6m">6 tháng</option>
              <option value="1y">1 năm</option>
            </select>
            <Button variant="secondary" size="sm">📤 Xuất PDF</Button>
            <Button variant="secondary" size="sm">📊 Xuất Excel</Button>
          </div>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpiCards.map((k) => (
          <Card key={k.label} className="p-4">
            <p className="text-xs text-[#6B7280]">{k.label}</p>
            <p className={`text-xl mt-1 ${k.color}`}>{k.value}</p>
            <p className="text-xs text-[#16A34A] mt-0.5">↑ {k.change} so với kỳ trước</p>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#F3F4F6] rounded-xl p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-lg text-sm transition-all ${tab === t.id ? "bg-white text-[#111827] shadow-sm" : "text-[#6B7280] hover:text-[#374151]"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Stock Report */}
      {tab === "stock" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Card className="p-5 xl:col-span-2">
            <h3 className="text-sm text-[#111827] mb-4">Biến Động Tồn Kho Theo Tháng</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyStock}>
                <defs>
                  <linearGradient id="tonGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Area type="monotone" dataKey="ton" name="Tồn kho" stroke="#2563EB" fill="url(#tonGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm text-[#111827] mb-4">Phân Bổ Theo Danh Mục</h3>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={categoryStock} cx="50%" cy="50%" outerRadius={65} paddingAngle={2} dataKey="value">
                  {categoryStock.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} formatter={(v) => [`${v}%`, ""]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {categoryStock.map((c) => (
                <div key={c.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                    <span className="text-[#374151]">{c.name}</span>
                  </div>
                  <span className="text-[#111827]">{c.value}%</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* In/Out Report */}
      {tab === "inout" && (
        <Card className="p-5">
          <h3 className="text-sm text-[#111827] mb-4">Nhập Xuất Kho 6 Tháng Gần Nhất</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={inOutData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="nhap" name="Nhập kho" fill="#2563EB" radius={[4, 4, 0, 0]} />
              <Bar dataKey="xuat" name="Xuất kho" fill="#16A34A" radius={[4, 4, 0, 0]} />
              <Bar dataKey="loi" name="Chênh lệch" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Debt Report */}
      {tab === "debt" && (
        <Card className="p-5">
          <h3 className="text-sm text-[#111827] mb-4">Thu Hồi Công Nợ (triệu đồng)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={debtTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="thu" name="Đã thu" fill="#16A34A" radius={[4, 4, 0, 0]} />
              <Bar dataKey="chua" name="Chưa thu" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Sales Performance */}
      {tab === "sales" && (
        <Card className="p-5">
          <h3 className="text-sm text-[#111827] mb-4">Hiệu Suất Bán Hàng Theo Đại Lý</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={salesData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis dataKey="agent" type="category" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} width={60} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="revenue" name="Doanh thu (triệu)" fill="#2563EB" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}
