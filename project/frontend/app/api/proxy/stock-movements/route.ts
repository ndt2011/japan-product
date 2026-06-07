import { jsonFromProxy, proxyToApi } from "@/lib/server-api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.toString();
  const path = query ? `/stock-movements?${query}` : "/stock-movements";
  const { result, status } = await proxyToApi(path, { method: "GET" });
  return jsonFromProxy(result, status);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { result, status } = await proxyToApi("/stock-movements", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return jsonFromProxy(result, status === 200 ? 201 : status);
}
