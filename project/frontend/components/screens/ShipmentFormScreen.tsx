"use client";

import { Button, Card, Input, PageHeader } from "@/components/ui";
import {
  clearFieldError,
  hasFieldErrors,
  validateShipmentForm,
  type FieldErrors,
} from "@/lib/form-validation";
import { translateMessage } from "@/lib/messages";
import type { OrderItem } from "@/types/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function ShipmentFormScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [batchName, setBatchName] = useState("");
  const [logisticsPartner, setLogisticsPartner] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/proxy/shipment-batches/available-orders");
      const data = await res.json();
      if (data.success && data.data?.items) {
        setOrders(data.data.items);
      } else {
        setError(translateMessage(data.message ?? "M0001"));
      }
      setLoading(false);
    }
    load();
  }, []);

  function toggleOrder(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setFieldErrors((prev) => clearFieldError(prev, "order_ids"));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors = validateShipmentForm(batchName, selected.size);
    setFieldErrors(errors);
    if (hasFieldErrors(errors)) {
      setError(errors.order_ids ? translateMessage("M0503") : "Vui lòng kiểm tra các trường được đánh dấu.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/proxy/shipment-batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batch_name: batchName,
          order_ids: Array.from(selected),
          logistics_partner: logisticsPartner || undefined,
          tracking_number: trackingNumber || undefined,
          estimated_departure_date: departureDate || undefined,
        }),
      });
      const data = await res.json();
      if (data.success && data.data?.batch?.id) {
        router.push(`/shipments/${data.data.batch.id}`);
        router.refresh();
        return;
      }
      setError(translateMessage(data.message ?? "M0001"));
    } catch {
      setError("Tạo chuyến thất bại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <PageHeader title="Tạo chuyến hàng" subtitle="Chọn đơn CONFIRMED để gom vào chuyến" />

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="p-4 space-y-3">
          <Input
            label="Tên chuyến"
            required
            value={batchName}
            onChange={(e) => {
              setBatchName(e.target.value);
              setFieldErrors((prev) => clearFieldError(prev, "batch_name"));
            }}
            placeholder="VD: Chuyến tháng 6/2026"
            error={fieldErrors.batch_name}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-text-muted">Đối tác logistics</label>
              <input
                value={logisticsPartner}
                onChange={(e) => setLogisticsPartner(e.target.value)}
                className="w-full mt-1 border border-border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-text-muted">Tracking number</label>
              <input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="w-full mt-1 border border-border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-text-muted">Ngày xuất dự kiến</label>
            <input
              type="date"
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              className="w-full mt-1 border border-border rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-medium mb-3">Đơn hàng khả dụng ({selected.size} đã chọn)</h3>
          {fieldErrors.order_ids && (
            <p className="text-xs text-danger mb-2">{fieldErrors.order_ids}</p>
          )}
          {loading ? (
            <p className="text-text-muted text-sm">Đang tải...</p>
          ) : orders.length === 0 ? (
            <p className="text-text-muted text-sm">Không có đơn CONFIRMED nào chưa gom.</p>
          ) : (
            <ul className="space-y-2 max-h-80 overflow-y-auto">
              {orders.map((order) => (
                <li key={order.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface">
                  <input
                    type="checkbox"
                    checked={selected.has(order.id)}
                    onChange={() => toggleOrder(order.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono">{order.order_no}</p>
                    <p className="text-xs text-text-muted">
                      {order.company_name} · {Number(order.total_vnd ?? 0).toLocaleString("vi-VN")} ₫
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {error && <p className="text-danger text-sm">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" disabled={submitting || selected.size < 1}>
            {submitting ? "Đang tạo..." : "Tạo chuyến"}
          </Button>
          <Link href="/shipments" className="text-sm text-text-muted self-center">
            Hủy
          </Link>
        </div>
      </form>
    </div>
  );
}
