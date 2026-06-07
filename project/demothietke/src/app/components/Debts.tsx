import React, { useState } from "react";
import { Card, Button, Badge, Table, Thead, Th, Td, Tr, PageHeader, SearchInput, Modal, Input } from "./ui";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const debtData = [
  { id: "CN-001", agent: "Đại Lý Miền Nam", agentCode: "ĐL-012", total: 890000000, paid: 440000000, unpaid: 450000000, overdue: 150000000, dueDate: "2024-12-20", status: "overdue" },
  { id: "CN-002", agent: "Thế Giới Di Động", agentCode: "ĐL-001", total: 450000000, paid: 0, unpaid: 450000000, overdue: 0, dueDate: "2024-12-25", status: "unpaid" },
  { id: "CN-003", agent: "Mobile World", agentCode: "ĐL-023", total: 320000000, paid: 320000000, unpaid: 0, overdue: 0, dueDate: "2024-12-15", status: "paid" },
  { id: "CN-004", agent: "TechStore HN", agentCode: "ĐL-007", total: 125000000, paid: 0, unpaid: 125000000, overdue: 0, dueDate: "2024-12-30", status: "unpaid" },
  { id: "CN-005", agent: "CellphoneS", agentCode: "ĐL-056", total: 215000000, paid: 100000000, unpaid: 115000000, overdue: 50000000, dueDate: "2024-12-18", status: "overdue" },
];

const monthlyDebt = [
  { month: "T7", thu: 420, chua: 180 },
  { month: "T8", thu: 380, chua: 220 },
  { month: "T9", thu: 560, chua: 140 },
  { month: "T10", thu: 490, chua: 310 },
  { month: "T11", thu: 620, chua: 280 },
  { month: "T12", thu: 340, chua: 490 },
];

const statusMap: Record<string, { label: string; variant: "success" | "warning" | "danger" | "gray" }> = {
  paid: { label: "Đã TT", variant: "success" },
  unpaid: { label: "Chưa TT", variant: "warning" },
  overdue: { label: "Quá Hạn", variant: "danger" },
};

function fmtM(n: number) {
  return (n / 1e6).toFixed(0) + " triệu";
}

export function Debts() {
  const [search, setSearch] = useState("");
  const [payOpen, setPayOpen] = useState(false);
  const [selected, setSelected] = useState(debtData[0]);

  const totalDebt = debtData.reduce((s, d) => s + d.unpaid, 0);
  const totalOverdue = debtData.reduce((s, d) => s + d.overdue, 0);
  const totalPaid = debtData.reduce((s, d) => s + d.paid, 0);

  const filtered = debtData.filter(
    (d) =>
      d.agent.toLowerCase().includes(search.toLowerCase()) ||
      d.agentCode.toLowerCase().includes(search.toLowerCase())
  );

  const pieData = [
    { name: "Đã TT", value: totalPaid / 1e6, color: "#16A34A" },
    { name: "Chưa TT", value: (totalDebt - totalOverdue) / 1e6, color: "#F59E0B" },
    { name: "Quá Hạn", value: totalOverdue / 1e6, color: "#DC2626" },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Theo Dõi Công Nợ"
        subtitle="Quản lý thanh toán và công nợ đại lý"
        actions={<Button size="sm" variant="secondary">📤 Xuất Báo Cáo</Button>}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Tổng Công Nợ", value: fmtM(totalDebt + totalPaid) + "đ", color: "text-[#111827]", bg: "bg-white" },
          { label: "Đã Thanh Toán", value: fmtM(totalPaid) + "đ", color: "text-[#16A34A]", bg: "bg-white" },
          { label: "Chưa Thanh Toán", value: fmtM(totalDebt) + "đ", color: "text-[#D97706]", bg: "bg-white" },
          { label: "Quá Hạn", value: fmtM(totalOverdue) + "đ", color: "text-[#DC2626]", bg: "bg-white" },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-[#6B7280]">{s.label}</p>
            <p className={`text-lg mt-1 ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="p-5 xl:col-span-2">
          <h3 className="text-sm text-[#111827] mb-4">Tình Hình Thu Hồi Công Nợ (triệu đồng)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyDebt}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="thu" name="Đã thu" fill="#16A34A" radius={[4, 4, 0, 0]} />
              <Bar dataKey="chua" name="Chưa thu" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm text-[#111827] mb-4">Phân Bổ Công Nợ</h3>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={3} dataKey="value">
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} formatter={(v) => [`${v} triệu`, ""]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {pieData.map((p) => (
              <div key={p.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                  <span className="text-[#374151]">{p.name}</span>
                </div>
                <span className="text-[#111827]">{p.value.toFixed(0)} triệu</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <div className="p-4 border-b border-[#F3F4F6]">
          <SearchInput placeholder="Tìm đại lý..." value={search} onChange={setSearch} className="max-w-sm" />
        </div>
        <Table>
          <Thead>
            <tr>
              <Th>Đại Lý</Th>
              <Th>Tổng Nợ</Th>
              <Th>Đã TT</Th>
              <Th>Chưa TT</Th>
              <Th>Quá Hạn</Th>
              <Th>Hạn TT</Th>
              <Th>Trạng Thái</Th>
              <Th>Thao Tác</Th>
            </tr>
          </Thead>
          <tbody>
            {filtered.map((d) => {
              const s = statusMap[d.status];
              return (
                <Tr key={d.id}>
                  <Td>
                    <div>
                      <p className="text-xs text-[#111827]">{d.agent}</p>
                      <p className="text-xs text-[#9CA3AF]">{d.agentCode}</p>
                    </div>
                  </Td>
                  <Td className="text-xs text-[#111827]">{fmtM(d.total)}đ</Td>
                  <Td className="text-xs text-[#16A34A]">{fmtM(d.paid)}đ</Td>
                  <Td className="text-xs text-[#D97706]">{fmtM(d.unpaid)}đ</Td>
                  <Td>
                    {d.overdue > 0 ? (
                      <span className="text-xs text-[#DC2626]">{fmtM(d.overdue)}đ</span>
                    ) : (
                      <span className="text-xs text-[#16A34A]">—</span>
                    )}
                  </Td>
                  <Td className="text-xs text-[#6B7280]">{d.dueDate}</Td>
                  <Td><Badge variant={s.variant}>{s.label}</Badge></Td>
                  <Td>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => { setSelected(d); setPayOpen(true); }}>Thu Nợ</Button>
                    </div>
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      </Card>

      {/* Payment Modal */}
      <Modal open={payOpen} onClose={() => setPayOpen(false)} title="Ghi Nhận Thanh Toán" width="max-w-sm">
        <div className="space-y-3">
          <div className="p-3 bg-[#F8FAFC] rounded-xl">
            <p className="text-xs text-[#6B7280]">Đại Lý: {selected?.agent}</p>
            <p className="text-xs text-[#6B7280] mt-1">Còn Nợ: <span className="text-[#DC2626]">{fmtM(selected?.unpaid || 0)}đ</span></p>
          </div>
          <Input label="Số Tiền Thu (đ)" placeholder="0" type="number" />
          <Input label="Ngày Thu" type="date" />
          <Input label="Phương Thức TT" placeholder="Chuyển khoản / Tiền mặt" />
          <Input label="Ghi Chú" placeholder="Ghi chú thanh toán..." />
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setPayOpen(false)}>Hủy</Button>
            <Button className="flex-1">Xác Nhận Thu</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
