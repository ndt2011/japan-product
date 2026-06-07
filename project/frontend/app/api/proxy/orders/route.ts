import { jsonFromProxy, proxyToApi } from "@/lib/server-api";
import type { OrderListData } from "@/types/api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.toString();
  const path = query ? `/orders?${query}` : "/orders";
  const { result, status } = await proxyToApi<OrderListData>(path, { method: "GET" });
  return jsonFromProxy(result, status);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { result, status } = await proxyToApi("/orders", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return jsonFromProxy(result, status === 200 ? 201 : status);
}
