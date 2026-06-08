import { jsonFromProxy, proxyToApi } from "@/lib/server-api";

export async function PUT(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const { result, status } = await proxyToApi(`/orders/${params.id}/approve`, {
    method: "PUT",
    body: JSON.stringify({}),
  });
  return jsonFromProxy(result, status);
}
