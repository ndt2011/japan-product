import { jsonFromProxy, proxyToApi } from "@/lib/server-api";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const { result, status } = await proxyToApi(`/branches/${id}`, { method: "GET" });
  return jsonFromProxy(result, status);
}

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const { result, status } = await proxyToApi(`/branches/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return jsonFromProxy(result, status);
}
