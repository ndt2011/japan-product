import { jsonFromProxy, proxyToApi } from "@/lib/server-api";
import type { InvoiceListData } from "@/types/api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.toString();
  const path = query ? `/invoices?${query}` : "/invoices";
  const { result, status } = await proxyToApi<InvoiceListData>(path, { method: "GET" });
  return jsonFromProxy(result, status);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { result, status } = await proxyToApi("/invoices", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return jsonFromProxy(result, status === 200 ? 201 : status);
}
