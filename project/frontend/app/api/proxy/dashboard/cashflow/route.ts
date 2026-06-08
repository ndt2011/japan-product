import { jsonFromProxy, proxyToApi } from "@/lib/server-api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const qs = searchParams.toString();
  const path = qs ? `/dashboard/cashflow?${qs}` : "/dashboard/cashflow";
  const { result, status } = await proxyToApi(path, { method: "GET" });
  return jsonFromProxy(result, status);
}
