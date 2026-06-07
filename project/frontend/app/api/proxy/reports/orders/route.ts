import { jsonFromProxy, proxyToApi } from "@/lib/server-api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.toString();
  const path = query ? `/reports/orders?${query}` : "/reports/orders";
  const { result, status } = await proxyToApi(path, { method: "GET" });
  return jsonFromProxy(result, status);
}
