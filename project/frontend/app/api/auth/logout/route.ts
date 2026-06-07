import { apiFetch } from "@/lib/api";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const token = cookies().get("auth_token")?.value;

  if (token) {
    await apiFetch("/auth/logout", { method: "POST" }, token);
  }

  const response = NextResponse.json({ success: true });
  response.cookies.delete("auth_token");
  response.cookies.delete("auth_user");
  response.cookies.delete("auth_expires_at");

  return response;
}
