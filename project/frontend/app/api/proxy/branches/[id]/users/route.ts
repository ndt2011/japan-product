import { jsonFromProxy, proxyToApi } from "@/lib/server-api";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const { result, status } = await proxyToApi(`/branches/${id}/users`, { method: "GET" });
  return jsonFromProxy(result, status);
}

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const { result, status } = await proxyToApi(`/branches/${id}/users`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return jsonFromProxy(result, status === 200 ? 201 : status);
}
