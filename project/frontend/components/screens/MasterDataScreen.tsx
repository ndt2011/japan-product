"use client";

import { Button, Card, Input, PageHeader, Select, Table, Td, Th, Thead, Tr } from "@/components/ui";
import {
  clearFieldError,
  hasFieldErrors,
  validateCategoryName,
  validateSupplierForm,
  validateWarehouseForm,
  type FieldErrors,
} from "@/lib/form-validation";
import { translateMessage } from "@/lib/messages";
import { toast } from "@/lib/toast";
import type { CategoryOption } from "@/types/api";
import { FormEvent, useEffect, useState } from "react";

interface WarehouseRow {
  id: number;
  warehouse_cd?: string | null;
  warehouse_name: string;
  country?: string | null;
  location_type?: string | null;
}

interface SupplierRow {
  id: number;
  supplier_cd?: string | null;
  supplier_name: string;
  supplier_name_jp?: string | null;
}

const PRODUCT_UNITS = ["hộp", "chai", "gói", "cái", "kg", "lít", "túi", "thùng"];

type TabId = "categories" | "warehouses" | "suppliers" | "units";

export function MasterDataScreen() {
  const [tab, setTab] = useState<TabId>("categories");
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseRow[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [catName, setCatName] = useState("");
  const [whForm, setWhForm] = useState({
    warehouse_name: "",
    country: "JP",
    location_type: "JP",
    address: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [supplierForm, setSupplierForm] = useState({
    supplier_cd: "",
    supplier_name: "",
    supplier_name_jp: "",
  });
  const [catFieldErrors, setCatFieldErrors] = useState<FieldErrors>({});
  const [whFieldErrors, setWhFieldErrors] = useState<FieldErrors>({});
  const [supplierFieldErrors, setSupplierFieldErrors] = useState<FieldErrors>({});

  async function loadCategories() {
    const res = await fetch("/api/proxy/product-categories");
    const data = await res.json();
    if (data.success) setCategories(data.data?.items ?? []);
  }

  async function loadWarehouses() {
    const res = await fetch("/api/proxy/warehouses?per_page=50");
    const data = await res.json();
    if (data.success) setWarehouses(data.data?.items ?? []);
  }

  async function loadSuppliers() {
    const res = await fetch("/api/proxy/suppliers");
    const data = await res.json();
    if (data.success) setSuppliers(data.data?.items ?? []);
  }

  useEffect(() => {
    Promise.all([loadCategories(), loadWarehouses(), loadSuppliers()]).finally(() => setLoading(false));
  }, []);

  async function addCategory(e: FormEvent) {
    e.preventDefault();
    const errors = validateCategoryName(catName);
    setCatFieldErrors(errors);
    if (hasFieldErrors(errors)) return;
    setError("");
    const res = await fetch("/api/proxy/product-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category_name: catName.trim() }),
    });
    const data = await res.json();
    if (!data.success) {
      const msg = translateMessage(data.message ?? "M0002");
      setError(msg);
      toast.error(msg);
      return;
    }
    toast.success("Đã thêm danh mục.");
    setCatName("");
    await loadCategories();
  }

  async function deleteCategory(id: number) {
    if (!confirm("Xóa danh mục này?")) return;
    await fetch(`/api/proxy/product-categories/${id}`, { method: "DELETE" });
    await loadCategories();
  }

  async function addWarehouse(e: FormEvent) {
    e.preventDefault();
    const errors = validateWarehouseForm(whForm);
    setWhFieldErrors(errors);
    if (hasFieldErrors(errors)) return;
    setError("");
    const res = await fetch("/api/proxy/warehouses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...whForm,
        country: whForm.location_type === "JP" ? "JP" : "VN",
      }),
    });
    const data = await res.json();
    if (!data.success) {
      const msg = translateMessage(data.message ?? "M0002");
      setError(msg);
      toast.error(msg);
      return;
    }
    toast.success("Đã thêm kho.");
    setWhForm({ warehouse_name: "", country: "JP", location_type: "JP", address: "" });
    await loadWarehouses();
  }

  async function addSupplier(e: FormEvent) {
    e.preventDefault();
    const errors = validateSupplierForm(supplierForm);
    setSupplierFieldErrors(errors);
    if (hasFieldErrors(errors)) return;
    setError("");
    const res = await fetch("/api/proxy/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        supplier_cd: supplierForm.supplier_cd.trim() || null,
        supplier_name: supplierForm.supplier_name.trim(),
        supplier_name_jp: supplierForm.supplier_name_jp.trim() || null,
      }),
    });
    const data = await res.json();
    if (!data.success) {
      const msg = translateMessage(data.message ?? "M0002");
      setError(msg);
      toast.error(msg);
      return;
    }
    toast.success("Đã thêm nhà cung cấp.");
    setSupplierForm({ supplier_cd: "", supplier_name: "", supplier_name_jp: "" });
    await loadSuppliers();
  }

  async function deleteSupplier(id: number) {
    if (!confirm("Xóa nhà cung cấp này?")) return;
    const res = await fetch(`/api/proxy/suppliers/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!data.success) {
      toast.error(translateMessage(data.message ?? "M0002"));
      return;
    }
    toast.success("Đã xóa nhà cung cấp.");
    await loadSuppliers();
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: "categories", label: "Danh mục SP" },
    { id: "warehouses", label: "Kho hàng" },
    { id: "suppliers", label: "Nhà cung cấp" },
    { id: "units", label: "Đơn vị tính" },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Dữ liệu gốc" subtitle="Danh mục · Kho · NCC · Đơn vị — FE-V3-025/026" />

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm ${
              tab === t.id ? "bg-brand text-white" : "bg-white border border-border text-text-body"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <Card className="p-3 text-danger text-sm">{error}</Card>}

      {tab === "categories" && (
        <Card className="p-4 space-y-4">
          <form onSubmit={addCategory} className="flex flex-wrap gap-2 items-end">
            <div className="flex-1 min-w-[200px]">
              <Input
                label="Tên danh mục mới"
                required
                value={catName}
                onChange={(e) => {
                  setCatName(e.target.value);
                  setCatFieldErrors((prev) => clearFieldError(prev, "category_name"));
                }}
                error={catFieldErrors.category_name}
              />
            </div>
            <Button type="submit">Thêm</Button>
          </form>
          {loading ? (
            <p className="text-sm text-text-muted">Đang tải...</p>
          ) : (
            <Table>
              <Thead>
                <Tr>
                  <Th>ID</Th>
                  <Th>Tên</Th>
                  <Th />
                </Tr>
              </Thead>
              <tbody>
                {categories.map((c) => (
                  <Tr key={c.id}>
                    <Td>{c.id}</Td>
                    <Td>{c.category_name}</Td>
                    <Td>
                      <button type="button" onClick={() => deleteCategory(c.id)} className="text-xs text-danger hover:underline">
                        Xóa
                      </button>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      )}

      {tab === "warehouses" && (
        <Card className="p-4 space-y-4">
          <form onSubmit={addWarehouse} className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
            <Input
              label="Tên kho *"
              required
              value={whForm.warehouse_name}
              onChange={(e) => {
                setWhForm((f) => ({ ...f, warehouse_name: e.target.value }));
                setWhFieldErrors((prev) => clearFieldError(prev, "warehouse_name"));
              }}
              error={whFieldErrors.warehouse_name}
            />
            <Select
              label="Loại kho (JP/VN)"
              value={whForm.location_type}
              onChange={(e) => setWhForm((f) => ({ ...f, location_type: e.target.value }))}
              options={[
                { value: "JP", label: "🇯🇵 Kho Nhật (JP)" },
                { value: "VN", label: "🇻🇳 Kho Việt (VN)" },
              ]}
            />
            <div className="md:col-span-2">
              <Input
                label="Địa chỉ"
                value={whForm.address}
                onChange={(e) => setWhForm((f) => ({ ...f, address: e.target.value }))}
              />
            </div>
            <Button type="submit" className="w-fit">
              Thêm kho
            </Button>
          </form>
          <Table>
            <Thead>
              <Tr>
                <Th>Mã</Th>
                <Th>Tên</Th>
                <Th>Loại</Th>
                <Th>Quốc gia</Th>
              </Tr>
            </Thead>
            <tbody>
              {warehouses.map((w) => (
                <Tr key={w.id}>
                  <Td className="font-mono text-xs">{w.warehouse_cd ?? "—"}</Td>
                  <Td>{w.warehouse_name}</Td>
                  <Td>{w.location_type ?? "—"}</Td>
                  <Td>{w.country ?? "—"}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {tab === "suppliers" && (
        <div className="space-y-4">
          <Card className="p-4">
            <form onSubmit={addSupplier} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 items-end">
              <div>
                <label className="text-xs text-text-muted">Mã NCC</label>
                <Input
                  value={supplierForm.supplier_cd}
                  onChange={(e) => setSupplierForm((f) => ({ ...f, supplier_cd: e.target.value }))}
                  placeholder="SUP-001"
                />
              </div>
              <div>
                <label className="text-xs text-text-muted">Tên (VN) *</label>
                <Input
                  value={supplierForm.supplier_name}
                  onChange={(e) => {
                    setSupplierForm((f) => ({ ...f, supplier_name: e.target.value }));
                    clearFieldError(setSupplierFieldErrors, "supplier_name");
                  }}
                  error={supplierFieldErrors.supplier_name}
                />
              </div>
              <div>
                <label className="text-xs text-text-muted">Tên (JP)</label>
                <Input
                  value={supplierForm.supplier_name_jp}
                  onChange={(e) => setSupplierForm((f) => ({ ...f, supplier_name_jp: e.target.value }))}
                />
              </div>
              <Button type="submit">+ Thêm NCC</Button>
            </form>
          </Card>
          <Card className="p-4">
            {loading ? (
              <p className="text-sm text-text-muted">Đang tải...</p>
            ) : (
              <Table>
                <Thead>
                  <Tr>
                    <Th>Mã</Th>
                    <Th>Tên (VN)</Th>
                    <Th>Tên (JP)</Th>
                    <Th />
                  </Tr>
                </Thead>
                <tbody>
                  {suppliers.map((s) => (
                    <Tr key={s.id}>
                      <Td className="font-mono text-xs">{s.supplier_cd ?? "—"}</Td>
                      <Td>{s.supplier_name}</Td>
                      <Td className="text-text-muted">{s.supplier_name_jp ?? "—"}</Td>
                      <Td className="text-right">
                        <Button type="button" variant="ghost" size="sm" onClick={() => deleteSupplier(s.id)}>
                          Xóa
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </div>
      )}

      {tab === "units" && (
        <Card className="p-4">
          <p className="text-sm text-text-muted mb-4">
            Đơn vị tính chuẩn dùng khi tạo sản phẩm (tham chiếu form Hàng hóa).
          </p>
          <div className="flex flex-wrap gap-2">
            {PRODUCT_UNITS.map((u) => (
              <span
                key={u}
                className="px-3 py-1.5 rounded-full bg-surface-subtle border border-border text-sm text-text-body"
              >
                {u}
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
