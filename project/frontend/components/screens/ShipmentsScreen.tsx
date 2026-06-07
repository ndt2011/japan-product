"use client";

import {
  Badge,
  Button,
  Card,
  PageHeader,
  SearchInput,
  Table,
  Td,
  Th,
  Thead,
  Tr,
} from "@/components/ui";
import { translateMessage } from "@/lib/messages";
import { useAuthStore } from "@/stores/useAuthStore";
import type { ShipmentBatchItem } from "@/types/api";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const statusMap: Record<string, { label: string; variant: "gray" | "primary" | "warning" | "success" | "danger" }> = {
  PREPARING: { label: "Chuẩn bị", variant: "gray" },
  CUSTOMS_JP: { label: "HQ Nhật", variant: "warning" },
  IN_TRANSIT: { label: "Đang vận chuyển", variant: "primary" },
  CUSTOMS_VN: { label: "HQ Việt", variant: "warning" },
  DELIVERED: { label: "Đã giao", variant: "success" },
};

export function ShipmentsScreen() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.user_type === "admin";
  const [batches, setBatches] = useState<ShipmentBatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const loadBatches = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/proxy/shipment-batches?${params}`);
      const data = await res.json();
      if (data.success && data.data?.items) {
        setBatches(data.data.items);
      } else {
        setError(translateMessage(data.message ?? "M0001"));
      }
    } catch {
      setError("API_OFFLINE");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(loadBatches, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [loadBatches, search]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Chuyến Hàng"
        subtitle="Gom đơn CONFIRMED và theo dõi vận chuyển JP → VN"
        actions={
          isAdmin ? (
            <Link href="/shipments/new">
              <Button>+ Tạo chuyến</Button>
            </Link>
          ) : undefined
        }
      />

      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Tìm mã chuyến, tên, tracking..."
            className="max-w-xs"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(statusMap).map(([key, val]) => (
              <option key={key} value={key}>
                {val.label}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {error && (
        <Card className="p-4 border-danger/30 bg-danger/5 text-danger text-sm">{error}</Card>
      )}

      <Card>
        {loading ? (
          <p className="p-8 text-center text-text-muted">Đang tải...</p>
        ) : batches.length === 0 ? (
          <p className="p-8 text-center text-text-muted">Chưa có chuyến hàng nào.</p>
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Mã chuyến</Th>
                <Th>Tên chuyến</Th>
                <Th>Trạng thái</Th>
                <Th>Số đơn</Th>
                <Th>Logistics</Th>
                <Th>Ngày xuất dự kiến</Th>
                <Th />
              </Tr>
            </Thead>
            <tbody>
              {batches.map((batch) => {
                const s = statusMap[batch.status] ?? { label: batch.status, variant: "gray" as const };
                return (
                  <Tr key={batch.id}>
                    <Td className="font-mono text-sm">{batch.batch_no}</Td>
                    <Td>{batch.batch_name}</Td>
                    <Td>
                      <Badge variant={s.variant}>{s.label}</Badge>
                    </Td>
                    <Td>{batch.orders_count ?? batch.orders?.length ?? 0}</Td>
                    <Td>{batch.logistics_partner ?? "—"}</Td>
                    <Td>{batch.estimated_departure_date ?? "—"}</Td>
                    <Td>
                      <Link href={`/shipments/${batch.id}`} className="text-brand text-sm">
                        Chi tiết →
                      </Link>
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
