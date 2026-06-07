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
import { useState } from "react";

const statusMap: Record<string, { label: string; variant: "gray" | "primary" | "warning" | "success" | "danger" }> = {
  Draft: { label: "Nháp", variant: "gray" },
  Confirmed: { label: "Xác nhận", variant: "primary" },
  Shipping: { label: "Đang giao", variant: "warning" },
  Delivered: { label: "Đã giao", variant: "success" },
  Cancelled: { label: "Hủy bỏ", variant: "danger" },
};

const ordersData = [
  { id: "ĐH-2026-0891", agent: "Đại Lý Miền Nam", date: "2026-06-05", items: 4, total: "124.500.000đ", status: "Shipping", payment: "Chưa TT" },
  { id: "ĐH-2026-0890", agent: "Công ty ABC VN", date: "2026-06-04", items: 2, total: "89.200.000đ", status: "Confirmed", payment: "Đã TT" },
  { id: "ĐH-2026-0889", agent: "Công ty Demo VN", date: "2026-06-03", items: 6, total: "205.800.000đ", status: "Delivered", payment: "Đã TT" },
  { id: "ĐH-2026-0888", agent: "Siêu Thị Điện Máy", date: "2026-06-02", items: 1, total: "76.400.000đ", status: "Draft", payment: "Chưa TT" },
  { id: "ĐH-2026-0887", agent: "CellphoneS", date: "2026-06-01", items: 3, total: "98.700.000đ", status: "Cancelled", payment: "Hoàn tiền" },
];

export function OrdersScreen() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = ordersData.filter((o) => {
    const matchSearch =
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.agent.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Đơn Đặt Hàng"
        subtitle={`${ordersData.length} đơn hàng · Dữ liệu demo`}
        actions={
          <>
            <Button variant="secondary" size="sm" disabled>
              📤 Xuất Excel
            </Button>
            <Button size="sm" disabled>
              + Tạo Đơn Hàng
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Object.entries(statusMap).map(([key, s]) => (
          <Card
            key={key}
            className={`p-3 cursor-pointer transition-colors ${statusFilter === key ? "border-brand" : "hover:border-brand/50"}`}
            onClick={() => setStatusFilter(key === statusFilter ? "" : key)}
          >
            <p className="text-xs text-text-muted">{s.label}</p>
            <p className="text-lg text-text-primary mt-0.5">{ordersData.filter((o) => o.status === key).length}</p>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <div className="flex gap-3 flex-wrap">
          <SearchInput placeholder="Tìm đơn hàng, đại lý..." value={search} onChange={setSearch} className="flex-1 min-w-52" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border text-sm bg-white text-text-body"
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(statusMap).map(([k, s]) => (
              <option key={k} value={k}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </Card>

      <Card>
        <Table>
          <Thead>
            <tr>
              <Th>Mã ĐH</Th>
              <Th>Đại Lý</Th>
              <Th>Ngày</Th>
              <Th>SP</Th>
              <Th>Tổng tiền</Th>
              <Th>Thanh toán</Th>
              <Th>Trạng thái</Th>
            </tr>
          </Thead>
          <tbody>
            {filtered.map((o) => (
              <Tr key={o.id}>
                <Td className="font-medium text-brand">{o.id}</Td>
                <Td>{o.agent}</Td>
                <Td className="text-text-muted">{o.date}</Td>
                <Td>{o.items}</Td>
                <Td>{o.total}</Td>
                <Td>
                  <Badge variant={o.payment === "Đã TT" ? "success" : "warning"}>{o.payment}</Badge>
                </Td>
                <Td>
                  <Badge variant={statusMap[o.status]?.variant ?? "gray"}>
                    {statusMap[o.status]?.label ?? o.status}
                  </Badge>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
