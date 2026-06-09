"use client";

import {
  Badge,
  Button,
  Card,
  EmptyState,
  IconButton,
  PageHeader,
  SearchInput,
  Table,
  Td,
  Th,
  Thead,
  Tr,
} from "@/components/ui";
import { Eye } from "lucide-react";
import { translateMessage } from "@/lib/messages";
import { useAuthStore } from "@/stores/useAuthStore";
import type { ShipmentBatchItem } from "@/types/api";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

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

  const counts = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const b of batches) {
      acc[b.status] = (acc[b.status] ?? 0) + 1;
    }
    return acc;
  }, [batches]);

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

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {Object.entries(statusMap).map(([key, val]) => (
          <Card
            key={key}
            className={`p-3 cursor-pointer transition-colors ${statusFilter === key ? "ring-2 ring-brand" : "hover:border-brand/40"}`}
            onClick={() => setStatusFilter(key === statusFilter ? "" : key)}
          >
            <p className="text-xs text-text-muted">{val.label}</p>
            <p className="text-lg font-semibold mt-0.5">{loading ? "—" : counts[key] ?? 0}</p>
          </Card>
        ))}
      </div>

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
          <EmptyState message="Đang tải..." icon="⏳" />
        ) : batches.length === 0 ? (
          <EmptyState message="Chưa có chuyến hàng nào." icon="🚢" />
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>Mã chuyến</Th>
                <Th>Tên chuyến</Th>
                <Th>Trạng thái</Th>
                <Th>Số đơn</Th>
                <Th>Logistics</Th>
                <Th>Ngày xuất dự kiến</Th>
                <Th>Thao tác</Th>
              </tr>
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
                      <Link href={`/shipments/${batch.id}`} title="Chi tiết">
                        <IconButton variant="primary">
                          <Eye className="w-3.5 h-3.5" />
                        </IconButton>
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
