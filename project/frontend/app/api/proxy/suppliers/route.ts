import { jsonFromProxy, proxyToApi } from "@/lib/server-api";

export async function GET() {
  const { result, status } = await proxyToApi("/suppliers", { method: "GET" });
  return jsonFromProxy(result, status);
}
