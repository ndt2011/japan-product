import { getAuthToken } from "@/lib/server-api";
import type { ApiResponse } from "@/types/api";
import { NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? "http://localhost:8000/api";

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
    const res = await fetch(`${API_URL}/ai/search`, {
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
