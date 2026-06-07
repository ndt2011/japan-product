"use client";

import { Button, Card, Input, PageHeader, Select } from "@/components/ui";
import { translateMessage } from "@/lib/messages";
import type { ProductItem } from "@/types/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface LineRow {
  product_id: number | "";
  quantity: number;
}

export function OrderFormScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [lines, setLines] = useState<LineRow[]>([{ product_id: "", quantity: 1 }]);
  const [biko, setBiko] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/proxy/products?per_page=100")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data?.items) setProducts(d.data.items);
      });
  }, []);

  function updateLine(index: number, patch: Partial<LineRow>) {
    setLines((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addLine() {
    setLines((prev) => [...prev, { product_id: "", quantity: 1 }]);
  }

  async function save(submit: boolean) {
    setError("");
    const items = lines
      .filter((l) => l.product_id && l.quantity > 0)
      .map((l) => ({ product_id: Number(l.product_id), quantity: l.quantity }));

    if (items.length === 0) {
      setError("Thêm ít nhất một sản phẩm.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/proxy/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, biko, submit }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(translateMessage(data.message ?? "M0001"));
        return;
      }
      const id = data.data?.order?.id;
      router.push(id ? `/orders/${id}` : "/orders");
      router.refresh();
    } catch {
      setError("Không tạo được đơn hàng.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <PageHeader
        title="Tạo Đơn Hàng"
        subtitle="VN Branch — chọn sản phẩm và số lượng"
        actions={
          <Link href="/orders">
            <Button variant="secondary" size="sm">
              ← Danh sách
            </Button>
          </Link>
        }
      />

      {error && <Card className="p-4 text-sm text-danger">{error}</Card>}

      <Card className="p-6 space-y-4">
        <p className="text-sm font-medium text-text-primary">Chi tiết đơn</p>
        {lines.map((line, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <Select
              label="Sản phẩm"
              value={line.product_id}
              onChange={(e) =>
                updateLine(index, { product_id: e.target.value ? Number(e.target.value) : "" })
              }
              options={products.map((p) => ({
                value: p.id,
                label: `${p.product_cd ?? p.id} — ${p.product_name}`,
              }))}
              placeholder="Chọn SP"
            />
            <Input
              label="Số lượng"
              type="number"
              min={1}
              value={line.quantity}
              onChange={(e) => updateLine(index, { quantity: Number(e.target.value) || 1 })}
            />
            {lines.length > 1 && (
              <Button variant="ghost" size="sm" onClick={() => setLines((prev) => prev.filter((_, i) => i !== index))}>
                Xóa dòng
              </Button>
            )}
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addLine}>
          + Thêm dòng
        </Button>

        <Input label="Ghi chú" value={biko} onChange={(e) => setBiko(e.target.value)} />

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={() => save(false)} disabled={saving}>
            Lưu nháp
          </Button>
          <Button onClick={() => save(true)} disabled={saving}>
            {saving ? "Đang lưu..." : "Gửi đơn"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
