import { jsonFromProxy, proxyToApi } from "@/lib/server-api";
import type { DebtSummaryData } from "@/types/api";

export async function GET() {
  const { result, status } = await proxyToApi<DebtSummaryData>("/invoices/debt-summary", { method: "GET" });
  return jsonFromProxy(result, status);
}
