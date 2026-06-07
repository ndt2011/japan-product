"use client";

import { Button, Card, EmptyState, Input, PageHeader, Select, Table, Td, Th, Thead, Tr } from "@/components/ui";
import { translateMessage } from "@/lib/messages";
import { FormEvent, useCallback, useEffect, useState } from "react";

interface WarehouseOption {
  id: number;
  warehouse_name: string;
}

interface InventoryItem {
  id: number;
  product_id: number;
  product_name?: string;
  product_cd?: string;
  warehouse_name?: string;
  quantity: number;
  reserved_qty: number;
  available_qty: number;
  actual_qty: number;
  is_low_stock: boolean;
}

export function InventoryScreen() {
  const [tab, setTab] = useState<"list" | "check">("list");
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [checkForm, setCheckForm] = useState({
    warehouse_id: "",
    product_id: "",
    actual_qty: "",
    reason: "Kiểm kê định kỳ",
  });

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

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleCheck(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/proxy/inventory-checks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warehouse_id: Number(checkForm.warehouse_id),
          reason: checkForm.reason,
          items: [
            {
              product_id: Number(checkForm.product_id),
              actual_qty: Number(checkForm.actual_qty),
            },
          ],
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(translateMessage(data.message ?? "M0001"));
        return;
      }
      setCheckForm((f) => ({ ...f, product_id: "", actual_qty: "" }));
      await loadData();
    } catch {
      setError("Kiểm kê thất bại.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Kiểm Kê Kho" subtitle="GET /inventories · POST /inventory-checks" />

      <div className="flex gap-2 border-b border-border">
        {[
          { id: "list" as const, label: "Tồn Kho" },
          { id: "check" as const, label: "Kiểm Kê" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`pb-3 px-1 text-sm border-b-2 transition-colors ${
              tab === t.id ? "border-brand text-brand" : "border-transparent text-text-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "check" ? (
        <Card className="p-6">
          <form onSubmit={handleCheck} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Kho *"
              required
              value={checkForm.warehouse_id}
              onChange={(e) => setCheckForm((f) => ({ ...f, warehouse_id: e.target.value }))}
              options={warehouses.map((w) => ({ value: w.id, label: w.warehouse_name }))}
              placeholder="Chọn kho"
            />
            <Input
              label="Product ID *"
              required
              type="number"
              value={checkForm.product_id}
              onChange={(e) => setCheckForm((f) => ({ ...f, product_id: e.target.value }))}
            />
            <Input
              label="Số thực tế *"
              required
              type="number"
              min={0}
              value={checkForm.actual_qty}
              onChange={(e) => setCheckForm((f) => ({ ...f, actual_qty: e.target.value }))}
            />
            <Input
              label="Lý do"
              value={checkForm.reason}
              onChange={(e) => setCheckForm((f) => ({ ...f, reason: e.target.value }))}
            />
            <div className="md:col-span-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Đang lưu..." : "Ghi nhận kiểm kê"}
              </Button>
            </div>
          </form>
          {error && <p className="text-sm text-danger mt-3">{error}</p>}
        </Card>
      ) : (
        <Card>
          {loading ? (
            <EmptyState message="Đang tải tồn kho..." icon="⏳" />
          ) : items.length === 0 ? (
            <EmptyState message="Chưa có tồn kho. Nhập kho trước." />
          ) : (
            <Table>
              <Thead>
                <tr>
                  <Th>Mã SP</Th>
                  <Th>Tên</Th>
                  <Th>Kho</Th>
                  <Th>Tồn</Th>
                  <Th>Đặt trước</Th>
                  <Th>Khả dụng</Th>
                </tr>
              </Thead>
              <tbody>
                {items.map((row) => (
                  <Tr key={row.id}>
                    <Td>{row.product_cd ?? row.product_id}</Td>
                    <Td>{row.product_name ?? "—"}</Td>
                    <Td>{row.warehouse_name ?? "—"}</Td>
                    <Td>{row.quantity}</Td>
                    <Td>{row.reserved_qty}</Td>
                    <Td className={row.is_low_stock ? "text-danger font-medium" : ""}>
                      {row.available_qty}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      )}
    </div>
  );
}
