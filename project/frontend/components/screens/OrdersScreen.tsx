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
import { usePermission } from "@/hooks/usePermission";
import { translateMessage } from "@/lib/messages";
import { getOrderStatus, ORDER_STATUS_ORDER } from "@/lib/status";
import type { OrderItem } from "@/types/api";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export function OrdersScreen() {
  const canCreateOrder = usePermission("orders.create");
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "");

  useEffect(() => {
    const fromUrl = searchParams.get("status") ?? "";
    setStatusFilter(fromUrl);
  }, [searchParams]);

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
            {canCreateOrder && (
              <Link href="/orders/new">
                <Button size="sm">+ Tạo Đơn Hàng</Button>
              </Link>
            )}
          </>
        }
      />

      {error && <Card className="p-4 text-sm text-danger">{error}</Card>}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-3">
        {ORDER_STATUS_ORDER.map((key) => {
          const s = getOrderStatus(key);
          return (
            <Card
              key={key}
              className={`p-3 cursor-pointer transition-colors ${statusFilter === key ? "ring-2 ring-brand" : "hover:border-brand/50"}`}
              style={{ borderLeftWidth: 4, borderLeftColor: s.color }}
              onClick={() => setStatusFilter(key === statusFilter ? "" : key)}
            >
              <Badge variant={s.variant} className="mb-1">
                {s.label}
              </Badge>
              <p className="text-lg font-semibold text-text-primary">{counts[key] ?? 0}</p>
            </Card>
          );
        })}
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
                const s = getOrderStatus(o.status);
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
