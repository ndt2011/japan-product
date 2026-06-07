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
import type { OrderItem } from "@/types/api";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const statusMap: Record<string, { label: string; variant: "gray" | "primary" | "warning" | "success" | "danger" }> = {
  DRAFT: { label: "Nháp", variant: "gray" },
  PENDING: { label: "Chờ xác nhận", variant: "warning" },
  CONFIRMED: { label: "Đã xác nhận", variant: "primary" },
  PROCESSING: { label: "Đang xử lý", variant: "warning" },
  SHIPPED: { label: "Đang giao", variant: "primary" },
  DELIVERED: { label: "Đã giao", variant: "success" },
  CANCELLED: { label: "Hủy", variant: "danger" },
};

export function OrdersScreen() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/proxy/orders?${params}`);
      const data = await res.json();
      if (data.success && data.data?.items) {
        setOrders(data.data.items);
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
    const timer = setTimeout(loadOrders, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [loadOrders, search]);

  const counts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <PageHeader
        title="Đơn Đặt Hàng"
        subtitle={loading ? "Đang tải..." : `${orders.length} đơn hàng`}
        actions={
          <>
            <Button variant="secondary" size="sm" disabled>
              Xuất Excel
            </Button>
            <Link href="/orders/new">
              <Button size="sm">+ Tạo Đơn Hàng</Button>
            </Link>
          </>
        }
      />

      {error && <Card className="p-4 text-sm text-danger">{error}</Card>}

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {Object.entries(statusMap).map(([key, s]) => (
          <Card
            key={key}
            className={`p-3 cursor-pointer transition-colors ${statusFilter === key ? "border-brand" : "hover:border-brand/50"}`}
            onClick={() => setStatusFilter(key === statusFilter ? "" : key)}
          >
            <p className="text-xs text-text-muted">{s.label}</p>
            <p className="text-lg text-text-primary mt-0.5">{counts[key] ?? 0}</p>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <SearchInput
          placeholder="Tìm mã đơn, công ty..."
          value={search}
          onChange={setSearch}
          className="max-w-md"
        />
      </Card>

      <Card>
        <Table>
          <Thead>
            <tr>
              <Th>Mã đơn</Th>
              <Th>Công ty VN</Th>
              <Th>Ngày</Th>
              <Th>Tổng VND</Th>
              <Th>Trạng thái</Th>
              <Th>Thao tác</Th>
            </tr>
          </Thead>
          <tbody>
            {loading ? (
              <Tr>
                <Td colSpan={6} className="text-center text-text-muted py-8">
                  Đang tải...
                </Td>
              </Tr>
            ) : orders.length === 0 ? (
              <Tr>
                <Td colSpan={6} className="text-center text-text-muted py-8">
                  Chưa có đơn hàng
                </Td>
              </Tr>
            ) : (
              orders.map((o) => {
                const s = statusMap[o.status] ?? { label: o.status, variant: "gray" as const };
                return (
                  <Tr key={o.id}>
                    <Td>
                      <span className="text-brand text-xs font-medium">{o.order_no}</span>
                    </Td>
                    <Td className="text-xs">{o.company_name ?? "—"}</Td>
                    <Td className="text-xs text-text-muted">{o.order_date ?? "—"}</Td>
                    <Td className="text-xs">
                      {o.total_vnd ? `${Number(o.total_vnd).toLocaleString("vi-VN")}đ` : "—"}
                    </Td>
                    <Td>
                      <Badge variant={s.variant}>{s.label}</Badge>
                    </Td>
                    <Td>
                      <Link href={`/orders/${o.id}`}>
                        <Button variant="ghost" size="sm">
                          Chi tiết
                        </Button>
                      </Link>
                    </Td>
                  </Tr>
                );
              })
            )}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
