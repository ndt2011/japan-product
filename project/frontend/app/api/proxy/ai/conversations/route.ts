import { jsonFromProxy, proxyToApi } from "@/lib/server-api";

/**
 * GET /api/proxy/ai/conversations
 * Danh sách phiên chat của user hiện tại.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.toString();
  const path = query ? `/ai/conversations?${query}` : "/ai/conversations";
  const { result, status } = await proxyToApi(path, { method: "GET" });
  return jsonFromProxy(result, status);
}
