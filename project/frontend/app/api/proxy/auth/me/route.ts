import { jsonFromProxy, proxyToApi } from "@/lib/server-api";
import type { AuthUser } from "@/types/api";

export async function GET() {
  const { result, status } = await proxyToApi<{ user: AuthUser }>("/auth/me", { method: "GET" });
  return jsonFromProxy(result, status);
}
