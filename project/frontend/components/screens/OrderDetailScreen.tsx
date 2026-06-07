"use client";

import { Badge, Button, Card, PageHeader, Table, Td, Th, Thead, Tr } from "@/components/ui";
import { translateMessage } from "@/lib/messages";
import type { OrderItem } from "@/types/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const statusMap: Record<string, { label: string; variant: "gray" | "primary" | "warning" | "success" | "danger" }> = {
  DRAFT: { label: "Nháp", variant: "gray" },
  PENDING: { label: "Chờ xác nhận", variant: "warning" },
  CONFIRMED: { label: "Đã xác nhận", variant: "primary" },
  CANCELLED: { label: "Hủy", variant: "danger" },
};

export function OrderDetailScreen({ orderId }: { orderId: number }) {
  const router = useRouter();
  const [order, setOrder] = useState<OrderItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [acting, setActing] = useState(false);

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

  useEffect(() => {
    load();
  }, [orderId]);

  async function action(path: string) {
    setActing(true);
    setError("");
    try {
      const res = await fetch(path, { method: "PUT" });
      const data = await res.json();
      if (!data.success) {
        setError(translateMessage(data.message ?? "M0001"));
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
    </div>
  );
}
