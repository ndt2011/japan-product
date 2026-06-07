import React, { useState } from "react";
import { Card, Button, Badge, SearchInput, Table, Thead, Th, Td, Tr, Modal, Input, Select, PageHeader, EmptyState } from "./ui";

const initialSuppliers = [
  { id: "NCC-001", name: "Công Ty TNHH Samsung Việt Nam", contact: "Nguyễn Văn An", phone: "0912 345 678", email: "an.nguyen@samsung.vn", address: "Khu CN Thái Nguyên", status: "active", totalOrders: 124, totalValue: "2.4 tỷ" },
  { id: "NCC-002", name: "Apple Authorized Distributor VN", contact: "Trần Thị Bình", phone: "0908 765 432", email: "binh.tran@apple-vn.com", address: "Quận 1, TP.HCM", status: "active", totalOrders: 89, totalValue: "8.6 tỷ" },
  { id: "NCC-003", name: "Dell Technologies Vietnam", contact: "Lê Minh Cường", phone: "0934 567 890", email: "cuong.le@dell.com.vn", address: "Cầu Giấy, Hà Nội", status: "active", totalOrders: 56, totalValue: "3.1 tỷ" },
  { id: "NCC-004", name: "LG Electronics Vietnam", contact: "Phạm Thị Dung", phone: "0978 123 456", email: "dung.pham@lg.vn", address: "KCN Hải Phòng", status: "inactive", totalOrders: 34, totalValue: "1.2 tỷ" },
  { id: "NCC-005", name: "Sony Vietnam Corp", contact: "Hoàng Văn Em", phone: "0901 234 567", email: "em.hoang@sony.vn", address: "Long Biên, Hà Nội", status: "active", totalOrders: 72, totalValue: "4.8 tỷ" },
];

type Supplier = typeof initialSuppliers[0];

export function Suppliers() {
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Supplier | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState({ name: "", contact: "", phone: "", email: "", address: "", status: "active" });

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase()) ||
      s.contact.toLowerCase().includes(search.toLowerCase())
  );

  function openAdd() {
    setEditItem(null);
    setForm({ name: "", contact: "", phone: "", email: "", address: "", status: "active" });
    setModalOpen(true);
  }

  function openEdit(s: Supplier) {
    setEditItem(s);
    setForm({ name: s.name, contact: s.contact, phone: s.phone, email: s.email, address: s.address, status: s.status });
    setModalOpen(true);
  }

  function handleSave() {
    if (!form.name.trim()) return;
    if (editItem) {
      setSuppliers((prev) => prev.map((s) => (s.id === editItem.id ? { ...s, ...form } : s)));
    } else {
      const newId = `NCC-${String(suppliers.length + 1).padStart(3, "0")}`;
      setSuppliers((prev) => [...prev, { id: newId, ...form, totalOrders: 0, totalValue: "0đ" }]);
    }
    setModalOpen(false);
  }

  function handleDelete() {
    if (deleteId) {
      setSuppliers((prev) => prev.filter((s) => s.id !== deleteId));
      setDeleteId(null);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Nhà Cung Cấp"
        subtitle={`${suppliers.length} nhà cung cấp`}
        actions={
          <>
            <Button variant="secondary" size="sm">📤 Xuất Excel</Button>
            <Button size="sm" onClick={openAdd}>+ Thêm NCC</Button>
          </>
        }
      />

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <SearchInput
            placeholder="Tìm theo mã, tên, liên hệ..."
            value={search}
            onChange={setSearch}
            className="flex-1 min-w-60"
          />
          <select className="px-3 py-2 rounded-xl border border-[#E5E7EB] text-sm bg-white text-[#374151]">
            <option value="">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Ngừng</option>
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table>
          <Thead>
            <tr>
              <Th>Mã NCC</Th>
              <Th>Tên Nhà Cung Cấp</Th>
              <Th>Người Liên Hệ</Th>
              <Th>Điện Thoại</Th>
              <Th>Email</Th>
              <Th>Đơn Hàng</Th>
              <Th>Giá Trị</Th>
              <Th>Trạng Thái</Th>
              <Th>Thao Tác</Th>
            </tr>
          </Thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <EmptyState message="Không tìm thấy nhà cung cấp" icon="🏭" />
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <Tr key={s.id}>
                  <Td>
                    <span className="text-[#2563EB] font-medium text-xs">{s.id}</span>
                  </Td>
                  <Td>
                    <div>
                      <p className="text-xs text-[#111827]">{s.name}</p>
                      <p className="text-xs text-[#9CA3AF]">{s.address}</p>
                    </div>
                  </Td>
                  <Td className="text-xs">{s.contact}</Td>
                  <Td className="text-xs">{s.phone}</Td>
                  <Td className="text-xs text-[#2563EB]">{s.email}</Td>
                  <Td className="text-xs">{s.totalOrders}</Td>
                  <Td className="text-xs text-[#111827]">{s.totalValue}</Td>
                  <Td>
                    <Badge variant={s.status === "active" ? "success" : "gray"}>
                      {s.status === "active" ? "Hoạt động" : "Ngừng"}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(s)} className="text-xs">✏️</Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(s.id)} className="text-xs">🗑️</Button>
                    </div>
                  </Td>
                </Tr>
              ))
            )}
          </tbody>
        </Table>
        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-[#F3F4F6] flex items-center justify-between">
            <span className="text-xs text-[#6B7280]">Hiển thị {filtered.length} / {suppliers.length} kết quả</span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm">‹ Trước</Button>
              <Button variant="primary" size="sm">1</Button>
              <Button variant="ghost" size="sm">2</Button>
              <Button variant="ghost" size="sm">Tiếp ›</Button>
            </div>
          </div>
        )}
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editItem ? "Chỉnh Sửa Nhà Cung Cấp" : "Thêm Nhà Cung Cấp"}
      >
        <div className="space-y-3">
          <Input
            label="Tên Nhà Cung Cấp *"
            placeholder="Nhập tên nhà cung cấp"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Người Liên Hệ"
              placeholder="Tên người liên hệ"
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
            />
            <Input
              label="Số Điện Thoại"
              placeholder="0912 345 678"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <Input
            label="Email"
            placeholder="email@company.com"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Địa Chỉ"
            placeholder="Địa chỉ nhà cung cấp"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <Select
            label="Trạng Thái"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            options={[
              { value: "active", label: "Hoạt động" },
              { value: "inactive", label: "Ngừng hoạt động" },
            ]}
          />
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>Hủy</Button>
            <Button className="flex-1" onClick={handleSave}>
              {editItem ? "Cập Nhật" : "Thêm Mới"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Xác Nhận Xóa" width="max-w-sm">
        <div className="text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <p className="text-sm text-[#374151]">Bạn có chắc muốn xóa nhà cung cấp này không?</p>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setDeleteId(null)}>Hủy</Button>
            <Button variant="danger" className="flex-1" onClick={handleDelete}>Xóa</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
