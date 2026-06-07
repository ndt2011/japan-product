import { jsonFromProxy, proxyToApi } from "@/lib/server-api";
import type { InvoiceDetailData } from "@/types/api";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json().catch(() => ({}));
  const { result, status } = await proxyToApi<InvoiceDetailData>(`/invoices/${params.id}/pay`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return jsonFromProxy(result, status);
}
