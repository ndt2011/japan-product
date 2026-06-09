import { jsonFromProxy, proxyToApi } from "@/lib/server-api";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const { result, status } = await proxyToApi(`/ai/purchasing/${params.id}`);
  return jsonFromProxy(result, status);
}
