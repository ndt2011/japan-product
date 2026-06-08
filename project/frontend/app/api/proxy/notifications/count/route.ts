import { jsonFromProxy, proxyToApi } from "@/lib/server-api";

export async function GET() {
  const { result, status } = await proxyToApi("/notifications/count", { method: "GET" });
  return jsonFromProxy(result, status);
}
