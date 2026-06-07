import { getAuthToken } from "@/lib/server-api";
import { NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? "http://localhost:8000/api";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const token = getAuthToken();

  if (!token) {
    return NextResponse.json({ success: false, message: "M0101" }, { status: 401 });
  }

  try {
    const response = await fetch(`${API_URL}/invoices/${params.id}/pdf`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "text/html",
      },
      cache: "no-store",
    });

    const html = await response.text();

    if (!response.ok) {
      return NextResponse.json({ success: false, message: "M0002" }, { status: response.status });
    }

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch {
    return NextResponse.json({ success: false, message: "API_OFFLINE" }, { status: 503 });
  }
}
