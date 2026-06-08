"use client";

import { Badge, Button, Card, Input, PageHeader, Table, Td, Th, Thead, Tr } from "@/components/ui";
import { translateMessage } from "@/lib/messages";
import { toast } from "@/lib/toast";
import { useAuthStore } from "@/stores/useAuthStore";
import type { ShipmentBatchItem } from "@/types/api";
import Link from "next/link";
import { useEffect, useState } from "react";

const statusMap: Record<string, { label: string; variant: "gray" | "primary" | "warning" | "success" | "danger" }> = {
  PREPARING: { label: "Chuẩn bị", variant: "gray" },
  CUSTOMS_JP: { label: "HQ Nhật", variant: "warning" },
  IN_TRANSIT: { label: "Đang vận chuyển", variant: "primary" },
  CUSTOMS_VN: { label: "HQ Việt", variant: "warning" },
  DELIVERED: { label: "Đã giao", variant: "success" },
};

const NEXT_STATUS: Record<string, string> = {
  PREPARING: "CUSTOMS_JP",
  CUSTOMS_JP: "IN_TRANSIT",
  IN_TRANSIT: "CUSTOMS_VN",
  CUSTOMS_VN: "DELIVERED",
};

const NEXT_LABEL: Record<string, string> = {
  PREPARING: "Khai báo HQ Nhật",
  CUSTOMS_JP: "Hàng lên máy bay",
  IN_TRANSIT: "HQ Việt thông quan",
  CUSTOMS_VN: "Giao hàng thành công",
};

export function ShipmentDetailScreen({ batchId }: { batchId: number }) {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.user_type === "admin";
  const [batch, setBatch] = useState<ShipmentBatchItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [acting, setActing] = useState(false);
  const [trackingNo, setTrackingNo] = useState("");
  const [carrierName, setCarrierName] = useState("");

  async function load() {
    const res = await fetch(`/api/proxy/shipment-batches/${batchId}`);
    const data = await res.json();
    if (data.success && data.data?.batch) {
      const b = data.data.batch;
      setBatch(b);
      setTrackingNo(b.tracking_number ?? "");
      setCarrierName(b.logistics_partner ?? "");
    } else {
      setError(translateMessage(data.message ?? "M0002"));
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [batchId]);

  async function saveTracking() {
    if (!trackingNo.trim()) {
      setError("Nhập mã vận đơn.");
      return;
    }
    setActing(true);
    setError("");
    try {
      const res = await fetch(`/api/proxy/shipment-batches/${batchId}/tracking`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tracking_no: trackingNo.trim(),
          carrier_name: carrierName.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        const msg = translateMessage(data.message ?? "M0505");
        setError(msg);
        toast.error(msg);
        return;
      }
      toast.success("Đã cập nhật mã vận đơn.");
      setBatch(data.data.batch);
    } catch {
      const msg = "Cập nhật tracking thất bại.";
      setError(msg);
      toast.error(msg);
    } finally {
      setActing(false);
    }
  }

  async function advanceStatus() {
    if (!batch) return;
    const next = NEXT_STATUS[batch.status];
    if (!next) return;

    setActing(true);
    setError("");
    try {
      const res = await fetch(`/api/proxy/shipment-batches/${batchId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json();
      if (!data.success) {
        const msg = translateMessage(data.message ?? "M0505");
        setError(msg);
        toast.error(msg);
        return;
      }
      toast.success("Đã cập nhật trạng thái chuyến hàng.");
      setBatch(data.data.batch);
    } catch {
      const msg = "Cập nhật trạng thái thất bại.";
      setError(msg);
      toast.error(msg);
    } finally {
      setActing(false);
    }
  }

  if (loading) {
    return <Card className="p-8 text-center text-text-muted">Đang tải...</Card>;
  }

  if (!batch) {
    return (
      <Card className="p-8 text-center">
        <p className="text-danger">{error || "Không tìm thấy chuyến"}</p>
        <Link href="/shipments" className="text-brand text-sm mt-4 inline-block">
          ← Danh sách
        </Link>
      </Card>
    );
  }

  const s = statusMap[batch.status] ?? { label: batch.status, variant: "gray" as const };
  const nextStatus = NEXT_STATUS[batch.status];

  return (
    <div className="space-y-4 max-w-4xl">
      <PageHeader
        title={batch.batch_no}
        subtitle={batch.batch_name}
        actions={
          isAdmin && nextStatus ? (
            <Button onClick={advanceStatus} disabled={acting}>
              {acting ? "..." : NEXT_LABEL[batch.status]}
            </Button>
          ) : undefined
        }
      />

      {error && <Card className="p-3 text-danger text-sm">{error}</Card>}

      <Card className="p-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-text-muted">Trạng thái</p>
          <Badge variant={s.variant} className="mt-1">
            {s.label}
          </Badge>
        </div>
        <div>
          <p className="text-text-muted">Logistics</p>
          <p>{batch.logistics_partner ?? "—"}</p>
        </div>
        <div>
          <p className="text-text-muted">Tracking</p>
          <p className="font-mono">{batch.tracking_number ?? "—"}</p>
        </div>
        <div>
          <p className="text-text-muted">Ngày xuất dự kiến</p>
          <p>{batch.estimated_departure_date ?? "—"}</p>
        </div>
        <div>
          <p className="text-text-muted">Tạo bởi</p>
          <p>{batch.created_admin_name ?? "—"}</p>
        </div>
      </Card>

      {isAdmin && (
        <Card className="p-4 space-y-3">
          <h3 className="text-sm font-medium">Cập nhật vận đơn</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="Mã tracking *"
              required
              value={trackingNo}
              onChange={(e) => setTrackingNo(e.target.value)}
            />
            <Input
              label="Đơn vị vận chuyển"
              value={carrierName}
              onChange={(e) => setCarrierName(e.target.value)}
            />
          </div>
          <Button onClick={saveTracking} disabled={acting}>
            {acting ? "..." : "Lưu tracking → SHIPPING"}
          </Button>
        </Card>
      )}

      <Card>
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-medium">Đơn trong chuyến ({batch.orders?.length ?? 0})</h3>
        </div>
        <Table>
          <Thead>
            <Tr>
              <Th>Mã đơn</Th>
              <Th>Công ty</Th>
              <Th>Trạng thái</Th>
              <Th>Tổng VND</Th>
            </Tr>
          </Thead>
          <tbody>
            {(batch.orders ?? []).map((order) => (
              <Tr key={order.id}>
                <Td>
                  <Link href={`/orders/${order.id}`} className="text-brand font-mono text-sm">
                    {order.order_no}
                  </Link>
                </Td>
                <Td>{order.company_name}</Td>
                <Td>{order.status}</Td>
                <Td>{Number(order.total_vnd ?? 0).toLocaleString("vi-VN")} ₫</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Link href="/shipments" className="text-brand text-sm">
        ← Danh sách chuyến
      </Link>
    </div>
  );
}
