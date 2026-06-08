import { jsonFromProxy, proxyToApi } from "@/lib/server-api";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  const body = await request.json();
  const { result, status } = await proxyToApi(`/orders/${params.id}/record-payment`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return jsonFromProxy(result, status);
}
