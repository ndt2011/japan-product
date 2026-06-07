"use client";

import { Badge, Button, Card, PageHeader, Table, Td, Th, Thead, Tr } from "@/components/ui";
import { translateMessage } from "@/lib/messages";
import type { DebtSummaryData } from "@/types/api";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

function formatVnd(value: number | string) {
  return `${Number(value).toLocaleString("vi-VN")} ₫`;
}

export function DebtsScreen() {
  const [summary, setSummary] = useState<DebtSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/proxy/invoices/debt-summary");
      const data = await res.json();
      if (data.success && data.data) {
        setSummary(data.data);
      } else {
        setError(translateMessage(data.message ?? "M0001"));
      }
    } catch {
      setError("API_OFFLINE");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Theo Dõi Công Nợ"
        subtitle="Hóa đơn chưa thanh toán và quá hạn"
        actions={
          <Link href="/invoices">
            <Button size="sm" variant="secondary">
              Tất cả hóa đơn
            </Button>
          </Link>
        }
      />

      {error && <Card className="p-4 text-sm text-danger">{translateMessage(error)}</Card>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs text-text-muted">Tổng chưa thu</p>
          <p className="text-xl font-semibold mt-1">
            {loading ? "..." : formatVnd(summary?.total_unpaid_vnd ?? 0)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-text-muted">Quá hạn</p>
          <p className="text-xl font-semibold mt-1 text-danger">
            {loading ? "..." : formatVnd(summary?.total_overdue_vnd ?? 0)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-text-muted">Số hóa đơn mở</p>
          <p className="text-xl font-semibold mt-1">
            {loading ? "..." : `${summary?.invoice_count ?? 0} (${summary?.overdue_count ?? 0} quá hạn)`}
          </p>
        </Card>
      </div>

      <Card>
        <Table>
          <Thead>
            <Tr>
              <Th>Mã HĐ</Th>
              <Th>Công ty</Th>
              <Th>Hạn TT</Th>
              <Th className="text-right">Số tiền</Th>
              <Th>Trạng thái</Th>
              <Th />
            </Tr>
          </Thead>
          <tbody>
            {loading ? (
              <Tr>
                <Td colSpan={6} className="text-center text-text-muted py-8">
                  Đang tải...
                </Td>
              </Tr>
            ) : !summary?.items.length ? (
              <Tr>
                <Td colSpan={6} className="text-center text-text-muted py-8">
                  Không có công nợ đang mở
                </Td>
              </Tr>
            ) : (
              summary.items.map((row) => (
                <Tr key={row.id}>
                  <Td className="font-medium">{row.invoice_no}</Td>
                  <Td>{row.company_name ?? "—"}</Td>
                  <Td>
                    {row.due_date}
                    {row.days_overdue > 0 && (
                      <span className="text-danger text-xs ml-1">(+{row.days_overdue} ngày)</span>
                    )}
                  </Td>
                  <Td className="text-right">{formatVnd(row.total_amount)}</Td>
                  <Td>
                    <Badge variant={row.status === "overdue" ? "danger" : "warning"}>
                      {row.status === "overdue" ? "Quá hạn" : "Chờ TT"}
                    </Badge>
                  </Td>
                  <Td>
                    <Link href={`/invoices/${row.id}`} className="text-brand text-sm">
                      Chi tiết →
                    </Link>
                  </Td>
                </Tr>
              ))
            )}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
