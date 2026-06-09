"use client";

import {
  Badge,
  Button,
  Card,
  DetailField,
  DetailGrid,
  EmptyState,
  IconButton,
  Input,
  Modal,
  ModalFooter,
  PageHeader,
  SearchInput,
  Select,
  Table,
  Td,
  Th,
  Thead,
  Tr,
} from "@/components/ui";
import { ArrowUpFromLine, Eye, FileText, Plus } from "lucide-react";
import {
  clearFieldError,
  hasFieldErrors,
  validateStockMovement,
  type FieldErrors,
} from "@/lib/form-validation";
import { translateMessage } from "@/lib/messages";
import { toast } from "@/lib/toast";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

interface WarehouseOption {
  id: number;
  warehouse_name: string;
}

interface ProductOption {
  id: number;
  product_cd: string;
  product_name?: string;
  product_name_jp?: string;
  name_vi?: string;
  primary_image_url?: string;
}

interface WarehouseInventoryInfo {
  quantity: number;
  available_qty: number;
}

interface MovementItem {
  id: number;
  product_name?: string;
  warehouse_name?: string;
  quantity: number;
  quantity_before: number;
  quantity_after: number;
  reason?: string;
  created?: string;
}

const EMPTY_FORM = {
  warehouse_id: "",
  product_id: "",
  quantity: "",
  reason: "",
};

function productDisplayName(p: ProductOption): string {
  return p.name_vi || p.product_name || p.product_name_jp || p.product_cd;
}

function productSelectLabel(p: ProductOption): string {
  return `${p.product_cd} — ${productDisplayName(p)}`;
}

function formatDate(value?: string): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("vi-VN");
}

export function StockOutScreen() {
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [movements, setMovements] = useState<MovementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<MovementItem | null>(null);

  const [warehouseStock, setWarehouseStock] = useState<Record<number, WarehouseInventoryInfo>>({});
  const [stockLoading, setStockLoading] = useState(false);

  const [productQuery, setProductQuery] = useState("");
  const [productSuggestions, setProductSuggestions] = useState<ProductOption[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductOption | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadWarehouseStock = useCallback(async (warehouseId: string) => {
    if (!warehouseId) {
      setWarehouseStock({});
      return;
    }
    setStockLoading(true);
    try {
      const res = await fetch(
        `/api/proxy/inventories?warehouse_id=${warehouseId}&per_page=200`,
      );
      const data = await res.json();
      const map: Record<number, WarehouseInventoryInfo> = {};
      if (data.success && data.data?.items) {
        for (const item of data.data.items as Array<{
          product_id: number;
          quantity: number;
          available_qty: number;
        }>) {
          map[item.product_id] = {
            quantity: item.quantity,
            available_qty: item.available_qty,
          };
        }
      }
      setWarehouseStock(map);
    } catch {
      setWarehouseStock({});
    } finally {
      setStockLoading(false);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [whRes, mvRes] = await Promise.all([
        fetch("/api/proxy/warehouses"),
        fetch("/api/proxy/stock-movements?movement_type=OUT"),
      ]);
      const whData = await whRes.json();
      const mvData = await mvRes.json();
      if (whData.success && whData.data?.items) setWarehouses(whData.data.items);
      if (mvData.success && mvData.data?.items) setMovements(mvData.data.items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadWarehouseStock(form.warehouse_id);
  }, [form.warehouse_id, loadWarehouseStock]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = movements.filter((m) => {
      if (!m.created) return false;
      const d = new Date(m.created);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const totalQty = movements.reduce((sum, m) => sum + m.quantity, 0);
    const warehouseCount = new Set(movements.map((m) => m.warehouse_name).filter(Boolean)).size;
    return { total: movements.length, thisMonth, totalQty, warehouseCount };
  }, [movements]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return movements;
    return movements.filter(
      (m) =>
        (m.product_name ?? "").toLowerCase().includes(q) ||
        (m.warehouse_name ?? "").toLowerCase().includes(q) ||
        (m.reason ?? "").toLowerCase().includes(q),
    );
  }, [movements, search]);

  function stockInfoFor(productId: number): WarehouseInventoryInfo | null {
    return warehouseStock[productId] ?? null;
  }

  function stockBadge(productId: number): string {
    const info = stockInfoFor(productId);
    if (!info) return "Không có tồn";
    return `Khả dụng ${info.available_qty}`;
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setProductQuery("");
    setSelectedProduct(null);
    setProductSuggestions([]);
    setFieldErrors({});
    setError("");
  }

  function openCreate() {
    resetForm();
    setCreateOpen(true);
  }

  function closeCreate() {
    setCreateOpen(false);
    resetForm();
  }

  function handleProductQueryChange(value: string) {
    setProductQuery(value);
    setSelectedProduct(null);
    setForm((f) => ({ ...f, product_id: "" }));
    setFieldErrors((prev) => clearFieldError(prev, "product_id"));

    if (searchTimer.current) clearTimeout(searchTimer.current);

    if (!value.trim() || value.length < 2) {
      setProductSuggestions([]);
      setShowDropdown(false);
      return;
    }

    searchTimer.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/proxy/products?search=${encodeURIComponent(value)}&per_page=10`);
        const data = await res.json();
        if (data.success && data.data?.items) {
          setProductSuggestions(data.data.items);
          setShowDropdown(true);
        }
      } catch {
        // ignore search errors
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  }

  function handleSelectProduct(p: ProductOption) {
    setSelectedProduct(p);
    setProductQuery(productSelectLabel(p));
    setForm((f) => ({ ...f, product_id: String(p.id) }));
    setShowDropdown(false);
    setFieldErrors((prev) => clearFieldError(prev, "product_id"));
  }

  function patchForm<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setFieldErrors((prev) => clearFieldError(prev, key));
    if (key === "warehouse_id") {
      setSelectedProduct(null);
      setProductQuery("");
      setForm((f) => ({ ...f, product_id: "" }));
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errors = validateStockMovement(form);
    const productId = Number(form.product_id);
    const qty = Number(form.quantity);
    const stock = stockInfoFor(productId);

    if (!stock || stock.available_qty <= 0) {
      errors.product_id = "Sản phẩm không có tồn khả dụng trong kho đã chọn.";
    } else if (qty > stock.available_qty) {
      errors.quantity = `Vượt tồn khả dụng (${stock.available_qty}).`;
    }

    setFieldErrors(errors);
    if (hasFieldErrors(errors) || !stock) {
      setError("Vui lòng kiểm tra các trường được đánh dấu.");
      return;
    }

    const stockSnapshot = stock;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/proxy/stock-movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movement_type: "OUT",
          warehouse_id: Number(form.warehouse_id),
          product_id: productId,
          quantity: qty,
          reason: form.reason || "Xuất kho thủ công",
          ref_type: "manual",
        }),
      });
      const data = await res.json();
      if (!data.success) {
        const msg = translateMessage(data.message ?? "M1002");
        setError(msg);
        toast.error(msg);
        return;
      }

      toast.success(`Đã xuất ${qty} sản phẩm (tồn mới: ${stockSnapshot.quantity - qty}).`);
      closeCreate();
      await Promise.all([loadData(), loadWarehouseStock(form.warehouse_id)]);
    } catch {
      const msg = "Không thể xuất kho.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  const selectedStock = selectedProduct ? stockInfoFor(selectedProduct.id) : null;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Xuất Kho"
        subtitle={`${movements.length} phiếu xuất`}
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4" />
            Tạo Phiếu Xuất
          </Button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Tổng Phiếu", value: stats.total, color: "text-brand" },
          { label: "Tháng Này", value: stats.thisMonth, color: "text-warning" },
          { label: "Tổng SL Xuất", value: stats.totalQty.toLocaleString("vi-VN"), color: "text-danger" },
          { label: "Số Kho", value: stats.warehouseCount, color: "text-text-muted" },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-text-muted">{s.label}</p>
            <p className={`text-xl mt-1 font-semibold ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <SearchInput
          placeholder="Tìm sản phẩm, kho, lý do..."
          value={search}
          onChange={setSearch}
          className="w-full"
        />
      </Card>

      <Card>
        {loading ? (
          <EmptyState message="Đang tải..." icon="⏳" />
        ) : filtered.length === 0 ? (
          <EmptyState
            message={search ? "Không tìm thấy phiếu xuất phù hợp." : "Chưa có phiếu xuất kho."}
            icon="📤"
          />
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>Sản phẩm</Th>
                <Th>Kho</Th>
                <Th>Số lượng</Th>
                <Th>Trước → Sau</Th>
                <Th>Lý do</Th>
                <Th>Thời gian</Th>
                <Th>Thao tác</Th>
              </tr>
            </Thead>
            <tbody>
              {filtered.map((m) => (
                <Tr key={m.id}>
                  <Td>
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-brand shrink-0" />
                      <span className="text-xs font-medium">{m.product_name ?? `ID:${m.id}`}</span>
                    </div>
                  </Td>
                  <Td className="text-xs">{m.warehouse_name ?? "—"}</Td>
                  <Td className="font-semibold text-danger text-xs">-{m.quantity}</Td>
                  <Td className="text-xs text-text-muted">
                    {m.quantity_before} → {m.quantity_after}
                  </Td>
                  <Td className="text-xs max-w-[160px] truncate">{m.reason ?? "—"}</Td>
                  <Td className="text-xs text-text-muted">{formatDate(m.created)}</Td>
                  <Td>
                    <IconButton
                      variant="primary"
                      title="Chi tiết"
                      onClick={() => {
                        setSelected(m);
                        setDetailOpen(true);
                      }}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </IconButton>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal
        open={createOpen}
        onClose={closeCreate}
        title="Tạo Phiếu Xuất Kho"
        headerIcon={<ArrowUpFromLine className="w-4 h-4" />}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Kho *"
            required
            value={form.warehouse_id}
            onChange={(e) => patchForm("warehouse_id", e.target.value)}
            options={warehouses.map((w) => ({ value: w.id, label: w.warehouse_name }))}
            placeholder="Chọn kho"
            error={fieldErrors.warehouse_id}
          />

          <div className="relative" ref={dropdownRef}>
            <label className="block text-sm font-medium text-text-body mb-1.5">Sản phẩm *</label>
            <div className="relative">
              <input
                type="text"
                value={productQuery}
                onChange={(e) => handleProductQueryChange(e.target.value)}
                onFocus={() => productSuggestions.length > 0 && setShowDropdown(true)}
                placeholder={
                  form.warehouse_id
                    ? "Tìm theo tên hoặc mã sản phẩm..."
                    : "Chọn kho trước, rồi tìm sản phẩm..."
                }
                disabled={!form.warehouse_id}
                className={`w-full px-3.5 py-2.5 rounded-xl border bg-surface-subtle/50 text-sm text-text-primary placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand focus:bg-white transition-all disabled:opacity-60 ${
                  fieldErrors.product_id ? "border-danger" : "border-border"
                }`}
              />
              {(searchLoading || stockLoading) && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-placeholder">
                  ⏳
                </span>
              )}
            </div>
            {fieldErrors.product_id && (
              <p className="text-xs text-danger mt-1">{fieldErrors.product_id}</p>
            )}
            {selectedProduct && (
              <div className="text-xs mt-1.5 space-y-0.5">
                <p className="text-success">✅ {productSelectLabel(selectedProduct)}</p>
                {form.warehouse_id && (
                  <p className={selectedStock && selectedStock.available_qty > 0 ? "text-text-muted" : "text-danger"}>
                    {selectedStock && selectedStock.available_qty > 0
                      ? `Tồn ${selectedStock.quantity}, khả dụng ${selectedStock.available_qty}`
                      : "Không đủ tồn để xuất trong kho này"}
                  </p>
                )}
              </div>
            )}

            {showDropdown && productSuggestions.length > 0 && (
              <ul className="absolute z-[60] w-full mt-1 bg-white border border-border rounded-xl shadow-lg max-h-56 overflow-y-auto">
                {productSuggestions.map((p) => {
                  const info = stockInfoFor(p.id);
                  const canOut = !!info && info.available_qty > 0;
                  return (
                    <li
                      key={p.id}
                      onMouseDown={() => handleSelectProduct(p)}
                      className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-surface transition-colors text-sm"
                    >
                      {p.primary_image_url && (
                        <img
                          src={p.primary_image_url}
                          alt=""
                          className="w-8 h-8 rounded-lg object-cover shrink-0"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate text-brand text-xs">{p.product_cd}</p>
                        <p className="text-xs text-text-muted truncate">{productDisplayName(p)}</p>
                      </div>
                      {form.warehouse_id && (
                        <Badge variant={canOut ? "success" : "danger"} className="shrink-0 text-[10px]">
                          {canOut ? stockBadge(p.id) : "Hết tồn"}
                        </Badge>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            {showDropdown && !searchLoading && productSuggestions.length === 0 && productQuery.length >= 2 && (
              <div className="absolute z-[60] w-full mt-1 bg-white border border-border rounded-xl shadow-lg px-3 py-2 text-sm text-text-muted">
                Không tìm thấy sản phẩm trong danh mục hàng hóa
              </div>
            )}
          </div>

          <Input
            label="Số lượng *"
            required
            type="number"
            min={1}
            value={form.quantity}
            onChange={(e) => patchForm("quantity", e.target.value)}
            error={fieldErrors.quantity}
          />
          <Input
            label="Lý do xuất kho"
            value={form.reason}
            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            placeholder="VD: Xuất cho đơn hàng, điều chỉnh tồn kho..."
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <ModalFooter>
            <Button variant="secondary" type="button" onClick={closeCreate}>
              Hủy
            </Button>
            <Button
              type="submit"
              variant="danger"
              disabled={saving || !form.product_id || !form.warehouse_id}
            >
              {saving ? "Đang lưu..." : "Xuất kho"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={`Chi Tiết Phiếu Xuất #${selected?.id ?? ""}`}
        headerIcon={<FileText className="w-4 h-4" />}
        size="xl"
        footer={
          <ModalFooter>
            <Button variant="secondary" onClick={() => setDetailOpen(false)}>
              Đóng
            </Button>
          </ModalFooter>
        }
      >
        {selected && (
          <div className="space-y-5">
            <DetailGrid>
              <DetailField label="Mã phiếu">
                <span className="font-mono font-semibold">#{selected.id}</span>
              </DetailField>
              <DetailField label="Trạng thái">
                <Badge variant="success">Hoàn thành</Badge>
              </DetailField>
              <DetailField label="Sản phẩm" span={2}>
                {selected.product_name ?? "—"}
              </DetailField>
              <DetailField label="Kho xuất">{selected.warehouse_name ?? "—"}</DetailField>
              <DetailField label="Ngày tạo">{formatDate(selected.created)}</DetailField>
            </DetailGrid>

            <Table>
              <Thead>
                <tr>
                  <Th>Số lượng xuất</Th>
                  <Th>Tồn trước</Th>
                  <Th>Tồn sau</Th>
                  <Th>Lý do</Th>
                </tr>
              </Thead>
              <tbody>
                <Tr>
                  <Td className="text-danger font-semibold">-{selected.quantity}</Td>
                  <Td className="text-xs">{selected.quantity_before}</Td>
                  <Td className="text-xs font-medium">{selected.quantity_after}</Td>
                  <Td className="text-xs">{selected.reason ?? "—"}</Td>
                </Tr>
              </tbody>
            </Table>
          </div>
        )}
      </Modal>
    </div>
  );
}
