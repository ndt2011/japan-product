import { jsonFromProxy, proxyToApi } from "@/lib/server-api";

export async function GET() {
  const { result, status } = await proxyToApi("/suppliers", { method: "GET" });
  return jsonFromProxy(result, status);
}

export async function POST(request: Request) {
  const body = await request.text();
  const { result, status } = await proxyToApi("/suppliers", {
    method: "POST",
    body,
    headers: { "Content-Type": "application/json" },
  });
  return jsonFromProxy(result, status);
}
