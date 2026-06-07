import { jsonFromProxy, proxyToApi } from "@/lib/server-api";
import type { OrderListData } from "@/types/api";

export async function GET() {
  const { result, status } = await proxyToApi<OrderListData>("/shipment-batches/available-orders", {
    method: "GET",
  });
  return jsonFromProxy(result, status);
}
