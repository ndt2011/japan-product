import { jsonFromProxy, proxyToApi } from "@/lib/server-api";
import type { ProductDetailData } from "@/types/api";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const { result, status } = await proxyToApi<ProductDetailData>(`/products/${params.id}`, {
    method: "GET",
  });
  return jsonFromProxy(result, status);
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  const body = await request.json();
  const { result, status } = await proxyToApi(`/products/${params.id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return jsonFromProxy(result, status);
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const { result, status } = await proxyToApi(`/products/${params.id}`, {
    method: "DELETE",
  });
  return jsonFromProxy(result, status);
}
