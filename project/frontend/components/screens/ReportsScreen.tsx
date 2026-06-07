"use client";

import { Badge, Card, EmptyState, PageHeader, Table, Td, Th, Thead, Tr } from "@/components/ui";
import { useIsAdmin } from "@/hooks/usePermission";
import { useCallback, useEffect, useState } from "react";

type ReportTab = "orders" | "inventory" | "movements" | "revenue";

export function ReportsScreen() {
  const isAdmin = useIsAdmin();
  const [tab, setTab] = useState<ReportTab>("orders");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<Record<string, unknown>>({});
  const [items, setItems] = useState<Record<string, unknown>[]>([]);

  const tabs: { id: ReportTab; label: string; adminOnly?: boolean }[] = [
    { id: "orders", label: "Đơn hàng" },
    { id: "inventory", label: "Tồn kho", adminOnly: true },
    { id: "movements", label: "Xuất nhập", adminOnly: true },
    { id: "revenue", label: "Doanh thu", adminOnly: true },
  ];

  const visibleTabs = tabs.filter((t) => !t.adminOnly || isAdmin);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError("");

    const paths: Record<ReportTab, string> = {
      orders: "/api/proxy/reports/orders",
      inventory: "/api/proxy/reports/inventory",
      movements: "/api/proxy/reports/stock-movements",
      revenue: "/api/proxy/reports/revenue?period=monthly",
    };

    try {
      const res = await fetch(paths[tab]);
      const data = await res.json();
      if (!data.success) {
        setError(data.message ?? "Không tải được báo cáo");
        setItems([]);
        return;
      }
      setSummary(data.data?.summary ?? {});
      setItems(data.data?.items ?? []);
    } catch {
      setError("API_OFFLINE");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  return (
    <div className="space-y-4">
      <PageHeader title="Báo Cáo" subtitle="Theo amendment reports-module.md" />

      <div className="flex flex-wrap gap-2">
        {visibleTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm border transition ${
              tab === t.id ? "border-brand bg-brand-light text-brand" : "border-border text-text-body"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {Object.keys(summary).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(summary).map(([key, value]) => (
            <Card key={key} className="p-4">
              <p className="text-xs text-text-muted">{key}</p>
              <p className="text-lg font-medium mt-1">
                {typeof value === "object" ? JSON.stringify(value) : String(value)}
              </p>
            </Card>
          ))}
        </div>
      )}

      <Card>
        {loading ? (
          <EmptyState message="Đang tải báo cáo..." icon="⏳" />
        ) : error ? (
          <EmptyState message={error} icon="⚠️" />
        ) : items.length === 0 ? (
          <EmptyState message="Không có dữ liệu trong khoảng thời gian này." />
        ) : tab === "orders" ? (
          <Table>
            <Thead>
              <tr>
                <Th>Mã đơn</Th>
                <Th>Công ty</Th>
                <Th>Trạng thái</Th>
                <Th>Số dòng</Th>
                <Th>Tổng VND</Th>
              </tr>
            </Thead>
            <tbody>
              {items.map((row, i) => (
                <Tr key={i}>
                  <Td>{String(row.order_no ?? "—")}</Td>
                  <Td>{String(row.company_name ?? "—")}</Td>
                  <Td>
                    <Badge variant="primary">{String(row.status ?? "—")}</Badge>
                  </Td>
                  <Td>{String(row.items_count ?? "—")}</Td>
                  <Td>{Number(row.total_value_vnd ?? 0).toLocaleString("vi-VN")}đ</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        ) : tab === "inventory" ? (
          <Table>
            <Thead>
              <tr>
                <Th>Mã SP</Th>
                <Th>Tên</Th>
                <Th>Kho</Th>
                <Th>Tồn</Th>
                <Th>Khả dụng</Th>
              </tr>
            </Thead>
            <tbody>
              {items.map((row, i) => (
                <Tr key={i}>
                  <Td>{String(row.product_cd ?? "—")}</Td>
                  <Td>{String(row.product_name ?? "—")}</Td>
                  <Td>{String(row.warehouse_name ?? "—")}</Td>
                  <Td>{String(row.quantity ?? "—")}</Td>
                  <Td className={Number(row.available_qty) < 10 ? "text-danger font-medium" : ""}>
                    {String(row.available_qty ?? "—")}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        ) : tab === "revenue" ? (
          <Table>
            <Thead>
              <tr>
                <Th>Kỳ</Th>
                <Th>Số đơn</Th>
                <Th>Giá trị VND</Th>
                <Th>Đã giao</Th>
              </tr>
            </Thead>
            <tbody>
              {items.map((row, i) => (
                <Tr key={i}>
                  <Td>{String(row.period_label ?? "—")}</Td>
                  <Td>{String(row.orders_count ?? "—")}</Td>
                  <Td>{Number(row.total_value_vnd ?? 0).toLocaleString("vi-VN")}đ</Td>
                  <Td>{String(row.delivered_count ?? "—")}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>Loại</Th>
                <Th>SP</Th>
                <Th>Kho</Th>
                <Th>SL</Th>
                <Th>Lý do</Th>
              </tr>
            </Thead>
            <tbody>
              {items.map((row, i) => (
                <Tr key={i}>
                  <Td>{String((row as { movement_type?: string }).movement_type ?? "—")}</Td>
                  <Td>{String((row as { product_name?: string }).product_name ?? "—")}</Td>
                  <Td>{String((row as { warehouse_name?: string }).warehouse_name ?? "—")}</Td>
                  <Td>{String((row as { quantity?: number }).quantity ?? "—")}</Td>
                  <Td className="text-xs">{String((row as { reason?: string }).reason ?? "—")}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
