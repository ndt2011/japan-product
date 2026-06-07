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
import { useIsAdmin } from "@/hooks/usePermission";
import { translateMessage } from "@/lib/messages";
import type { InvoiceItem } from "@/types/api";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const statusMap: Record<string, { label: string; variant: "gray" | "primary" | "warning" | "success" | "danger" }> = {
  draft: { label: "Nháp", variant: "gray" },
  sent: { label: "Đã gửi", variant: "warning" },
  paid: { label: "Đã thanh toán", variant: "success" },
  overdue: { label: "Quá hạn", variant: "danger" },
  cancelled: { label: "Hủy", variant: "gray" },
};

function formatVnd(value: string | number) {
  return `${Number(value).toLocaleString("vi-VN")} ₫`;
}

export function InvoicesScreen() {
  const isAdmin = useIsAdmin();
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/proxy/invoices?${params}`);
      const data = await res.json();
      if (data.success && data.data?.items) {
        setInvoices(data.data.items);
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
    const timer = setTimeout(loadInvoices, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [loadInvoices, search]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Hóa Đơn"
        subtitle={loading ? "Đang tải..." : `${invoices.length} hóa đơn`}
        actions={
          isAdmin ? (
            <Link href="/debts">
              <Button variant="secondary" size="sm">
                Công nợ
              </Button>
            </Link>
          ) : undefined
        }
      />

      {error && <Card className="p-4 text-sm text-danger">{translateMessage(error)}</Card>}

      <Card className="p-4 flex flex-wrap gap-3 items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Tìm mã HĐ, đơn hàng, công ty..."
          className="max-w-xs"
        />
        <select
          className="border border-border rounded-lg px-3 py-2 text-sm bg-surface"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Tất cả trạng thái</option>
          {Object.entries(statusMap).map(([key, s]) => (
            <option key={key} value={key}>
              {s.label}
            </option>
          ))}
        </select>
      </Card>

      <Card>
        <Table>
          <Thead>
            <Tr>
              <Th>Mã HĐ</Th>
              <Th>Đơn hàng</Th>
              {isAdmin && <Th>Công ty</Th>}
              <Th>Ngày lập</Th>
              <Th>Hạn TT</Th>
              <Th className="text-right">Tổng tiền</Th>
              <Th>Trạng thái</Th>
              <Th />
            </Tr>
          </Thead>
          <tbody>
            {loading ? (
              <Tr>
                <Td colSpan={isAdmin ? 8 : 7} className="text-center text-text-muted py-8">
                  Đang tải...
                </Td>
              </Tr>
            ) : invoices.length === 0 ? (
              <Tr>
                <Td colSpan={isAdmin ? 8 : 7} className="text-center text-text-muted py-8">
                  Chưa có hóa đơn
                </Td>
              </Tr>
            ) : (
              invoices.map((inv) => {
                const s = statusMap[inv.status] ?? { label: inv.status, variant: "gray" as const };
                return (
                  <Tr key={inv.id}>
                    <Td className="font-medium">{inv.invoice_no}</Td>
                    <Td>{inv.order_no ?? `#${inv.order_id}`}</Td>
                    {isAdmin && <Td>{inv.company_name ?? "—"}</Td>}
                    <Td>{inv.invoice_date}</Td>
                    <Td>{inv.due_date}</Td>
                    <Td className="text-right">{formatVnd(inv.total_amount)}</Td>
                    <Td>
                      <Badge variant={s.variant}>{s.label}</Badge>
                    </Td>
                    <Td>
                      <Link href={`/invoices/${inv.id}`} className="text-brand text-sm">
                        Chi tiết →
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
