import { jsonFromProxy, proxyToApi } from "@/lib/server-api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.toString();
  const path = query ? `/warehouses?${query}` : "/warehouses";
  const { result, status } = await proxyToApi(path, { method: "GET" });
  return jsonFromProxy(result, status);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { result, status } = await proxyToApi("/warehouses", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return jsonFromProxy(result, status === 200 ? 201 : status);
}
