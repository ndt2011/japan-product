import { jsonFromProxy, proxyToApi } from "@/lib/server-api";

/**
 * POST /api/proxy/ai/chat
 * Gửi tin nhắn tới AI nhân viên và nhận reply.
 * spec: docs/sa/amendments/ai-conversation-upgrade.md § 5
 */
export async function POST(request: Request) {
  const body = await request.json();
  const { result, status } = await proxyToApi("/ai/chat", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return jsonFromProxy(result, status);
}
