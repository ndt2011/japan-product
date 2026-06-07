import { getAuthToken } from "@/lib/server-api";
import type { ApiResponse } from "@/types/api";
import { NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? "http://localhost:8000/api";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const token = getAuthToken();
  if (!token) {
    return NextResponse.json(
      { success: false, data: null, message: "M0101", errors: null },
      { status: 401 },
    );
  }

  try {
    const res = await fetch(`${API_URL}/products/${params.id}/images`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });
    const data = (await res.json()) as ApiResponse<unknown>;
    return NextResponse.json(data, { status: res.ok ? 200 : res.status });
  } catch {
    return NextResponse.json(
      { success: false, data: null, message: "API_OFFLINE", errors: null },
      { status: 503 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const token = getAuthToken();
  if (!token) {
    return NextResponse.json(
      { success: false, data: null, message: "M0101", errors: null },
      { status: 401 },
    );
  }

  try {
    const formData = await request.formData();
    const res = await fetch(`${API_URL}/products/${params.id}/images`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      body: formData,
    });
    const data = (await res.json()) as ApiResponse<unknown>;
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { success: false, data: null, message: "API_OFFLINE", errors: null },
      { status: 503 },
    );
  }
}
