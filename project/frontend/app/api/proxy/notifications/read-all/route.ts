import { jsonFromProxy, proxyToApi } from "@/lib/server-api";

export async function PUT() {
  const { result, status } = await proxyToApi("/notifications/read-all", {
    method: "PUT",
    body: JSON.stringify({}),
  });
  return jsonFromProxy(result, status);
}
