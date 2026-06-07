import { jsonFromProxy, proxyToApi } from "@/lib/server-api";
import type { OrderDetailData } from "@/types/api";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const { result, status } = await proxyToApi<OrderDetailData>(`/orders/${params.id}`, {
    method: "GET",
  });
  return jsonFromProxy(result, status);
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  const body = await request.json();
  const { result, status } = await proxyToApi(`/orders/${params.id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return jsonFromProxy(result, status);
}
