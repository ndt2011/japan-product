import React, { useState } from "react";
import { Card, Button, Badge, SearchInput, Table, Thead, Th, Td, Tr, Modal, Input, Select, PageHeader, EmptyState } from "./ui";

const categories = ["Điện thoại", "Laptop", "Màn hình", "Phụ kiện", "Âm thanh", "Máy tính bảng"];

const initialProducts = [
  { id: "SP-001", sku: "LPT-001", name: "Laptop Dell XPS 15 9530", category: "Laptop", buyPrice: 28500000, sellPrice: 32000000, stock: 45, minStock: 10, status: "active", supplier: "Dell Technologies" },
  { id: "SP-002", sku: "PHN-023", name: "iPhone 15 Pro Max 256GB", category: "Điện thoại", buyPrice: 27000000, sellPrice: 32990000, stock: 32, minStock: 15, status: "active", supplier: "Apple VN" },
  { id: "SP-003", sku: "TV-045", name: "Samsung QLED 4K 55\"", category: "Màn hình", buyPrice: 14500000, sellPrice: 18500000, stock: 18, minStock: 5, status: "active", supplier: "Samsung VN" },
  { id: "SP-004", sku: "AUD-012", name: "AirPods Pro 2nd Gen", category: "Phụ kiện", buyPrice: 5500000, sellPrice: 6990000, stock: 67, minStock: 20, status: "active", supplier: "Apple VN" },
  { id: "SP-005", sku: "TAB-007", name: "iPad Air M2 11\" WiFi 256GB", category: "Máy tính bảng", buyPrice: 16500000, sellPrice: 19990000, stock: 28, minStock: 10, status: "active", supplier: "Apple VN" },
  { id: "SP-006", sku: "PHN-089", name: "Samsung Galaxy S24 Ultra", category: "Điện thoại", buyPrice: 25000000, sellPrice: 29990000, stock: 6, minStock: 10, status: "low_stock", supplier: "Samsung VN" },
  { id: "SP-007", sku: "AUD-031", name: "Sony WH-1000XM5", category: "Âm thanh", buyPrice: 7500000, sellPrice: 9490000, stock: 0, minStock: 5, status: "out_of_stock", supplier: "Sony VN" },
];

type Product = typeof initialProducts[0];

function fmt(n: number) {
  return n.toLocaleString("vi-VN") + "đ";
}

const statusLabels: Record<string, { label: string; variant: "success" | "warning" | "danger" | "gray" }> = {
  active: { label: "Còn hàng", variant: "success" },
  low_stock: { label: "Sắp hết", variant: "warning" },
  out_of_stock: { label: "Hết hàng", variant: "danger" },
  inactive: { label: "Ngừng", variant: "gray" },
};

export function Products() {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "", sku: "", category: categories[0], buyPrice: "", sellPrice: "", stock: "", minStock: "", supplier: "", status: "active",
  });

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat = !catFilter || p.category === catFilter;
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  function openAdd() {
    setEditItem(null);
    setForm({ name: "", sku: "", category: categories[0], buyPrice: "", sellPrice: "", stock: "", minStock: "", supplier: "", status: "active" });
    setModalOpen(true);
  }

  function openEdit(p: Product) {
    setEditItem(p);
    setForm({
      name: p.name, sku: p.sku, category: p.category,
      buyPrice: String(p.buyPrice), sellPrice: String(p.sellPrice),
      stock: String(p.stock), minStock: String(p.minStock), supplier: p.supplier, status: p.status,
    });
    setModalOpen(true);
  }

  function handleSave() {
    if (!form.name.trim() || !form.sku.trim()) return;
    const stockNum = Number(form.stock) || 0;
    const minNum = Number(form.minStock) || 0;
    let status = form.status;
    if (stockNum === 0) status = "out_of_stock";
    else if (stockNum <= minNum) status = "low_stock";
    if (editItem) {
      setProducts((prev) => prev.map((p) =>
        p.id === editItem.id
          ? { ...p, ...form, buyPrice: Number(form.buyPrice), sellPrice: Number(form.sellPrice), stock: stockNum, minStock: minNum, status }
          : p
      ));
    } else {
      const id = `SP-${String(products.length + 1).padStart(3, "0")}`;
      setProducts((prev) => [...prev, { id, ...form, buyPrice: Number(form.buyPrice), sellPrice: Number(form.sellPrice), stock: stockNum, minStock: minNum, status }]);
    }
    setModalOpen(false);
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Quản Lý Hàng Hóa"
        subtitle={`${products.length} sản phẩm`}
        actions={
          <>
            <Button variant="secondary" size="sm">📤 Xuất Excel</Button>
            <Button size="sm" onClick={openAdd}>+ Thêm Hàng Hóa</Button>
          </>
        }
      />

      {/* Stats mini */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Tổng SP", value: products.length, color: "text-[#2563EB]" },
          { label: "Còn hàng", value: products.filter((p) => p.status === "active").length, color: "text-[#16A34A]" },
          { label: "Sắp hết", value: products.filter((p) => p.status === "low_stock").length, color: "text-[#D97706]" },
          { label: "Hết hàng", value: products.filter((p) => p.status === "out_of_stock").length, color: "text-[#DC2626]" },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-[#6B7280]">{s.label}</p>
            <p className={`text-xl mt-1 ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <SearchInput
            placeholder="Tìm theo tên, SKU..."
            value={search}
            onChange={setSearch}
            className="flex-1 min-w-52"
          />
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#E5E7EB] text-sm bg-white text-[#374151]"
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#E5E7EB] text-sm bg-white text-[#374151]"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Còn hàng</option>
            <option value="low_stock">Sắp hết</option>
            <option value="out_of_stock">Hết hàng</option>
          </select>
        </div>
      </Card>

      <Card>
        <Table>
          <Thead>
            <tr>
              <Th>SKU</Th>
              <Th>Tên Sản Phẩm</Th>
              <Th>Danh Mục</Th>
              <Th>Giá Nhập</Th>
              <Th>Giá Bán</Th>
              <Th>Tồn Kho</Th>
              <Th>Lợi Nhuận</Th>
              <Th>Trạng Thái</Th>
              <Th>Thao Tác</Th>
            </tr>
          </Thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={9}><EmptyState message="Không tìm thấy sản phẩm" icon="📦" /></td></tr>
            ) : (
              filtered.map((p) => {
                const s = statusLabels[p.status] || statusLabels.active;
                const profit = ((p.sellPrice - p.buyPrice) / p.buyPrice * 100).toFixed(1);
                return (
                  <Tr key={p.id}>
                    <Td><span className="text-[#2563EB] text-xs font-medium">{p.sku}</span></Td>
                    <Td>
                      <div>
                        <p className="text-xs text-[#111827]">{p.name}</p>
                        <p className="text-xs text-[#9CA3AF]">{p.supplier}</p>
                      </div>
                    </Td>
                    <Td><Badge variant="info">{p.category}</Badge></Td>
                    <Td className="text-xs text-[#374151]">{fmt(p.buyPrice)}</Td>
                    <Td className="text-xs text-[#111827]">{fmt(p.sellPrice)}</Td>
                    <Td>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-[#111827]">{p.stock}</span>
                        {p.stock <= p.minStock && p.stock > 0 && (
                          <span className="text-xs text-[#D97706]">⚠️</span>
                        )}
                      </div>
                    </Td>
                    <Td><span className="text-xs text-[#16A34A]">+{profit}%</span></Td>
                    <Td><Badge variant={s.variant}>{s.label}</Badge></Td>
                    <Td>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)} className="text-xs">✏️</Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(p.id)} className="text-xs">🗑️</Button>
                      </div>
                    </Td>
                  </Tr>
                );
              })
            )}
          </tbody>
        </Table>
        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-[#F3F4F6] flex items-center justify-between">
            <span className="text-xs text-[#6B7280]">{filtered.length} / {products.length} sản phẩm</span>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm">‹</Button>
              <Button variant="primary" size="sm">1</Button>
              <Button variant="ghost" size="sm">›</Button>
            </div>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? "Chỉnh Sửa Sản Phẩm" : "Thêm Hàng Hóa"} width="max-w-xl">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Tên Sản Phẩm *" placeholder="Tên sản phẩm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="SKU *" placeholder="SKU-001" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Danh Mục" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} options={categories.map((c) => ({ value: c, label: c }))} />
            <Input label="Nhà Cung Cấp" placeholder="Tên NCC" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Giá Nhập (đ)" placeholder="0" type="number" value={form.buyPrice} onChange={(e) => setForm({ ...form, buyPrice: e.target.value })} />
            <Input label="Giá Bán (đ)" placeholder="0" type="number" value={form.sellPrice} onChange={(e) => setForm({ ...form, sellPrice: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Tồn Kho" placeholder="0" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
            <Input label="Tồn Tối Thiểu" placeholder="5" type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>Hủy</Button>
            <Button className="flex-1" onClick={handleSave}>{editItem ? "Cập Nhật" : "Thêm Mới"}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Xác Nhận Xóa" width="max-w-sm">
        <div className="text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <p className="text-sm text-[#374151]">Bạn có chắc muốn xóa sản phẩm này không?</p>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setDeleteId(null)}>Hủy</Button>
            <Button variant="danger" className="flex-1" onClick={() => { setProducts((p) => p.filter((x) => x.id !== deleteId)); setDeleteId(null); }}>Xóa</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
