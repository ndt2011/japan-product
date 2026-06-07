import React, { useState } from "react";
import { Card, Button, Badge, SearchInput, Table, Thead, Th, Td, Tr, Modal, Input, Select, PageHeader } from "./ui";

const agentsData = [
  { id: "ĐL-001", name: "Thế Giới Di Động", contact: "Nguyễn Văn Hùng", phone: "028 3826 0000", email: "order@thegioididong.com", address: "Hệ thống toàn quốc", debt: 450000000, status: "active", orders: 87, tier: "Gold" },
  { id: "ĐL-007", name: "TechStore Hà Nội", contact: "Trần Thị Mai", phone: "024 3825 1111", email: "mai@techstore.vn", address: "Đống Đa, Hà Nội", debt: 125000000, status: "active", orders: 34, tier: "Silver" },
  { id: "ĐL-012", name: "Đại Lý Miền Nam Corp", contact: "Lê Quốc Toàn", phone: "028 3812 5678", email: "toan@dlmiennam.vn", address: "Bình Thạnh, TP.HCM", debt: 890000000, status: "active", orders: 52, tier: "Platinum" },
  { id: "ĐL-023", name: "Mobile World Group", contact: "Phạm Văn Bình", phone: "1800 1090", email: "binh@mwg.vn", address: "Toàn quốc", debt: 320000000, status: "active", orders: 63, tier: "Gold" },
  { id: "ĐL-034", name: "Siêu Thị Điện Máy BT", contact: "Hoàng Thị Cúc", phone: "025 3678 9012", email: "cuc@dmaybinhthuan.vn", address: "Bình Thuận", debt: 78500000, status: "inactive", orders: 12, tier: "Bronze" },
  { id: "ĐL-056", name: "CellphoneS Corp", contact: "Vũ Minh Khoa", phone: "1800 2097", email: "khoa@cellphones.com.vn", address: "Toàn quốc", debt: 215000000, status: "active", orders: 41, tier: "Silver" },
];

type Agent = typeof agentsData[0];

const tierColors: Record<string, string> = {
  Bronze: "bg-[#FEF3C7] text-[#92400E]",
  Silver: "bg-[#F3F4F6] text-[#374151]",
  Gold: "bg-[#FFFBEB] text-[#D97706]",
  Platinum: "bg-[#EFF6FF] text-[#2563EB]",
};

function fmtMoney(n: number) {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + " tỷ";
  if (n >= 1e6) return (n / 1e6).toFixed(0) + " triệu";
  return n.toLocaleString("vi-VN") + "đ";
}

export function Agents() {
  const [agents, setAgents] = useState(agentsData);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Agent | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<Agent | null>(null);

  const [form, setForm] = useState({ name: "", contact: "", phone: "", email: "", address: "", tier: "Bronze", status: "active" });

  const filtered = agents.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.id.toLowerCase().includes(search.toLowerCase())
  );

  const totalDebt = agents.reduce((sum, a) => sum + a.debt, 0);

  function openEdit(a: Agent) {
    setEditItem(a);
    setForm({ name: a.name, contact: a.contact, phone: a.phone, email: a.email, address: a.address, tier: a.tier, status: a.status });
    setModalOpen(true);
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Quản Lý Đại Lý"
        subtitle={`${agents.length} đại lý`}
        actions={
          <>
            <Button variant="secondary" size="sm">📤 Xuất Excel</Button>
            <Button size="sm" onClick={() => { setEditItem(null); setForm({ name: "", contact: "", phone: "", email: "", address: "", tier: "Bronze", status: "active" }); setModalOpen(true); }}>+ Thêm Đại Lý</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4">
          <p className="text-xs text-[#6B7280]">Tổng Đại Lý</p>
          <p className="text-xl text-[#2563EB] mt-1">{agents.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[#6B7280]">Đang Hoạt Động</p>
          <p className="text-xl text-[#16A34A] mt-1">{agents.filter((a) => a.status === "active").length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[#6B7280]">Tổng Công Nợ</p>
          <p className="text-xl text-[#DC2626] mt-1">{fmtMoney(totalDebt)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[#6B7280]">Tổng Đơn Hàng</p>
          <p className="text-xl text-[#111827] mt-1">{agents.reduce((s, a) => s + a.orders, 0)}</p>
        </Card>
      </div>

      <Card className="p-4">
        <SearchInput placeholder="Tìm đại lý..." value={search} onChange={setSearch} />
      </Card>

      <Card>
        <Table>
          <Thead>
            <tr>
              <Th>Mã ĐL</Th>
              <Th>Tên Đại Lý</Th>
              <Th>Người Liên Hệ</Th>
              <Th>Điện Thoại</Th>
              <Th>Đơn Hàng</Th>
              <Th>Công Nợ</Th>
              <Th>Hạng</Th>
              <Th>Trạng Thái</Th>
              <Th>Thao Tác</Th>
            </tr>
          </Thead>
          <tbody>
            {filtered.map((a) => (
              <Tr key={a.id}>
                <Td><span className="text-[#2563EB] text-xs font-medium">{a.id}</span></Td>
                <Td>
                  <div>
                    <p className="text-xs text-[#111827]">{a.name}</p>
                    <p className="text-xs text-[#9CA3AF]">{a.address}</p>
                  </div>
                </Td>
                <Td className="text-xs">{a.contact}</Td>
                <Td className="text-xs">{a.phone}</Td>
                <Td className="text-xs">{a.orders}</Td>
                <Td>
                  <span className={`text-xs ${a.debt > 500000000 ? "text-[#DC2626]" : "text-[#374151]"}`}>
                    {fmtMoney(a.debt)}
                  </span>
                </Td>
                <Td>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${tierColors[a.tier]}`}>{a.tier}</span>
                </Td>
                <Td>
                  <Badge variant={a.status === "active" ? "success" : "gray"}>
                    {a.status === "active" ? "Hoạt động" : "Ngừng"}
                  </Badge>
                </Td>
                <Td>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => { setSelected(a); setDetailOpen(true); }}>👁</Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(a)}>✏️</Button>
                  </div>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>

      {/* Detail */}
      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title={`Thông Tin Đại Lý - ${selected?.id}`} width="max-w-xl">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-[#F8FAFC] rounded-xl">
              <div className="w-12 h-12 bg-[#2563EB] text-white rounded-xl flex items-center justify-center text-lg">
                🏪
              </div>
              <div>
                <p className="text-sm text-[#111827]">{selected.name}</p>
                <p className="text-xs text-[#6B7280]">{selected.id}</p>
                <span className={`px-2 py-0.5 rounded-full text-xs mt-1 inline-block ${tierColors[selected.tier]}`}>{selected.tier}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Người LH", value: selected.contact },
                { label: "Điện Thoại", value: selected.phone },
                { label: "Email", value: selected.email },
                { label: "Địa Chỉ", value: selected.address },
              ].map((row) => (
                <div key={row.label}>
                  <p className="text-xs text-[#6B7280]">{row.label}</p>
                  <p className="text-sm text-[#111827] mt-0.5">{row.value}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-3">
                <p className="text-xs text-[#6B7280]">Tổng Đơn Hàng</p>
                <p className="text-xl text-[#2563EB] mt-1">{selected.orders}</p>
              </Card>
              <Card className="p-3">
                <p className="text-xs text-[#6B7280]">Công Nợ Hiện Tại</p>
                <p className={`text-xl mt-1 ${selected.debt > 500000000 ? "text-[#DC2626]" : "text-[#16A34A]"}`}>{fmtMoney(selected.debt)}</p>
              </Card>
            </div>
            <Button variant="secondary" className="w-full" onClick={() => setDetailOpen(false)}>Đóng</Button>
          </div>
        )}
      </Modal>

      {/* Add/Edit */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? "Chỉnh Sửa Đại Lý" : "Thêm Đại Lý"}>
        <div className="space-y-3">
          <Input label="Tên Đại Lý *" placeholder="Tên đại lý" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Người Liên Hệ" placeholder="Họ tên" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
            <Input label="Điện Thoại" placeholder="0912..." value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <Input label="Email" placeholder="email@..." value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Địa Chỉ" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Hạng" value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value })} options={["Bronze","Silver","Gold","Platinum"].map((t) => ({ value: t, label: t }))} />
            <Select label="Trạng Thái" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={[{ value: "active", label: "Hoạt động" }, { value: "inactive", label: "Ngừng" }]} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>Hủy</Button>
            <Button className="flex-1">{editItem ? "Cập Nhật" : "Thêm Mới"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
