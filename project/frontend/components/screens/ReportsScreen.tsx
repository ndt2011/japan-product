"use client";

import { Badge, Card, EmptyState, Input, PageHeader, Table, Td, Th, Thead, Tr } from "@/components/ui";
import { useIsAdmin } from "@/hooks/usePermission";
import type { ProfitReportOrderRow, ProfitReportProductRow, ProfitReportSummary } from "@/types/api";
import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ReportTab = "orders" | "inventory" | "movements" | "revenue" | "profit";

const profitLabels: Record<string, string> = {
  total_revenue_vnd: "Doanh thu",
  total_cost_vnd: "Giá vốn",
  gross_profit_vnd: "Lãi gộp",
  total_other_costs_vnd: "Chi phí khác",
  net_profit_vnd: "Lãi ròng",
  profit_margin_pct: "Biên lợi nhuận (%)",
  order_count: "Số đơn hoàn tất",
};

export function ReportsScreen() {
  const isAdmin = useIsAdmin();
  const [tab, setTab] = useState<ReportTab>("orders");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<Record<string, unknown>>({});
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [profitSummary, setProfitSummary] = useState<ProfitReportSummary | null>(null);
  const [profitOrders, setProfitOrders] = useState<ProfitReportOrderRow[]>([]);
  const [profitProducts, setProfitProducts] = useState<ProfitReportProductRow[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const tabs: { id: ReportTab; label: string; adminOnly?: boolean }[] = [
    { id: "orders", label: "Đơn hàng" },
    { id: "inventory", label: "Tồn kho", adminOnly: true },
    { id: "movements", label: "Xuất nhập", adminOnly: true },
    { id: "revenue", label: "Doanh thu", adminOnly: true },
    { id: "profit", label: "Lợi nhuận", adminOnly: true },
  ];

  const visibleTabs = tabs.filter((t) => !t.adminOnly || isAdmin);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError("");
    setProfitSummary(null);
    setProfitOrders([]);
    setProfitProducts([]);

    const paths: Record<Exclude<ReportTab, "profit">, string> = {
      orders: "/api/proxy/reports/orders",
      inventory: "/api/proxy/reports/inventory",
      movements: "/api/proxy/reports/stock-movements",
      revenue: "/api/proxy/reports/revenue?period=monthly",
    };

    try {
      if (tab === "profit") {
        const params = new URLSearchParams();
        if (dateFrom) params.set("date_from", dateFrom);
        if (dateTo) params.set("date_to", dateTo);
        const qs = params.toString();
        const profitUrl = qs ? `/api/proxy/reports/profit?${qs}` : "/api/proxy/reports/profit";
        const byProductUrl = qs
          ? `/api/proxy/reports/profit/by-product?${qs}&limit=10`
          : "/api/proxy/reports/profit/by-product?limit=10";
        const [profitRes, byProductRes] = await Promise.all([
          fetch(profitUrl),
          fetch(byProductUrl),
        ]);
        const data = await profitRes.json();
        const productData = await byProductRes.json();
        if (!data.success) {
          setError(data.message ?? "Không tải được báo cáo lợi nhuận");
          setItems([]);
          return;
        }
        setProfitSummary(data.data?.summary ?? null);
        setProfitOrders(data.data?.by_order ?? []);
        setProfitProducts(productData.success ? (productData.data?.items ?? []) : []);
        setSummary({});
        setItems([]);
        return;
      }

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
  }, [tab, dateFrom, dateTo]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  return (
    <div className="space-y-4">
      <PageHeader title="Báo Cáo" subtitle="Đơn hàng · Tồn kho · Doanh thu · Lợi nhuận (Admin)" />

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

      {tab === "profit" && isAdmin && (
        <Card className="p-4 flex flex-wrap gap-3 items-end">
          <Input
            label="Từ ngày"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <Input
            label="Đến ngày"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
          <button
            type="button"
            onClick={loadReport}
            className="px-4 py-2 rounded-xl text-sm bg-brand text-white"
          >
            Lọc
          </button>
        </Card>
      )}

      {tab === "profit" && profitOrders.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-medium mb-4">Lãi ròng theo đơn hàng</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={profitOrders.slice(0, 8).map((o) => ({
                  name: o.order_no.slice(0, 14),
                  net_profit: o.net_profit_vnd,
                }))}
                margin={{ top: 8, right: 8, left: 8, bottom: 32 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={40} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${Math.round(Number(v) / 1_000_000)}M`} />
                <Tooltip
                  formatter={(value) => [
                    `${Number(value ?? 0).toLocaleString("vi-VN")} ₫`,
                    "Lãi ròng",
                  ]}
                />
                <Bar dataKey="net_profit" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {tab === "profit" && profitProducts.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-medium mb-4">Top sản phẩm theo lãi ròng</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={profitProducts.map((p) => ({
                  name: (p.product_name_vi || p.product_name || p.product_cd).slice(0, 18),
                  net_profit: p.net_profit_vnd,
                }))}
                margin={{ top: 8, right: 8, left: 8, bottom: 48 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={56} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${Math.round(v / 1_000_000)}M`} />
                <Tooltip
                  formatter={(value) => [
                    `${Number(value ?? 0).toLocaleString("vi-VN")} ₫`,
                    "Lãi ròng",
                  ]}
                />
                <Bar dataKey="net_profit" fill="var(--brand)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {tab === "profit" && profitSummary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(profitSummary).map(([key, value]) => (
            <Card key={key} className="p-4">
              <p className="text-xs text-text-muted">{profitLabels[key] ?? key}</p>
              <p className={`text-lg font-medium mt-1 ${key.includes("profit") ? "text-brand" : ""}`}>
                {key === "profit_margin_pct"
                  ? `${value}%`
                  : key === "order_count"
                    ? String(value)
                    : `${Number(value).toLocaleString("vi-VN")} ₫`}
              </p>
            </Card>
          ))}
        </div>
      )}

      {tab !== "profit" && Object.keys(summary).length > 0 && (
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
        ) : tab === "profit" ? (
          profitOrders.length === 0 && profitProducts.length === 0 ? (
            <EmptyState message="Chưa có đơn COMPLETED trong khoảng thời gian này." />
          ) : (
            <div className="space-y-6 p-4">
              {profitProducts.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-3">Lợi nhuận theo sản phẩm</h3>
                  <Table>
                    <Thead>
                      <tr>
                        <Th>Mã SP</Th>
                        <Th>Tên</Th>
                        <Th>SL bán</Th>
                        <Th>Doanh thu</Th>
                        <Th>Lãi ròng</Th>
                      </tr>
                    </Thead>
                    <tbody>
                      {profitProducts.map((row) => (
                        <Tr key={row.product_id}>
                          <Td className="font-mono text-xs">{row.product_cd}</Td>
                          <Td>{row.product_name_vi || row.product_name}</Td>
                          <Td>{row.quantity_sold}</Td>
                          <Td>{row.revenue_vnd.toLocaleString("vi-VN")} ₫</Td>
                          <Td className="text-brand font-medium">
                            {row.net_profit_vnd.toLocaleString("vi-VN")} ₫
                          </Td>
                        </Tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
              {profitOrders.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-3">Lợi nhuận theo đơn hàng</h3>
                  <Table>
                    <Thead>
                      <tr>
                        <Th>Mã đơn</Th>
                        <Th>Hoàn tất</Th>
                        <Th>Doanh thu</Th>
                        <Th>Giá vốn</Th>
                        <Th>Lãi gộp</Th>
                        <Th>CP khác</Th>
                        <Th>Lãi ròng</Th>
                      </tr>
                    </Thead>
                    <tbody>
                      {profitOrders.map((row) => (
                        <Tr key={row.order_id}>
                          <Td className="font-medium">{row.order_no}</Td>
                          <Td>{row.completed_at ?? "—"}</Td>
                          <Td>{row.revenue_vnd.toLocaleString("vi-VN")} ₫</Td>
                          <Td>{row.cost_vnd.toLocaleString("vi-VN")} ₫</Td>
                          <Td>{row.gross_profit_vnd.toLocaleString("vi-VN")} ₫</Td>
                          <Td>{row.other_costs_vnd.toLocaleString("vi-VN")} ₫</Td>
                          <Td className="text-brand font-medium">
                            {row.net_profit_vnd.toLocaleString("vi-VN")} ₫
                          </Td>
                        </Tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </div>
          )
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
