import React, { useState } from "react";
import { Card, Button, Badge, SearchInput, Table, Thead, Th, Td, Tr, Modal, Input, Select, PageHeader, StatCard } from "./ui";

const statusMap: Record<string, { label: string; variant: "gray" | "primary" | "warning" | "success" | "danger" | "info" }> = {
  Draft: { label: "Nháp", variant: "gray" },
  Confirmed: { label: "Xác nhận", variant: "primary" },
  Shipping: { label: "Đang giao", variant: "warning" },
  Delivered: { label: "Đã giao", variant: "success" },
  Cancelled: { label: "Hủy bỏ", variant: "danger" },
};

const ordersData = [
  { id: "ĐH-2024-0891", agent: "Đại Lý Miền Nam", agentCode: "ĐL-012", date: "2024-12-10", items: 4, total: "124.500.000đ", status: "Shipping", payment: "Chưa TT" },
  { id: "ĐH-2024-0890", agent: "TechStore Hà Nội", agentCode: "ĐL-007", date: "2024-12-09", items: 2, total: "89.200.000đ", status: "Confirmed", payment: "Đã TT" },
  { id: "ĐH-2024-0889", agent: "Mobile World", agentCode: "ĐL-023", date: "2024-12-08", items: 6, total: "205.800.000đ", status: "Delivered", payment: "Đã TT" },
  { id: "ĐH-2024-0888", agent: "Siêu Thị Điện Máy", agentCode: "ĐL-034", date: "2024-12-08", items: 1, total: "76.400.000đ", status: "Draft", payment: "Chưa TT" },
  { id: "ĐH-2024-0887", agent: "CellphoneS", agentCode: "ĐL-056", date: "2024-12-07", items: 3, total: "98.700.000đ", status: "Cancelled", payment: "Hoàn tiền" },
  { id: "ĐH-2024-0886", agent: "Thế Giới Di Động", agentCode: "ĐL-001", date: "2024-12-06", items: 5, total: "167.200.000đ", status: "Delivered", payment: "Đã TT" },
];

const orderItems = [
  { sku: "PHN-023", name: "iPhone 15 Pro Max 256GB", qty: 2, price: "32.990.000đ", total: "65.980.000đ" },
  { sku: "AUD-012", name: "AirPods Pro 2", qty: 4, price: "6.990.000đ", total: "27.960.000đ" },
];

export function Orders() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState(ordersData[0]);

  const filtered = ordersData.filter((o) => {
    const matchSearch =
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.agent.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Đơn Đặt Hàng"
        subtitle={`${ordersData.length} đơn hàng`}
        actions={
          <>
            <Button variant="secondary" size="sm">📤 Xuất Excel</Button>
            <Button size="sm" onClick={() => setCreateOpen(true)}>+ Tạo Đơn Hàng</Button>
          </>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Object.entries(statusMap).map(([key, s]) => (
          <Card key={key} className="p-3 cursor-pointer hover:border-[#2563EB] transition-colors" onClick={() => setStatusFilter(key === statusFilter ? "" : key)}>
            <p className="text-xs text-[#6B7280]">{s.label}</p>
            <p className="text-lg text-[#111827] mt-0.5">{ordersData.filter((o) => o.status === key).length}</p>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <div className="flex gap-3 flex-wrap">
          <SearchInput placeholder="Tìm đơn hàng, đại lý..." value={search} onChange={setSearch} className="flex-1 min-w-52" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#E5E7EB] text-sm bg-white text-[#374151]"
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(statusMap).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
          </select>
          <input type="date" className="px-3 py-2 rounded-xl border border-[#E5E7EB] text-sm bg-white text-[#374151]" />
        </div>
      </Card>

      <Card>
        <Table>
          <Thead>
            <tr>
              <Th>Mã Đơn</Th>
              <Th>Đại Lý</Th>
              <Th>Ngày Tạo</Th>
              <Th>Số Mặt Hàng</Th>
              <Th>Tổng Tiền</Th>
              <Th>Thanh Toán</Th>
              <Th>Trạng Thái</Th>
              <Th>Thao Tác</Th>
            </tr>
          </Thead>
          <tbody>
            {filtered.map((o) => {
              const s = statusMap[o.status];
              const payVariant = o.payment === "Đã TT" ? "success" : o.payment === "Hoàn tiền" ? "info" : "warning";
              return (
                <Tr key={o.id}>
                  <Td><span className="text-[#2563EB] text-xs font-medium">{o.id}</span></Td>
                  <Td>
                    <div>
                      <p className="text-xs text-[#111827]">{o.agent}</p>
                      <p className="text-xs text-[#9CA3AF]">{o.agentCode}</p>
                    </div>
                  </Td>
                  <Td className="text-xs text-[#6B7280]">{o.date}</Td>
                  <Td className="text-xs">{o.items}</Td>
                  <Td className="text-xs text-[#111827]">{o.total}</Td>
                  <Td><Badge variant={payVariant}>{o.payment}</Badge></Td>
                  <Td><Badge variant={s.variant}>{s.label}</Badge></Td>
                  <Td>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => { setSelected(o); setDetailOpen(true); }}>Chi tiết</Button>
                    </div>
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
        <div className="px-4 py-3 border-t border-[#F3F4F6] flex items-center justify-between">
          <span className="text-xs text-[#6B7280]">{filtered.length} / {ordersData.length} đơn hàng</span>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm">‹</Button>
            <Button variant="primary" size="sm">1</Button>
            <Button variant="ghost" size="sm">›</Button>
          </div>
        </div>
      </Card>

      {/* Detail */}
      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title={`Chi Tiết Đơn Hàng - ${selected?.id}`} width="max-w-2xl">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 p-4 bg-[#F8FAFC] rounded-xl">
            <div>
              <p className="text-xs text-[#6B7280]">Đại Lý</p>
              <p className="text-sm text-[#111827] mt-0.5">{selected?.agent}</p>
              <p className="text-xs text-[#9CA3AF]">{selected?.agentCode}</p>
            </div>
            <div>
              <p className="text-xs text-[#6B7280]">Ngày Tạo</p>
              <p className="text-sm text-[#111827] mt-0.5">{selected?.date}</p>
            </div>
            <div>
              <p className="text-xs text-[#6B7280]">Trạng Thái</p>
              <div className="mt-0.5">
                {selected && <Badge variant={statusMap[selected.status].variant}>{statusMap[selected.status].label}</Badge>}
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {["Draft", "Confirmed", "Shipping", "Delivered"].map((step, i) => {
              const steps = ["Draft", "Confirmed", "Shipping", "Delivered"];
              const currentIdx = selected ? steps.indexOf(selected.status) : -1;
              const isActive = i <= currentIdx;
              return (
                <React.Fragment key={step}>
                  <div className={`flex flex-col items-center gap-1 shrink-0 ${isActive ? "opacity-100" : "opacity-30"}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${isActive ? "bg-[#2563EB] text-white" : "bg-[#F3F4F6] text-[#9CA3AF]"}`}>
                      {i + 1}
                    </div>
                    <span className="text-xs text-[#6B7280] whitespace-nowrap">{statusMap[step]?.label}</span>
                  </div>
                  {i < 3 && <div className={`h-0.5 flex-1 ${isActive && i < currentIdx ? "bg-[#2563EB]" : "bg-[#E5E7EB]"}`} />}
                </React.Fragment>
              );
            })}
          </div>

          <Table>
            <Thead>
              <tr>
                <Th>SKU</Th>
                <Th>Sản Phẩm</Th>
                <Th>SL</Th>
                <Th>Đơn Giá</Th>
                <Th>Thành Tiền</Th>
              </tr>
            </Thead>
            <tbody>
              {orderItems.map((item) => (
                <Tr key={item.sku}>
                  <Td className="text-xs text-[#2563EB]">{item.sku}</Td>
                  <Td className="text-xs">{item.name}</Td>
                  <Td className="text-xs">{item.qty}</Td>
                  <Td className="text-xs">{item.price}</Td>
                  <Td className="text-xs text-[#111827]">{item.total}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>

          <div className="flex items-center justify-between border-t border-[#F3F4F6] pt-3">
            <span className="text-sm text-[#6B7280]">Tổng cộng:</span>
            <span className="text-base text-[#111827]">{selected?.total}</span>
          </div>

          <div className="flex gap-2">
            {selected?.status === "Draft" && <Button variant="primary" className="flex-1">✓ Xác Nhận</Button>}
            {selected?.status === "Confirmed" && <Button variant="warning" className="flex-1">🚚 Xuất Kho</Button>}
            {selected?.status === "Shipping" && <Button variant="success" className="flex-1">✓ Xác Nhận Nhận Hàng</Button>}
            <Button variant="secondary" className="flex-1" onClick={() => setDetailOpen(false)}>Đóng</Button>
          </div>
        </div>
      </Modal>

      {/* Create */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Tạo Đơn Hàng Mới" width="max-w-xl">
        <div className="space-y-3">
          <Select label="Đại Lý" options={[
            { value: "dl001", label: "Thế Giới Di Động (ĐL-001)" },
            { value: "dl007", label: "TechStore HN (ĐL-007)" },
            { value: "dl012", label: "Đại Lý Miền Nam (ĐL-012)" },
          ]} onChange={() => {}} />
          <Input label="Ngày Giao Hàng" type="date" />
          <div className="border border-[#E5E7EB] rounded-xl p-3 space-y-2">
            <p className="text-xs text-[#6B7280]">Danh Sách Sản Phẩm</p>
            <div className="grid grid-cols-4 gap-2 text-xs text-[#9CA3AF] px-1">
              <span>SKU</span><span>Tên SP</span><span>SL</span><span>Giá</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <Input placeholder="SKU" />
              <Input placeholder="Tên SP" />
              <Input placeholder="SL" type="number" />
              <Input placeholder="Giá" type="number" />
            </div>
            <Button variant="ghost" size="sm" className="w-full border border-dashed border-[#E5E7EB]">+ Thêm sản phẩm</Button>
          </div>
          <Input label="Ghi Chú" placeholder="Ghi chú đơn hàng..." />
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setCreateOpen(false)}>Hủy</Button>
            <Button variant="secondary" className="flex-1">Lưu Nháp</Button>
            <Button className="flex-1">Xác Nhận Đơn</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
