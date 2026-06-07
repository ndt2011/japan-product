import React, { useState } from "react";
import { Card, Button, Badge, SearchInput, Table, Thead, Th, Td, Tr, Modal, Input, Select, PageHeader } from "./ui";

const inventoryData = [
  { id: "KK-2024-012", warehouse: "Kho Hà Nội", date: "2024-12-10", performer: "Nguyễn Văn A", items: 48, matched: 45, diff: -3, status: "Completed", note: "Thiếu 3 sp AirPods Pro" },
  { id: "KK-2024-011", warehouse: "Kho TP.HCM", date: "2024-12-05", performer: "Trần Thị B", items: 82, matched: 82, diff: 0, status: "Completed", note: "Khớp hoàn toàn" },
  { id: "KK-2024-010", warehouse: "Kho Đà Nẵng", date: "2024-11-28", performer: "Lê Văn C", items: 35, matched: 34, diff: -1, status: "Completed", note: "Thiếu 1 sp laptop" },
  { id: "KK-2024-009", warehouse: "Kho Hà Nội", date: "2024-11-15", performer: "Phạm D", items: 56, matched: 57, diff: +1, status: "Completed", note: "Thừa 1 sp phụ kiện" },
  { id: "KK-2024-008", warehouse: "Kho Cần Thơ", date: "2024-12-12", performer: "Hoàng E", items: 0, matched: 0, diff: 0, status: "In Progress", note: "" },
];

const stockData = [
  { sku: "PHN-023", name: "iPhone 15 Pro Max", category: "Điện thoại", system: 32, actual: 30, diff: -2 },
  { sku: "LPT-001", name: "Laptop Dell XPS 15", category: "Laptop", system: 45, actual: 45, diff: 0 },
  { sku: "AUD-012", name: "AirPods Pro 2", category: "Phụ kiện", system: 67, actual: 64, diff: -3 },
  { sku: "TV-045", name: "Samsung QLED 55\"", category: "Màn hình", system: 18, actual: 18, diff: 0 },
  { sku: "TAB-007", name: "iPad Air M2", category: "Máy tính bảng", system: 28, actual: 29, diff: +1 },
];

export function Inventory() {
  const [tab, setTab] = useState<"list" | "stock">("list");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Kiểm Kê Kho"
        subtitle="Quản lý kiểm kê và tồn kho thực tế"
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>+ Tạo Phiếu Kiểm Kê</Button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Tổng Kiểm Kê", value: inventoryData.length, color: "text-[#2563EB]" },
          { label: "Hoàn Thành", value: inventoryData.filter(i => i.status === "Completed").length, color: "text-[#16A34A]" },
          { label: "Đang Thực Hiện", value: inventoryData.filter(i => i.status === "In Progress").length, color: "text-[#D97706]" },
          { label: "Chênh Lệch", value: stockData.filter(s => s.diff !== 0).length, color: "text-[#DC2626]" },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-[#6B7280]">{s.label}</p>
            <p className={`text-xl mt-1 ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#E5E7EB]">
        {[
          { id: "list", label: "Phiếu Kiểm Kê" },
          { id: "stock", label: "Tồn Kho Thực Tế" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={`pb-3 px-1 text-sm border-b-2 transition-colors ${tab === t.id ? "border-[#2563EB] text-[#2563EB]" : "border-transparent text-[#6B7280] hover:text-[#374151]"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "list" && (
        <Card>
          <Table>
            <Thead>
              <tr>
                <Th>Mã Kiểm Kê</Th>
                <Th>Kho</Th>
                <Th>Ngày TH</Th>
                <Th>Người Thực Hiện</Th>
                <Th>Tổng SP</Th>
                <Th>Khớp</Th>
                <Th>Chênh Lệch</Th>
                <Th>Trạng Thái</Th>
                <Th>Ghi Chú</Th>
              </tr>
            </Thead>
            <tbody>
              {inventoryData.map((inv) => (
                <Tr key={inv.id}>
                  <Td><span className="text-[#2563EB] text-xs font-medium">{inv.id}</span></Td>
                  <Td className="text-xs">{inv.warehouse}</Td>
                  <Td className="text-xs text-[#6B7280]">{inv.date}</Td>
                  <Td className="text-xs">{inv.performer}</Td>
                  <Td className="text-xs">{inv.items}</Td>
                  <Td className="text-xs">{inv.matched}</Td>
                  <Td>
                    <span className={`text-xs font-medium ${inv.diff < 0 ? "text-[#DC2626]" : inv.diff > 0 ? "text-[#D97706]" : "text-[#16A34A]"}`}>
                      {inv.diff > 0 ? "+" : ""}{inv.diff}
                    </span>
                  </Td>
                  <Td>
                    <Badge variant={inv.status === "Completed" ? "success" : "warning"}>
                      {inv.status === "Completed" ? "Hoàn thành" : "Đang TH"}
                    </Badge>
                  </Td>
                  <Td className="text-xs text-[#6B7280]">{inv.note || "—"}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {tab === "stock" && (
        <Card>
          <div className="p-4 border-b border-[#F3F4F6]">
            <SearchInput placeholder="Tìm sản phẩm..." value={search} onChange={setSearch} className="max-w-sm" />
          </div>
          <Table>
            <Thead>
              <tr>
                <Th>SKU</Th>
                <Th>Tên Sản Phẩm</Th>
                <Th>Danh Mục</Th>
                <Th>Tồn Hệ Thống</Th>
                <Th>Tồn Thực Tế</Th>
                <Th>Chênh Lệch</Th>
                <Th>Trạng Thái</Th>
              </tr>
            </Thead>
            <tbody>
              {stockData
                .filter((s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.sku.toLowerCase().includes(search.toLowerCase()))
                .map((s) => (
                  <Tr key={s.sku}>
                    <Td><span className="text-[#2563EB] text-xs font-medium">{s.sku}</span></Td>
                    <Td className="text-xs text-[#111827]">{s.name}</Td>
                    <Td><Badge variant="info">{s.category}</Badge></Td>
                    <Td className="text-xs">{s.system}</Td>
                    <Td className="text-xs">{s.actual}</Td>
                    <Td>
                      <span className={`text-xs font-medium ${s.diff < 0 ? "text-[#DC2626]" : s.diff > 0 ? "text-[#D97706]" : "text-[#16A34A]"}`}>
                        {s.diff > 0 ? "+" : ""}{s.diff}
                      </span>
                    </Td>
                    <Td>
                      <Badge variant={s.diff === 0 ? "success" : "danger"}>
                        {s.diff === 0 ? "Khớp" : "Chênh lệch"}
                      </Badge>
                    </Td>
                  </Tr>
                ))}
            </tbody>
          </Table>
        </Card>
      )}

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Tạo Phiếu Kiểm Kê">
        <div className="space-y-3">
          <Select label="Kho Kiểm Kê" options={[
            { value: "hn", label: "Kho Hà Nội" },
            { value: "hcm", label: "Kho TP.HCM" },
            { value: "dn", label: "Kho Đà Nẵng" },
            { value: "ct", label: "Kho Cần Thơ" },
          ]} onChange={() => {}} />
          <Input label="Người Thực Hiện" placeholder="Tên nhân viên" />
          <Input label="Ngày Kiểm Kê" type="date" />
          <Input label="Ghi Chú" placeholder="Ghi chú kiểm kê..." />
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setCreateOpen(false)}>Hủy</Button>
            <Button className="flex-1">Tạo Phiếu</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
