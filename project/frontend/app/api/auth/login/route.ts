import { apiFetch } from "@/lib/api";
import type { LoginData } from "@/types/api";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();

  let result;
  try {
    result = await apiFetch<LoginData>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "API_OFFLINE",
        errors: null,
      },
      { status: 503 },
    );
  }

  if (!result.success || !result.data?.token) {
    return NextResponse.json(result, {
      status: result.message === "M0102" ? 403 : 401,
    });
  }

  const response = NextResponse.json({
    success: true,
    data: { user: result.data.user },
    message: result.message,
    errors: null,
  });

  response.cookies.set("auth_token", result.data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  response.cookies.set(
    "auth_user",
    JSON.stringify(result.data.user),
    {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    },
  );

  return response;
}
