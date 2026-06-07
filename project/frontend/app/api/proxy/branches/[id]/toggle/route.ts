import { jsonFromProxy, proxyToApi } from "@/lib/server-api";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PUT(_request: Request, { params }: Params) {
  const { id } = await params;
  const { result, status } = await proxyToApi(`/branches/${id}/toggle`, { method: "PUT" });
  return jsonFromProxy(result, status);
}
