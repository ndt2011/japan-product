import { jsonFromProxy, proxyToApi } from "@/lib/server-api";

export async function GET() {
  const { result, status } = await proxyToApi("/profile", { method: "GET" });
  return jsonFromProxy(result, status);
}

export async function PUT(request: Request) {
  const body = await request.text();
  const { result, status } = await proxyToApi("/profile", {
    method: "PUT",
    body,
    headers: { "Content-Type": "application/json" },
  });
  return jsonFromProxy(result, status);
}
