import { getAuthToken } from "@/lib/server-api";
import { apiFetch } from "@/lib/api";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const token = getAuthToken();
  if (!token) {
    return NextResponse.json({ success: false, message: "M0101" }, { status: 401 });
  }

  const formData = await req.formData();
  try {
    const result = await apiFetch<unknown>(
      "/inventories/bulk-import",
      { method: "POST", body: formData },
      token,
    );
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch {
    return NextResponse.json({ success: false, message: "API_OFFLINE" }, { status: 503 });
  }
}
