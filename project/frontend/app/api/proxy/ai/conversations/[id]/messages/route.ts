import { jsonFromProxy, proxyToApi } from "@/lib/server-api";

/**
 * GET /api/proxy/ai/conversations/[id]/messages
 * Toàn bộ tin nhắn trong 1 phiên chat.
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const { result, status } = await proxyToApi(
    `/ai/conversations/${params.id}/messages`,
    { method: "GET" },
  );
  return jsonFromProxy(result, status);
}
