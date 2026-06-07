import React, { useState } from "react";
import { Card, Button, Badge, SearchInput, Table, Thead, Th, Td, Tr, Modal, PageHeader } from "./ui";

const stockOutData = [
  { id: "PX-2024-0567", order: "ĐH-2024-0891", warehouse: "Kho HCM", agent: "Đại Lý Miền Nam", exporter: "Lê Văn A", date: "2024-12-10", items: 4, total: "124.500.000đ", status: "Completed" },
  { id: "PX-2024-0566", order: "ĐH-2024-0890", warehouse: "Kho HN", agent: "TechStore HN", exporter: "Trần B", date: "2024-12-09", items: 2, total: "89.200.000đ", status: "Pending" },
  { id: "PX-2024-0565", order: "ĐH-2024-0889", warehouse: "Kho HCM", agent: "Mobile World", exporter: "Nguyễn C", date: "2024-12-08", items: 6, total: "205.800.000đ", status: "Completed" },
  { id: "PX-2024-0564", order: "ĐH-2024-0888", warehouse: "Kho ĐN", agent: "Điện Máy BT", exporter: "Phạm D", date: "2024-12-08", items: 1, total: "76.400.000đ", status: "Processing" },
];

const statusMap: Record<string, { label: string; variant: "gray" | "warning" | "success" | "primary" }> = {
  Pending: { label: "Chờ xuất", variant: "warning" },
  Processing: { label: "Đang xuất", variant: "primary" },
  Completed: { label: "Đã xuất", variant: "success" },
};

const exportItems = [
  { sku: "PHN-023", name: "iPhone 15 Pro Max 256GB", qty: 2, location: "A1-01", status: "Picked" },
  { sku: "AUD-012", name: "AirPods Pro 2", qty: 4, location: "B2-05", status: "Picked" },
];

export function StockOut() {
  const [search, setSearch] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState(stockOutData[0]);

  const filtered = stockOutData.filter(
    (s) =>
      s.id.toLowerCase().includes(search.toLowerCase()) ||
      s.agent.toLowerCase().includes(search.toLowerCase()) ||
      s.order.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Xuất Kho"
        subtitle={`${stockOutData.length} phiếu xuất`}
        actions={
          <Button variant="secondary" size="sm">📤 Xuất Excel</Button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Tổng Phiếu", value: stockOutData.length, color: "text-[#2563EB]" },
          { label: "Chờ Xuất", value: stockOutData.filter(s => s.status === "Pending").length, color: "text-[#D97706]" },
          { label: "Đang Xuất", value: stockOutData.filter(s => s.status === "Processing").length, color: "text-[#2563EB]" },
          { label: "Đã Xuất", value: stockOutData.filter(s => s.status === "Completed").length, color: "text-[#16A34A]" },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-[#6B7280]">{s.label}</p>
            <p className={`text-xl mt-1 ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <SearchInput placeholder="Tìm phiếu xuất, đại lý..." value={search} onChange={setSearch} className="max-w-sm" />
      </Card>

      <Card>
        <Table>
          <Thead>
            <tr>
              <Th>Mã Phiếu</Th>
              <Th>Đơn Hàng</Th>
              <Th>Đại Lý</Th>
              <Th>Kho</Th>
              <Th>Người Xuất</Th>
              <Th>Ngày Xuất</Th>
              <Th>Tổng Tiền</Th>
              <Th>Trạng Thái</Th>
              <Th>Thao Tác</Th>
            </tr>
          </Thead>
          <tbody>
            {filtered.map((s) => {
              const st = statusMap[s.status];
              return (
                <Tr key={s.id}>
                  <Td><span className="text-[#2563EB] text-xs font-medium">{s.id}</span></Td>
                  <Td><span className="text-xs text-[#2563EB]">{s.order}</span></Td>
                  <Td className="text-xs">{s.agent}</Td>
                  <Td className="text-xs">{s.warehouse}</Td>
                  <Td className="text-xs">{s.exporter}</Td>
                  <Td className="text-xs text-[#6B7280]">{s.date}</Td>
                  <Td className="text-xs text-[#111827]">{s.total}</Td>
                  <Td><Badge variant={st.variant}>{st.label}</Badge></Td>
                  <Td>
                    <Button variant="ghost" size="sm" onClick={() => { setSelected(s); setDetailOpen(true); }}>
                      Chi tiết
                    </Button>
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      </Card>

      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title={`Chi Tiết Xuất Kho - ${selected?.id}`} width="max-w-2xl">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 p-4 bg-[#F8FAFC] rounded-xl">
            <div>
              <p className="text-xs text-[#6B7280]">Đơn Hàng</p>
              <p className="text-sm text-[#2563EB] mt-0.5">{selected?.order}</p>
            </div>
            <div>
              <p className="text-xs text-[#6B7280]">Đại Lý</p>
              <p className="text-sm text-[#111827] mt-0.5">{selected?.agent}</p>
            </div>
            <div>
              <p className="text-xs text-[#6B7280]">Kho</p>
              <p className="text-sm text-[#111827] mt-0.5">{selected?.warehouse}</p>
            </div>
          </div>

          <Table>
            <Thead>
              <tr>
                <Th>SKU</Th>
                <Th>Sản Phẩm</Th>
                <Th>Vị Trí Kho</Th>
                <Th>Số Lượng</Th>
                <Th>Trạng Thái</Th>
              </tr>
            </Thead>
            <tbody>
              {exportItems.map((item) => (
                <Tr key={item.sku}>
                  <Td className="text-xs text-[#2563EB]">{item.sku}</Td>
                  <Td className="text-xs">{item.name}</Td>
                  <Td><span className="text-xs font-medium text-[#374151] bg-[#F3F4F6] px-2 py-0.5 rounded">{item.location}</span></Td>
                  <Td className="text-xs">{item.qty}</Td>
                  <Td><Badge variant="success">{item.status}</Badge></Td>
                </Tr>
              ))}
            </tbody>
          </Table>

          <div className="flex gap-2">
            {selected?.status === "Pending" && <Button variant="primary" className="flex-1">▶ Bắt Đầu Xuất Kho</Button>}
            {selected?.status === "Processing" && <Button variant="success" className="flex-1">✓ Hoàn Thành Xuất Kho</Button>}
            <Button variant="secondary" className="flex-1" onClick={() => setDetailOpen(false)}>Đóng</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
