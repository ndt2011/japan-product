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
import { FormEvent, useCallback, useEffect, useState } from "react";

interface WarehouseOption {
  id: number;
  warehouse_name: string;
}

interface MovementItem {
  id: number;
  product_name?: string;
  warehouse_name?: string;
  quantity: number;
  quantity_before: number;
  quantity_after: number;
  reason?: string;
}

export function StockOutScreen() {
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
          movement_type: "OUT",
          warehouse_id: Number(form.warehouse_id),
          product_id: Number(form.product_id),
          quantity: Number(form.quantity),
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
      toast.success("Đã xuất kho thành công.");
      setForm({ warehouse_id: "", product_id: "", quantity: "", reason: "" });
      await loadData();
    } catch {
      const msg = "Không thể xuất kho.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Xuất Kho" subtitle="POST /stock-movements (OUT)" />

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
          <Input
            label="Mã sản phẩm (ID) *"
            required
            type="number"
            min={1}
            value={form.product_id}
            onChange={(e) => patchForm("product_id", e.target.value)}
            error={fieldErrors.product_id}
          />
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
            label="Lý do"
            value={form.reason}
            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
          />
          <div className="md:col-span-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Đang lưu..." : "Xuất kho"}
            </Button>
          </div>
        </form>
        {error && <p className="text-sm text-danger mt-3">{error}</p>}
      </Card>

      <Card>
        {loading ? (
          <EmptyState message="Đang tải..." icon="⏳" />
        ) : movements.length === 0 ? (
          <EmptyState message="Chưa có phiếu xuất kho." />
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>SP</Th>
                <Th>Kho</Th>
                <Th>SL</Th>
                <Th>Trước → Sau</Th>
                <Th>Lý do</Th>
              </tr>
            </Thead>
            <tbody>
              {movements.map((m) => (
                <Tr key={m.id}>
                  <Td>{m.product_name ?? m.id}</Td>
                  <Td>{m.warehouse_name ?? "—"}</Td>
                  <Td>{m.quantity}</Td>
                  <Td>
                    {m.quantity_before} → {m.quantity_after}
                  </Td>
                  <Td className="text-xs">{m.reason ?? "—"}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
