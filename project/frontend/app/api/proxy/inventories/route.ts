import { jsonFromProxy, proxyToApi } from "@/lib/server-api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.toString();
  const path = query ? `/inventories?${query}` : "/inventories";
  const { result, status } = await proxyToApi(path, { method: "GET" });
  return jsonFromProxy(result, status);
}
