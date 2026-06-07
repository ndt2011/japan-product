import { jsonFromProxy, proxyToApi } from "@/lib/server-api";

interface Params {
  params: Promise<{ id: string; userId: string }>;
}

export async function PUT(_request: Request, { params }: Params) {
  const { id, userId } = await params;
  const { result, status } = await proxyToApi(`/branches/${id}/users/${userId}/toggle`, {
    method: "PUT",
  });
  return jsonFromProxy(result, status);
}
