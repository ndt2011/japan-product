import { jsonFromProxy, proxyToApi } from "@/lib/server-api";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  const body = await request.text();
  const { result, status } = await proxyToApi(`/shipment-batches/${params.id}/tracking`, {
    method: "PUT",
    body,
    headers: { "Content-Type": "application/json" },
  });
  return jsonFromProxy(result, status);
}
