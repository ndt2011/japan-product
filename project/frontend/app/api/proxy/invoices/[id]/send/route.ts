import { jsonFromProxy, proxyToApi } from "@/lib/server-api";
import type { InvoiceDetailData } from "@/types/api";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const { result, status } = await proxyToApi<InvoiceDetailData>(`/invoices/${params.id}/send`, { method: "POST" });
  return jsonFromProxy(result, status);
}
