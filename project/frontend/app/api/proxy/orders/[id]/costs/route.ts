import { jsonFromProxy, proxyToApi } from "@/lib/server-api";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { result, status } = await proxyToApi(`/orders/${id}/costs`, { method: "GET" });
  return jsonFromProxy(result, status);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const { result, status } = await proxyToApi(`/orders/${id}/costs`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return jsonFromProxy(result, status);
}
