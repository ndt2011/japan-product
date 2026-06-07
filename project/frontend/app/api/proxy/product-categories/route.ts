import { jsonFromProxy, proxyToApi } from "@/lib/server-api";

export async function GET() {
  const { result, status } = await proxyToApi("/product-categories", { method: "GET" });
  return jsonFromProxy(result, status);
}
