"use client";

import { Button, Card, EmptyState, Input, PageHeader, Select, Table, Td, Th, Thead, Tr } from "@/components/ui";
import {
  clearFieldError,
  hasFieldErrors,
  validateInventoryCheck,
  validateInventoryEdit,
  type FieldErrors,
} from "@/lib/form-validation";
import { translateMessage } from "@/lib/messages";
import { FormEvent, useCallback, useEffect, useState } from "react";

interface WarehouseOption { id: number; warehouse_name: string; }

interface InventoryItem {
  id: number;
  inventory_cd?: string | null;
  product_id: number;
  product_name?: string;
  product_cd?: string;
  warehouse_name?: string;
  quantity: number;
  reserved_qty: number;
  available_qty: number;
  actual_qty: number;
  is_low_stock: boolean;
  restock_status?: string;
  restock_eta?: string | null;
  min_stock_qty?: number;
  notes?: string | null;
}

const RESTOCK_OPTIONS = [
  { value: "NORMAL", label: "🟢 Bình thường" },
  { value: "LOW", label: "🟡 Sắp hết" },
  { value: "CRITICAL", label: "🔴 Thiếu hàng" },
  { value: "ON_ORDER", label: "🔵 Đang đặt hàng" },
];

function RestockBadge({ status }: { status?: string }) {
  if (status === "CRITICAL") return <span className="text-danger font-medium text-xs">🔴 Thiếu</span>;
  if (status === "LOW") return <span className="text-yellow-600 font-medium text-xs">🟡 Thấp</span>;
  if (status === "ON_ORDER") return <span className="text-brand font-medium text-xs">🔵 Đặt hàng</span>;
  return <span className="text-green-600 font-medium text-xs">🟢 OK</span>;
}

export function InventoryScreen() {
  const [tab, setTab] = useState<"list" | "check">("list");
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [editForm, setEditForm] = useState({ min_stock_qty: "5", restock_status: "NORMAL", restock_eta: "", notes: "" });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [checkFieldErrors, setCheckFieldErrors] = useState<FieldErrors>({});
  const [editFieldErrors, setEditFieldErrors] = useState<FieldErrors>({});

  const [deleting, setDeleting] = useState<InventoryItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // CSV Import modal (FE-V3-013)
  const [showImport, setShowImport] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<{imported: number; errors: string[]; total_rows: number} | null>(null);

  const [checkForm, setCheckForm] = useState({ warehouse_id: "", product_id: "", actual_qty: "", reason: "Kiểm kê định kỳ" });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [whRes, invRes] = await Promise.all([
        fetch("/api/proxy/warehouses"),
        fetch("/api/proxy/inventories"),
      ]);
      const whData = await whRes.json();
      const invData = await invRes.json();
      if (whData.success && whData.data?.items) setWarehouses(whData.data.items);
      if (invData.success && invData.data?.items) setItems(invData.data.items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  function openEdit(row: InventoryItem) {
    setEditing(row);
    setEditForm({
      min_stock_qty: String(row.min_stock_qty ?? 5),
      restock_status: row.restock_status ?? "NORMAL",
      restock_eta: row.restock_eta ?? "",
      notes: row.notes ?? "",
    });
    setEditError("");
    setEditFieldErrors({});
  }

  async function handleEdit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const errors = validateInventoryEdit(editForm);
    setEditFieldErrors(errors);
    if (hasFieldErrors(errors)) {
      setEditError("Vui lòng kiểm tra các trường được đánh dấu.");
      return;
    }
    setEditSaving(true);
    setEditError("");
    try {
      const res = await fetch(`/api/proxy/inventories/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          min_stock_qty: Number(editForm.min_stock_qty) || 5,
          restock_status: editForm.restock_status,
          restock_eta: editForm.restock_eta || null,
          notes: editForm.notes || null,
        }),
      });
      const data = await res.json();
      if (!data.success) { setEditError(translateMessage(data.message ?? "M0001")); return; }
      setEditing(null);
      await loadData();
    } catch { setEditError("Lưu thất bại."); }
    finally { setEditSaving(false); }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/proxy/inventories/${deleting.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) { setDeleting(null); await loadData(); }
      else setError(translateMessage(data.message ?? "M0001"));
    } finally { setDeleteLoading(false); }
  }

  async function handleImport() {
    if (!csvFile) return;
    setImportLoading(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append("file", csvFile);
      const res = await fetch("/api/proxy/inventories/bulk-import", { method: "POST", body: formData });
      const data = await res.json();
      const result = data.data ?? {};
      setImportResult({
        imported: result.imported ?? 0,
        errors: result.errors ?? [],
        total_rows: result.total_rows ?? 0,
      });
      if ((result.imported ?? 0) > 0) await loadData();
    } catch { setImportResult({ imported: 0, errors: ["Lỗi kết nối"], total_rows: 0 }); }
    finally { setImportLoading(false); }
  }

  async function handleCheck(e: FormEvent) {
    e.preventDefault();
    const errors = validateInventoryCheck(checkForm);
    setCheckFieldErrors(errors);
    if (hasFieldErrors(errors)) {
      setError("Vui lòng kiểm tra các trường được đánh dấu.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/proxy/inventory-checks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warehouse_id: Number(checkForm.warehouse_id),
          reason: checkForm.reason,
          items: [{ product_id: Number(checkForm.product_id), actual_qty: Number(checkForm.actual_qty) }],
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(translateMessage(data.message ?? "M0001")); return; }
      setCheckForm((f) => ({ ...f, product_id: "", actual_qty: "" }));
      await loadData();
    } catch { setError("Kiểm kê thất bại."); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Kiểm Kê Kho" subtitle="Tồn kho · Kiểm kê · Cập nhật ngưỡng" />

      <div className="flex items-center justify-between border-b border-border">
        <div className="flex gap-2">
        {[{ id: "list" as const, label: "Tồn Kho" }, { id: "check" as const, label: "Kiểm Kê" }].map((t) => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)}
            className={`pb-3 px-1 text-sm border-b-2 transition-colors ${tab === t.id ? "border-brand text-brand" : "border-transparent text-text-muted"}`}>
            {t.label}
          </button>
        ))}
        </div>
        <button
          type="button"
          onClick={() => { setShowImport(true); setImportResult(null); setCsvFile(null); }}
          className="mb-1 text-xs px-3 py-1.5 rounded-lg border border-brand text-brand hover:bg-brand/10 transition-colors"
        >
          📥 Import CSV
        </button>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {tab === "check" ? (
        <Card className="p-6">
          <form onSubmit={handleCheck} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Kho *" required value={checkForm.warehouse_id}
              onChange={(e) => {
                setCheckForm((f) => ({ ...f, warehouse_id: e.target.value }));
                setCheckFieldErrors((prev) => clearFieldError(prev, "warehouse_id"));
              }}
              options={warehouses.map((w) => ({ value: w.id, label: w.warehouse_name }))} placeholder="Chọn kho"
              error={checkFieldErrors.warehouse_id} />
            <Input label="Product ID *" required type="number" value={checkForm.product_id}
              onChange={(e) => {
                setCheckForm((f) => ({ ...f, product_id: e.target.value }));
                setCheckFieldErrors((prev) => clearFieldError(prev, "product_id"));
              }}
              error={checkFieldErrors.product_id} />
            <Input label="Số thực tế *" required type="number" min={0} value={checkForm.actual_qty}
              onChange={(e) => {
                setCheckForm((f) => ({ ...f, actual_qty: e.target.value }));
                setCheckFieldErrors((prev) => clearFieldError(prev, "actual_qty"));
              }}
              error={checkFieldErrors.actual_qty} />
            <Input label="Lý do" value={checkForm.reason}
              onChange={(e) => setCheckForm((f) => ({ ...f, reason: e.target.value }))} />
            <div className="md:col-span-2">
              <Button type="submit" disabled={saving}>{saving ? "Đang lưu..." : "Ghi nhận kiểm kê"}</Button>
            </div>
          </form>
        </Card>
      ) : (
        <Card>
          {loading ? <EmptyState message="Đang tải tồn kho..." icon="⏳" /> :
            items.length === 0 ? <EmptyState message="Chưa có tồn kho. Nhập kho trước." /> : (
              <Table>
                <Thead>
                  <tr>
                    <Th>Mã kho</Th><Th>Mã SP</Th><Th>Tên sản phẩm</Th><Th>Kho</Th>
                    <Th>Trạng thái</Th><Th>Tồn</Th><Th>Khả dụng</Th><Th>Ngưỡng</Th><Th></Th>
                  </tr>
                </Thead>
                <tbody>
                  {items.map((row) => (
                    <Tr key={row.id}>
                      <Td className="text-xs font-mono">{row.inventory_cd ?? "—"}</Td>
                      <Td>{row.product_cd ?? row.product_id}</Td>
                      <Td>{row.product_name ?? "—"}</Td>
                      <Td>{row.warehouse_name ?? "—"}</Td>
                      <Td><RestockBadge status={row.restock_status} /></Td>
                      <Td>{row.quantity}</Td>
                      <Td className={row.is_low_stock ? "text-danger font-medium" : ""}>{row.available_qty}</Td>
                      <Td className="text-xs text-text-muted">{row.min_stock_qty ?? 5}</Td>
                      <Td>
                        <div className="flex gap-1">
                          <button type="button" onClick={() => openEdit(row)}
                            className="text-xs text-brand hover:underline px-1" title="Sửa">✏️</button>
                          <button type="button" onClick={() => setDeleting(row)}
                            className="text-xs text-danger hover:underline px-1" title="Xóa">🗑️</button>
                        </div>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )}
        </Card>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <p className="font-medium text-text-primary">Cập nhật — {editing.product_name ?? `ID ${editing.id}`}</p>
              <button type="button" onClick={() => setEditing(null)} className="text-text-muted hover:text-text-primary">✕</button>
            </div>
            <form onSubmit={handleEdit} className="p-5 space-y-4">
              <Input label="Ngưỡng tối thiểu" type="number" min={0} value={editForm.min_stock_qty}
                onChange={(e) => {
                  setEditForm((f) => ({ ...f, min_stock_qty: e.target.value }));
                  setEditFieldErrors((prev) => clearFieldError(prev, "min_stock_qty"));
                }}
                error={editFieldErrors.min_stock_qty} />
              <Select label="Trạng thái nhập hàng" value={editForm.restock_status}
                onChange={(e) => setEditForm((f) => ({ ...f, restock_status: e.target.value }))}
                options={RESTOCK_OPTIONS} />
              <Input label="ETA nhập hàng" type="date" value={editForm.restock_eta}
                onChange={(e) => setEditForm((f) => ({ ...f, restock_eta: e.target.value }))} />
              <Input label="Ghi chú" value={editForm.notes}
                onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))} />
              {editError && <p className="text-sm text-danger">{editError}</p>}
              <div className="flex gap-2 justify-end pt-1">
                <Button variant="outline" type="button" onClick={() => setEditing(null)}>Hủy</Button>
                <Button type="submit" disabled={editSaving}>{editSaving ? "Đang lưu..." : "Lưu"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <p className="font-medium text-text-primary">Xóa bản ghi kho?</p>
            <p className="text-sm text-text-muted">
              <span className="font-mono">{deleting.inventory_cd ?? `ID ${deleting.id}`}</span> — {deleting.product_name}
            </p>
            <p className="text-xs text-danger">Hành động này không thể hoàn tác.</p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" type="button" onClick={() => setDeleting(null)}>Hủy</Button>
              <Button variant="danger" disabled={deleteLoading} onClick={handleDelete}>
                {deleteLoading ? "Đang xóa..." : "Xóa"}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* CSV Import Modal (FE-V3-013) */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <p className="font-medium text-text-primary">📥 Import Kho từ CSV</p>
              <button type="button" onClick={() => setShowImport(false)} className="text-text-muted hover:text-text-primary">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-surface-subtle rounded-lg p-3 text-xs text-text-muted space-y-1">
                <p className="font-medium text-text-primary">Định dạng CSV (header bắt buộc):</p>
                <p className="font-mono">product_cd,warehouse_id,quantity,min_stock_qty,notes</p>
                <p className="text-[10px]">• product_cd: mã sản phẩm (bắt buộc)</p>
                <p className="text-[10px]">• warehouse_id: ID kho (bắt buộc)</p>
                <p className="text-[10px]">• quantity: số lượng nhập (bắt buộc)</p>
                <p className="text-[10px]">• min_stock_qty, notes: tùy chọn</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Chọn file CSV</label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => { setCsvFile(e.target.files?.[0] ?? null); setImportResult(null); }}
                  className="block w-full text-sm text-text-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-brand file:text-white hover:file:bg-brand/90"
                />
              </div>
              {importResult && (
                <div className={`rounded-lg p-3 text-sm ${importResult.imported > 0 ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
                  <p className="font-medium">
                    ✅ Đã nhập: {importResult.imported}/{importResult.total_rows} dòng
                  </p>
                  {importResult.errors.length > 0 && (
                    <ul className="mt-1.5 text-xs space-y-0.5">
                      {importResult.errors.slice(0, 5).map((e, i) => <li key={i}>⚠️ {e}</li>)}
                      {importResult.errors.length > 5 && <li>... và {importResult.errors.length - 5} lỗi khác</li>}
                    </ul>
                  )}
                </div>
              )}
              <div className="flex gap-2 justify-end pt-1">
                <Button variant="outline" type="button" onClick={() => setShowImport(false)}>Đóng</Button>
                <Button type="button" disabled={!csvFile || importLoading} onClick={handleImport}>
                  {importLoading ? "Đang nhập..." : "Import"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
