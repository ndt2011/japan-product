import { jsonFromProxy, proxyToApi } from "@/lib/server-api";

export async function GET() {
  const { result, status } = await proxyToApi("/dashboard/stats", { method: "GET" });
  return jsonFromProxy(result, status);
}
