import { jsonFromProxy, proxyToApi } from "@/lib/server-api";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  const body = await request.text();
  const { result, status } = await proxyToApi(`/product-categories/${params.id}`, {
    method: "PUT",
    body,
    headers: { "Content-Type": "application/json" },
  });
  return jsonFromProxy(result, status);
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const { result, status } = await proxyToApi(`/product-categories/${params.id}`, {
    method: "DELETE",
  });
  return jsonFromProxy(result, status);
}
