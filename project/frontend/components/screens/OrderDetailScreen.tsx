"use client";

import {
  Badge,
  Button,
  Card,
  Input,
  PageHeader,
  Select,
  Table,
  Td,
  Th,
  Thead,
  Tr,
} from "@/components/ui";
import { useIsAdmin, useIsCompany } from "@/hooks/usePermission";
import { translateMessage } from "@/lib/messages";
import { useAuthStore } from "@/stores/useAuthStore";
import type { OrderCostItem, OrderItem } from "@/types/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

const costTypeOptions = [
  { value: "shipping", label: "Vận chuyển" },
  { value: "customs_jp", label: "Hải quan JP" },
  { value: "customs_vn", label: "Hải quan VN" },
  { value: "handling", label: "Xử lý kho" },
  { value: "other", label: "Khác" },
];

const statusMap: Record<string, { label: string; variant: "gray" | "primary" | "warning" | "success" | "danger" }> = {
  DRAFT: { label: "Nháp", variant: "gray" },
  PENDING: { label: "Chờ xác nhận", variant: "warning" },
  CONFIRMED: { label: "Đã xác nhận", variant: "primary" },
  PROCESSING: { label: "Đang xử lý", variant: "warning" },
  SHIPPED: { label: "Đang giao", variant: "primary" },
  DELIVERED: { label: "Đã giao", variant: "success" },
  DELIVERED_ADMIN: { label: "Chờ xác nhận nhận", variant: "warning" },
  COMPLETED: { label: "Hoàn tất", variant: "success" },
  CANCELLED: { label: "Hủy", variant: "danger" },
};

const INVOICE_ELIGIBLE = ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "DELIVERED_ADMIN", "COMPLETED"];

export function OrderDetailScreen({ orderId }: { orderId: number }) {
  const isAdmin = useIsAdmin();
  const isCompany = useIsCompany();
  const userType = useAuthStore((s) => s.user?.user_type);
  const canConfirmReceipt =
    isCompany || userType === "branch_manager" || userType === "branch_staff";
  const router = useRouter();
  const [order, setOrder] = useState<OrderItem | null>(null);
  const [costs, setCosts] = useState<OrderCostItem[]>([]);
  const [costsTotal, setCostsTotal] = useState(0);
  const [costType, setCostType] = useState("shipping");
  const [costAmount, setCostAmount] = useState("");
  const [costNote, setCostNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [acting, setActing] = useState(false);

  async function loadCosts() {
    if (!isAdmin) return;
    const res = await fetch(`/api/proxy/orders/${orderId}/costs`);
    const data = await res.json();
    if (data.success && data.data) {
      setCosts(data.data.items ?? []);
      setCostsTotal(Number(data.data.total_vnd ?? 0));
    }
  }

  async function load() {
    const res = await fetch(`/api/proxy/orders/${orderId}`);
    const data = await res.json();
    if (data.success && data.data?.order) {
      setOrder(data.data.order);
    } else {
      setError(translateMessage(data.message ?? "M0002"));
    }
    setLoading(false);
  }

  async function addCost(e: FormEvent) {
    e.preventDefault();
    if (!costAmount) return;
    setActing(true);
    try {
      const res = await fetch(`/api/proxy/orders/${orderId}/costs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cost_type: costType,
          amount_vnd: Number(costAmount),
          note: costNote || null,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(translateMessage(data.message ?? "M0001"));
        return;
      }
      setCostAmount("");
      setCostNote("");
      await loadCosts();
    } catch {
      setError("Không thể thêm chi phí.");
    } finally {
      setActing(false);
    }
  }

  async function removeCost(costId: number) {
    if (!confirm("Xóa chi phí này?")) return;
    setActing(true);
    try {
      const res = await fetch(`/api/proxy/orders/${orderId}/costs/${costId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!data.success) {
        setError(translateMessage(data.message ?? "M0001"));
        return;
      }
      await loadCosts();
    } finally {
      setActing(false);
    }
  }

  useEffect(() => {
    load();
  }, [orderId]);

  useEffect(() => {
    if (isAdmin && !loading) {
      loadCosts();
    }
  }, [isAdmin, orderId, loading]);

  async function action(path: string, method = "PUT", body?: object) {
    setActing(true);
    setError("");
    try {
      const res = await fetch(path, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!data.success) {
        setError(translateMessage(data.message ?? "M0001"));
        return;
      }
      if (data.data?.invoice?.id) {
        router.push(`/invoices/${data.data.invoice.id}`);
        return;
      }
      await load();
      router.refresh();
    } catch {
      setError("Thao tác thất bại.");
    } finally {
      setActing(false);
    }
  }

  if (loading) {
    return <Card className="p-8 text-center text-text-muted">Đang tải...</Card>;
  }

  if (!order) {
    return (
      <Card className="p-8 text-center">
        <p className="text-danger">{error || "Không tìm thấy đơn"}</p>
        <Link href="/orders" className="text-brand text-sm mt-4 inline-block">
          ← Danh sách
        </Link>
      </Card>
    );
  }

  const s = statusMap[order.status] ?? { label: order.status, variant: "gray" as const };

  return (
    <div className="space-y-4 max-w-4xl">
      <PageHeader
        title={order.order_no}
        subtitle={order.company_name ?? "Chi tiết đơn hàng"}
        actions={
          <Link href="/orders">
            <Button variant="secondary" size="sm">
              ← Danh sách
            </Button>
          </Link>
        }
      />

      {error && <Card className="p-4 text-sm text-danger">{error}</Card>}

      <Card className="p-6">
        <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
          <Badge variant={s.variant}>{s.label}</Badge>
          <div className="flex gap-2 flex-wrap">
            {order.status === "DRAFT" && (
              <Button size="sm" disabled={acting} onClick={() => action(`/api/proxy/orders/${orderId}/submit`)}>
                Gửi đơn
              </Button>
            )}
            {order.status === "PENDING" && (
              <>
                <Button size="sm" disabled={acting} onClick={() => action(`/api/proxy/orders/${orderId}/confirm`)}>
                  Xác nhận (JP)
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={acting}
                  onClick={() => action(`/api/proxy/orders/${orderId}/cancel`)}
                >
                  Hủy
                </Button>
              </>
            )}
            {canConfirmReceipt && order.status === "DELIVERED_ADMIN" && (
              <Button
                size="sm"
                disabled={acting}
                onClick={() => action(`/api/proxy/orders/${orderId}/confirm-receipt`)}
              >
                Đã nhận hàng
              </Button>
            )}
            {isAdmin && INVOICE_ELIGIBLE.includes(order.status) && (
              <Button
                size="sm"
                variant="secondary"
                disabled={acting}
                onClick={() => action("/api/proxy/invoices", "POST", { order_id: orderId })}
              >
                Lập hóa đơn
              </Button>
            )}
          </div>
        </div>

        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-6">
          <div>
            <dt className="text-xs text-text-muted">Ngày đặt</dt>
            <dd>{order.order_date ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">Tổng JPY</dt>
            <dd>{order.total_jpy ? `¥${Number(order.total_jpy).toLocaleString("ja-JP")}` : "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">Tổng VND</dt>
            <dd>{order.total_vnd ? `${Number(order.total_vnd).toLocaleString("vi-VN")}đ` : "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">Tỷ giá lock</dt>
            <dd>{order.exchange_rate ?? "—"}</dd>
          </div>
        </dl>

        <Table>
          <Thead>
            <tr>
              <Th>Sản phẩm</Th>
              <Th>SL</Th>
              <Th>Giá JPY</Th>
              <Th>Thành VND</Th>
            </tr>
          </Thead>
          <tbody>
            {(order.details ?? []).map((d) => (
              <Tr key={d.id}>
                <Td className="text-xs">{d.product_name ?? d.product_cd}</Td>
                <Td className="text-xs">{d.quantity}</Td>
                <Td className="text-xs">{d.unit_price_jpy?.toLocaleString("ja-JP")}</Td>
                <Td className="text-xs">{d.subtotal_vnd ? Number(d.subtotal_vnd).toLocaleString("vi-VN") : "—"}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>

      {isAdmin && (
        <Card className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium">Chi phí thực tế (net profit)</h3>
            <span className="text-sm text-brand font-medium">
              Tổng: {costsTotal.toLocaleString("vi-VN")} ₫
            </span>
          </div>

          {costs.length > 0 && (
            <Table>
              <Thead>
                <tr>
                  <Th>Loại</Th>
                  <Th>Số tiền</Th>
                  <Th>Ghi chú</Th>
                  <Th />
                </tr>
              </Thead>
              <tbody>
                {costs.map((c) => (
                  <Tr key={c.id}>
                    <Td>{costTypeOptions.find((o) => o.value === c.cost_type)?.label ?? c.cost_type}</Td>
                    <Td>{Number(c.amount_vnd).toLocaleString("vi-VN")} ₫</Td>
                    <Td className="text-xs">{c.note ?? "—"}</Td>
                    <Td>
                      <button
                        type="button"
                        onClick={() => removeCost(c.id)}
                        className="text-xs text-danger hover:underline"
                        disabled={acting}
                      >
                        Xóa
                      </button>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}

          <form onSubmit={addCost} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <Select
              label="Loại chi phí"
              value={costType}
              onChange={(e) => setCostType(e.target.value)}
              options={costTypeOptions}
            />
            <Input
              label="Số tiền VND"
              type="number"
              min={1}
              required
              value={costAmount}
              onChange={(e) => setCostAmount(e.target.value)}
            />
            <Input
              label="Ghi chú"
              optional
              value={costNote}
              onChange={(e) => setCostNote(e.target.value)}
            />
            <Button type="submit" size="sm" disabled={acting}>
              Thêm chi phí
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
