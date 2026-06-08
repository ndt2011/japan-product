import { jsonFromProxy, proxyToApi } from "@/lib/server-api";

export async function GET() {
  const { result, status } = await proxyToApi("/product-categories", { method: "GET" });
  return jsonFromProxy(result, status);
}

export async function POST(request: Request) {
  const body = await request.text();
  const { result, status } = await proxyToApi("/product-categories", {
    method: "POST",
    body,
    headers: { "Content-Type": "application/json" },
  });
  return jsonFromProxy(result, status);
}
