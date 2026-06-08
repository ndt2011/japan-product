import { jsonFromProxy, proxyToApi } from "@/lib/server-api";

export async function POST(request: Request) {
  const body = await request.text();
  const { result, status } = await proxyToApi("/ai/purchasing", {
    method: "POST",
    body,
    headers: { "Content-Type": "application/json" },
  });
  return jsonFromProxy(result, status);
}
