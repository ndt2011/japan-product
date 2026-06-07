import { getAuthToken } from "@/lib/server-api";
import type { ApiResponse } from "@/types/api";
import { NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? "http://localhost:8000/api";

export async function GET(request: Request) {
  const token = getAuthToken();
  if (!token) {
    return NextResponse.json(
      { success: false, data: null, message: "M0101", errors: null },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.toString();

  try {
    const res = await fetch(`${API_URL}/ai/candidates${query ? `?${query}` : ""}`, {
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

export async function POST(request: Request) {
  const token = getAuthToken();
  if (!token) {
    return NextResponse.json(
      { success: false, data: null, message: "M0101", errors: null },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const res = await fetch(`${API_URL}/ai/candidates`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
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
