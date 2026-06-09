import { jsonFromProxy, proxyToApi } from "@/lib/server-api";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const qs = url.searchParams.toString();
  const path = qs ? `/ai/purchasing/history?${qs}` : "/ai/purchasing/history";
  const { result, status } = await proxyToApi(path);
  return jsonFromProxy(result, status);
}
