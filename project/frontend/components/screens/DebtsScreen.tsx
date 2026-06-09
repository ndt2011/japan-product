"use client";

import {
  Badge,
  Button,
  Card,
  DetailField,
  DetailGrid,
  EmptyState,
  IconButton,
  Modal,
  ModalFooter,
  PageHeader,
  SearchInput,
  Table,
  Td,
  Th,
  Thead,
  Tr,
} from "@/components/ui";
import { Eye, Wallet } from "lucide-react";
import { useIsAdmin } from "@/hooks/usePermission";
import { translateMessage } from "@/lib/messages";
import { toast } from "@/lib/toast";
import type { DebtSummaryData } from "@/types/api";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

function formatVnd(value: number | string) {
  return `${Number(value).toLocaleString("vi-VN")} ₫`;
}

type DebtRow = DebtSummaryData["items"][number];

const statusMap: Record<string, { label: string; variant: "success" | "warning" | "danger" }> = {
  overdue: { label: "Quá hạn", variant: "danger" },
  sent: { label: "Chờ TT", variant: "warning" },
  paid: { label: "Đã TT", variant: "success" },
};

export function DebtsScreen() {
  const isAdmin = useIsAdmin();
  const [summary, setSummary] = useState<DebtSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [payOpen, setPayOpen] = useState(false);
  const [selected, setSelected] = useState<DebtRow | null>(null);
  const [paying, setPaying] = useState(false);

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

  const pendingVnd = useMemo(() => {
    if (!summary) return 0;
    return Math.max(0, summary.total_unpaid_vnd - summary.total_overdue_vnd);
  }, [summary]);

  const pieData = useMemo(() => {
    if (!summary) return [];
    return [
      { name: "Chưa đến hạn", value: pendingVnd, color: "#D97706" },
      { name: "Quá hạn", value: summary.total_overdue_vnd, color: "#DC2626" },
    ].filter((d) => d.value > 0);
  }, [summary, pendingVnd]);

  const filtered = useMemo(() => {
    const items = summary?.items ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (row) =>
        row.invoice_no.toLowerCase().includes(q) ||
        (row.company_name ?? "").toLowerCase().includes(q),
    );
  }, [summary, search]);

  async function handlePay() {
    if (!selected) return;
    setPaying(true);
    try {
      const res = await fetch(`/api/proxy/invoices/${selected.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_method: "bank_transfer" }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(translateMessage(data.message ?? "M0001"));
        return;
      }
      toast.success("Đã ghi nhận thanh toán hóa đơn.");
      setPayOpen(false);
      setSelected(null);
      await load();
    } catch {
      toast.error("Không thể ghi nhận thanh toán.");
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Theo Dõi Công Nợ"
        subtitle="Quản lý thanh toán và công nợ đại lý"
        actions={
          <>
            <Button size="sm" variant="secondary" disabled>
              📤 Xuất Báo Cáo
            </Button>
            <Link href="/invoices">
              <Button size="sm" variant="outline">
                Tất cả hóa đơn
              </Button>
            </Link>
          </>
        }
      />

      {error && <Card className="p-4 text-sm text-danger">{translateMessage(error)}</Card>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Tổng Chưa Thu", value: formatVnd(summary?.total_unpaid_vnd ?? 0), color: "text-text-primary" },
          { label: "Chưa Đến Hạn", value: formatVnd(pendingVnd), color: "text-warning" },
          { label: "Quá Hạn", value: formatVnd(summary?.total_overdue_vnd ?? 0), color: "text-danger" },
          {
            label: "Hóa Đơn Mở",
            value: loading ? "..." : `${summary?.invoice_count ?? 0} (${summary?.overdue_count ?? 0} QH)`,
            color: "text-brand",
          },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-text-muted">{s.label}</p>
            <p className={`text-lg mt-1 font-semibold ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {!loading && pieData.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Card className="p-5 xl:col-span-2">
            <h3 className="text-sm font-medium text-text-primary mb-2">Danh sách công nợ</h3>
            <p className="text-xs text-text-muted">
              {summary?.invoice_count ?? 0} hóa đơn chưa thanh toán — dùng tìm kiếm hoặc nút Thu nợ bên dưới.
            </p>
          </Card>
          <Card className="p-5">
            <h3 className="text-sm font-medium text-text-primary mb-4">Phân Bổ Công Nợ</h3>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => [formatVnd(Number(v ?? 0)), ""]}
                  contentStyle={{ borderRadius: 12, fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {pieData.map((p) => (
                <div key={p.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                    <span className="text-text-body">{p.name}</span>
                  </div>
                  <span className="text-text-primary font-medium">{formatVnd(p.value)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      <Card>
        <div className="p-4 border-b border-surface-subtle">
          <SearchInput
            placeholder="Tìm mã HĐ, công ty..."
            value={search}
            onChange={setSearch}
            className="max-w-sm"
          />
        </div>
        {loading ? (
          <EmptyState message="Đang tải..." icon="⏳" />
        ) : filtered.length === 0 ? (
          <EmptyState message="Không có công nợ đang mở." icon="💰" />
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>Mã HĐ</Th>
                <Th>Công ty</Th>
                <Th>Hạn TT</Th>
                <Th className="text-right">Số tiền</Th>
                <Th>Trạng thái</Th>
                <Th>Thao tác</Th>
              </tr>
            </Thead>
            <tbody>
              {filtered.map((row) => {
                const s = statusMap[row.status] ?? { label: row.status, variant: "warning" as const };
                return (
                  <Tr key={row.id}>
                    <Td>
                      <span className="text-brand text-xs font-medium">{row.invoice_no}</span>
                    </Td>
                    <Td className="text-xs">{row.company_name ?? "—"}</Td>
                    <Td className="text-xs text-text-muted">
                      {row.due_date}
                      {row.days_overdue > 0 && (
                        <span className="text-danger ml-1">(+{row.days_overdue} ngày)</span>
                      )}
                    </Td>
                    <Td className="text-right text-xs font-medium">{formatVnd(row.total_amount)}</Td>
                    <Td>
                      <Badge variant={s.variant}>{s.label}</Badge>
                    </Td>
                    <Td>
                      <div className="flex gap-1">
                        {isAdmin && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelected(row);
                              setPayOpen(true);
                            }}
                          >
                            Thu nợ
                          </Button>
                        )}
                        <Link href={`/invoices/${row.id}`} title="Chi tiết">
                          <IconButton variant="primary">
                            <Eye className="w-3.5 h-3.5" />
                          </IconButton>
                        </Link>
                      </div>
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        )}
        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-surface-subtle">
            <span className="text-xs text-text-muted">
              Hiển thị {filtered.length} / {summary?.items.length ?? 0} hóa đơn
            </span>
          </div>
        )}
      </Card>

      <Modal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        title="Ghi Nhận Thanh Toán"
        headerIcon={<Wallet className="w-4 h-4" />}
        size="sm"
        footer={
          <ModalFooter>
            <Button variant="secondary" type="button" onClick={() => setPayOpen(false)} disabled={paying}>
              Hủy
            </Button>
            <Button type="button" onClick={handlePay} disabled={paying}>
              {paying ? "Đang xử lý..." : "Xác Nhận Thu"}
            </Button>
          </ModalFooter>
        }
      >
        {selected && (
          <div className="space-y-4">
            <DetailGrid>
              <DetailField label="Hóa đơn">{selected.invoice_no}</DetailField>
              <DetailField label="Công ty">{selected.company_name ?? "—"}</DetailField>
              <DetailField label="Số tiền" span={2}>
                <span className="text-danger font-medium">{formatVnd(selected.total_amount)}</span>
              </DetailField>
            </DetailGrid>
            <p className="text-xs text-text-muted">
              Ghi nhận thanh toán chuyển khoản cho toàn bộ hóa đơn (giống thao tác tại chi tiết HĐ).
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
