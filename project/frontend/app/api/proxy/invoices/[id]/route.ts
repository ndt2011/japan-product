import { jsonFromProxy, proxyToApi } from "@/lib/server-api";
import type { InvoiceDetailData } from "@/types/api";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const { result, status } = await proxyToApi<InvoiceDetailData>(`/invoices/${params.id}`, { method: "GET" });
  return jsonFromProxy(result, status);
}
