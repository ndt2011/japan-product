import { jsonFromProxy, proxyToApi } from "@/lib/server-api";

export async function GET() {
  const { result, status } = await proxyToApi("/exchange-rates/current", { method: "GET" });
  return jsonFromProxy(result, status);
}
