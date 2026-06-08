import { jsonFromProxy, proxyToApi } from "@/lib/server-api";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; costId: string }> },
) {
  const { id, costId } = await params;
  const { result, status } = await proxyToApi(`/orders/${id}/costs/${costId}`, {
    method: "DELETE",
  });
  return jsonFromProxy(result, status);
}
