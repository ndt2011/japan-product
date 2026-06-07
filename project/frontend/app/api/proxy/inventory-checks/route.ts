import { jsonFromProxy, proxyToApi } from "@/lib/server-api";

export async function POST(request: Request) {
  const body = await request.json();
  const { result, status } = await proxyToApi("/inventory-checks", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return jsonFromProxy(result, status);
}
