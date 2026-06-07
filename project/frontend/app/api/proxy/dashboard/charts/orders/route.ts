import { jsonFromProxy, proxyToApi } from "@/lib/server-api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") ?? "30";
  const { result, status } = await proxyToApi(`/dashboard/charts/orders?period=${period}`, {
    method: "GET",
  });
  return jsonFromProxy(result, status);
}
