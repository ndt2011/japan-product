import { jsonFromProxy, proxyFormToApi, proxyToApi } from "@/lib/server-api";
import type { ProductListData } from "@/types/api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.toString();
  const path = query ? `/products?${query}` : "/products";

  const { result, status } = await proxyToApi<ProductListData>(path, { method: "GET" });
  return jsonFromProxy(result, status);
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const { result, status } = await proxyFormToApi("/products", formData);
    return jsonFromProxy(result, status === 200 || status === 201 ? 201 : status);
  }

  const body = await request.json();
  const { result, status } = await proxyToApi("/products", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return jsonFromProxy(result, status === 200 ? 201 : status);
}
