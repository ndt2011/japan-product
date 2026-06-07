import { jsonFromProxy, proxyToApi } from "@/lib/server-api";
import type { OrderDetailData } from "@/types/api";

export async function PUT(_request: Request, { params }: { params: { id: string } }) {
  const { result, status } = await proxyToApi<OrderDetailData>(`/orders/${params.id}/confirm-receipt`, {
    method: "PUT",
  });
  return jsonFromProxy(result, status);
}
