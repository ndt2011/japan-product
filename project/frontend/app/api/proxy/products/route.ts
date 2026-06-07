import { apiFetch } from "@/lib/api";
import type { ProductListData } from "@/types/api";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const token = cookies().get("auth_token")?.value;

  if (!token) {
    return NextResponse.json({ success: false, message: "M0101" }, { status: 401 });
  }

  try {
    const result = await apiFetch<ProductListData>("/products", { method: "GET" }, token);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch {
    return NextResponse.json({ success: false, message: "API_OFFLINE" }, { status: 503 });
  }
}
