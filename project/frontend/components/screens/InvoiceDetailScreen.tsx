"use client";

import { Badge, Button, Card, PageHeader, Table, Td, Th, Thead, Tr } from "@/components/ui";
import { useIsAdmin } from "@/hooks/usePermission";
import { translateMessage } from "@/lib/messages";
import { toast } from "@/lib/toast";
import type { InvoiceItem, InvoiceLineItem } from "@/types/api";
import Link from "next/link";
import { useEffect, useState } from "react";

const statusMap: Record<string, { label: string; variant: "gray" | "primary" | "warning" | "success" | "danger" }> = {
  draft: { label: "Nháp", variant: "gray" },
  sent: { label: "Đã gửi", variant: "warning" },
  paid: { label: "Đã thanh toán", variant: "success" },
  overdue: { label: "Quá hạn", variant: "danger" },
  cancelled: { label: "Hủy", variant: "gray" },
};

function formatVnd(value: string | number | null | undefined) {
  const n = Number(value ?? 0);
  return `${(Number.isFinite(n) ? n : 0).toLocaleString("vi-VN")} ₫`;
}

function lineProductName(line: InvoiceLineItem) {
  return line.product_name_vi || line.product_name_jp || line.product_name || "—";
}

function lineAmount(line: InvoiceLineItem) {
  return line.line_total_vnd ?? line.amount ?? "0";
}

export function InvoiceDetailScreen({ invoiceId }: { invoiceId: number }) {
  const isAdmin = useIsAdmin();
  const [invoice, setInvoice] = useState<InvoiceItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [acting, setActing] = useState(false);

  async function load() {
    const res = await fetch(`/api/proxy/invoices/${invoiceId}`);
    const data = await res.json();
    if (data.success && data.data?.invoice) {
      setInvoice(data.data.invoice);
    } else {
      setError(translateMessage(data.message ?? "M0002"));
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [invoiceId]);

  async function action(path: string, method = "POST", body?: object, successMsg = "Đã cập nhật hóa đơn.") {
    setActing(true);
    setError("");
    try {
      const res = await fetch(path, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!data.success) {
        const msg = translateMessage(data.message ?? "M0001");
        setError(msg);
        toast.error(msg);
        return;
      }
      toast.success(successMsg);
      setLoading(true);
      await load();
    } catch {
      const msg = "Thao tác thất bại.";
      setError(msg);
      toast.error(msg);
    } finally {
      setActing(false);
    }
  }

  if (loading && !invoice) {
    return <Card className="p-8 text-center text-text-muted">Đang tải...</Card>;
  }

  if (!invoice) {
    return (
      <Card className="p-8 text-center">
        <p className="text-danger">{error || "Không tìm thấy hóa đơn"}</p>
        <Link href="/invoices" className="text-brand text-sm mt-4 inline-block">
          ← Danh sách
        </Link>
      </Card>
    );
  }

  const s = statusMap[invoice.status] ?? { label: invoice.status, variant: "gray" as const };

  return (
    <div className="space-y-4 max-w-4xl">
      <PageHeader
        title={invoice.invoice_no}
        subtitle={`Đơn ${invoice.order_no ?? invoice.order_id} · ${invoice.company_name ?? ""}`}
        actions={
          <>
            <a
              href={`/api/proxy/invoices/${invoice.id}/pdf`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex"
            >
              <Button variant="secondary" size="sm">
                Xem / In HĐ
              </Button>
            </a>
            {isAdmin && invoice.status === "draft" && (
              <Button
                size="sm"
                disabled={acting}
                onClick={() => action(`/api/proxy/invoices/${invoice.id}/send`, "POST", undefined, "Đã gửi hóa đơn.")}
              >
                Gửi hóa đơn
              </Button>
            )}
            {isAdmin && (invoice.status === "sent" || invoice.status === "overdue") && (
              <Button
                size="sm"
                disabled={acting}
                onClick={() =>
                  action(
                    `/api/proxy/invoices/${invoice.id}/pay`,
                    "POST",
                    { payment_method: "bank_transfer" },
                    "Đã ghi nhận thanh toán hóa đơn.",
                  )
                }
              >
                Ghi nhận thanh toán
              </Button>
            )}
          </>
        }
      />

      {error && <Card className="p-4 text-sm text-danger">{error}</Card>}

      <Card className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-text-muted">Trạng thái</p>
          <Badge variant={s.variant} className="mt-1">
            {s.label}
          </Badge>
        </div>
        <div>
          <p className="text-text-muted">Ngày lập</p>
          <p className="mt-1">{invoice.invoice_date}</p>
        </div>
        <div>
          <p className="text-text-muted">Hạn thanh toán</p>
          <p className="mt-1">{invoice.due_date}</p>
        </div>
        <div>
          <p className="text-text-muted">Tổng thanh toán</p>
          <p className="mt-1 font-medium">{formatVnd(invoice.total_amount)}</p>
        </div>
        {isAdmin && invoice.pdf_path && (
          <div className="col-span-2 sm:col-span-4">
            <p className="text-xs text-success">PDF đã lưu trên server — mở lại sẽ dùng bản snapshot.</p>
          </div>
        )}
      </Card>

      <Card>
        <Table>
          <Thead>
            <Tr>
              <Th>Sản phẩm</Th>
              <Th className="text-right">SL</Th>
              <Th className="text-right">Đơn giá</Th>
              <Th className="text-right">Thành tiền</Th>
            </Tr>
          </Thead>
          <tbody>
            {(invoice.items ?? []).map((line) => (
              <Tr key={line.id}>
                <Td>{lineProductName(line)}</Td>
                <Td className="text-right">{line.quantity}</Td>
                <Td className="text-right">{formatVnd(line.unit_price_vnd)}</Td>
                <Td className="text-right">{formatVnd(lineAmount(line))}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
        <div className="p-4 border-t border-border text-sm space-y-1 text-right">
          <p>Tạm tính: {formatVnd(invoice.amount_vnd)}</p>
          <p>Thuế VAT: {formatVnd(invoice.tax_amount)}</p>
          <p className="font-semibold text-base">Tổng: {formatVnd(invoice.total_amount)}</p>
        </div>
      </Card>

      {invoice.note && (
        <Card className="p-4 text-sm">
          <p className="text-text-muted mb-1">Ghi chú</p>
          <p>{invoice.note}</p>
        </Card>
      )}

      <Link href="/invoices" className="text-brand text-sm">
        ← Danh sách hóa đơn
      </Link>
    </div>
  );
}
