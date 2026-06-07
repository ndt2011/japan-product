import { jsonFromProxy, proxyToApi } from "@/lib/server-api";
import type { ShipmentBatchListData } from "@/types/api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.toString();
  const path = query ? `/shipment-batches?${query}` : "/shipment-batches";
  const { result, status } = await proxyToApi<ShipmentBatchListData>(path, { method: "GET" });
  return jsonFromProxy(result, status);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { result, status } = await proxyToApi("/shipment-batches", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return jsonFromProxy(result, status === 200 ? 201 : status);
}
