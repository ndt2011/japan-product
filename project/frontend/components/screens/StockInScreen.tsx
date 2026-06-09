"use client";

import { Button, Card, EmptyState, Input, PageHeader, Select, Table, Td, Th, Thead, Tr } from "@/components/ui";
import {
  clearFieldError,
  hasFieldErrors,
  validateStockMovement,
  type FieldErrors,
} from "@/lib/form-validation";
import { translateMessage } from "@/lib/messages";
import { toast } from "@/lib/toast";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

interface WarehouseOption {
  id: number;
  warehouse_name: string;
}

interface ProductOption {
  id: number;
  product_cd: string;
  name_jp: string;
  name_vi?: string;
  primary_image_url?: string;
}

interface MovementItem {
  id: number;
  movement_type: string;
  product_name?: string;
  warehouse_name?: string;
  quantity: number;
  quantity_before: number;
  quantity_after: number;
  reason?: string;
  created?: string;
}

export function StockInScreen() {
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [movements, setMovements] = useState<MovementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [form, setForm] = useState({
    warehouse_id: "",
    product_id: "",
    quantity: "",
    reason: "",
  });

  // Product autocomplete state
  const [productQuery, setProductQuery] = useState("");
  const [productSuggestions, setProductSuggestions] = useState<ProductOption[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductOption | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [whRes, mvRes] = await Promise.all([
        fetch("/api/proxy/warehouses"),
        fetch("/api/proxy/stock-movements?movement_type=IN"),
      ]);
      const whData = await whRes.json();
      const mvData = await mvRes.json();
      if (whData.success && whData.data?.items) setWarehouses(whData.data.items);
      if (mvData.success && mvData.data?.items) setMovements(mvData.data.items);
    } catch {
      setError("API_OFFLINE");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced product search
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
    setProductQuery(p.product_cd + (p.name_vi ? ` — ${p.name_vi}` : ` — ${p.name_jp}`));
    setForm((f) => ({ ...f, product_id: String(p.id) }));
    setShowDropdown(false);
    setFieldErrors((prev) => clearFieldError(prev, "product_id"));
  }

  function patchForm<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setFieldErrors((prev) => clearFieldError(prev, key));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errors = validateStockMovement(form);
    setFieldErrors(errors);
    if (hasFieldErrors(errors)) {
      setError("Vui lòng kiểm tra các trường được đánh dấu.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/proxy/stock-movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movement_type: "IN",
          warehouse_id: Number(form.warehouse_id),
          product_id: Number(form.product_id),
          quantity: Number(form.quantity),
          reason: form.reason || "Nhập kho thủ công",
          ref_type: "manual",
        }),
      });
      const data = await res.json();
      if (!data.success) {
        const msg = translateMessage(data.message ?? "M0001");
        setError(msg);
        toast.error(msg);
        return;
      }
      toast.success("Đã nhập kho thành công.");
      setForm({ warehouse_id: "", product_id: "", quantity: "", reason: "" });
      setProductQuery("");
      setSelectedProduct(null);
      setProductSuggestions([]);
      await loadData();
    } catch {
      const msg = "Không thể nhập kho.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Phiếu Nhập Kho" subtitle="Nhập kho thủ công theo sản phẩm" />

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Kho *"
            required
            value={form.warehouse_id}
            onChange={(e) => patchForm("warehouse_id", e.target.value)}
            options={warehouses.map((w) => ({ value: w.id, label: w.warehouse_name }))}
            placeholder="Chọn kho"
            error={fieldErrors.warehouse_id}
          />

          {/* Product Autocomplete */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sản phẩm *
            </label>
            <div className="relative">
              <input
                type="text"
                value={productQuery}
                onChange={(e) => handleProductQueryChange(e.target.value)}
                onFocus={() => productSuggestions.length > 0 && setShowDropdown(true)}
                placeholder="Tìm theo tên hoặc mã sản phẩm..."
                className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
                  fieldErrors.product_id ? "border-danger" : "border-gray-300"
                }`}
              />
              {searchLoading && (
                <span className="absolute right-2 top-2.5 text-xs text-gray-400">⏳</span>
              )}
            </div>
            {fieldErrors.product_id && (
              <p className="text-xs text-danger mt-1">{fieldErrors.product_id}</p>
            )}
            {selectedProduct && (
              <p className="text-xs text-success mt-1">
                ✅ ID: {selectedProduct.id} · {selectedProduct.product_cd}
              </p>
            )}

            {/* Dropdown suggestions */}
            {showDropdown && productSuggestions.length > 0 && (
              <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-56 overflow-y-auto">
                {productSuggestions.map((p) => (
                  <li
                    key={p.id}
                    onMouseDown={() => handleSelectProduct(p)}
                    className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 text-sm"
                  >
                    {p.primary_image_url && (
                      <img src={p.primary_image_url} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium truncate">{p.product_cd}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {p.name_vi || p.name_jp}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {showDropdown && !searchLoading && productSuggestions.length === 0 && productQuery.length >= 2 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg px-3 py-2 text-sm text-gray-500">
                Không tìm thấy sản phẩm
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
            label="Lý do nhập kho"
            value={form.reason}
            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            placeholder="VD: Hàng về từ nhà cung cấp, điều chỉnh tồn kho..."
          />
          <div className="md:col-span-2">
            <Button type="submit" disabled={saving || !form.product_id}>
              {saving ? "Đang lưu..." : "Nhập kho"}
            </Button>
          </div>
        </form>
        {error && <p className="text-sm text-danger mt-3">{error}</p>}
      </Card>

      <Card>
        {loading ? (
          <EmptyState message="Đang tải..." icon="⏳" />
        ) : movements.length === 0 ? (
          <EmptyState message="Chưa có phiếu nhập kho." />
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
              </tr>
            </Thead>
            <tbody>
              {movements.map((m) => (
                <Tr key={m.id}>
                  <Td>{m.product_name ?? `ID:${m.id}`}</Td>
                  <Td>{m.warehouse_name ?? "—"}</Td>
                  <Td className="font-semibold text-success">+{m.quantity}</Td>
                  <Td className="text-xs text-gray-500">
                    {m.quantity_before} → {m.quantity_after}
                  </Td>
                  <Td className="text-xs">{m.reason ?? "—"}</Td>
                  <Td className="text-xs text-gray-400">
                    {m.created ? new Date(m.created).toLocaleDateString("vi-VN") : "—"}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
