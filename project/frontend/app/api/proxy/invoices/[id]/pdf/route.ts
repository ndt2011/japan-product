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
        Accept: "application/pdf, text/html",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json({ success: false, message: "M0002" }, { status: response.status });
    }

    const contentType = response.headers.get("content-type") ?? "application/octet-stream";
    const body = await response.arrayBuffer();

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": response.headers.get("content-disposition") ?? "inline",
      },
    });
  } catch {
    return NextResponse.json({ success: false, message: "API_OFFLINE" }, { status: 503 });
  }
}
