import { apiFetch } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export function getAuthToken(): string | undefined {
  return cookies().get("auth_token")?.value;
}

export async function proxyToApi<T>(
  path: string,
  options: RequestInit = {},
): Promise<{ result: ApiResponse<T>; status: number }> {
  const token = getAuthToken();

  if (!token) {
    return {
      result: { success: false, data: null, message: "M0101", errors: null },
      status: 401,
    };
  }

  try {
    const raw = await apiFetch<T>(path, options, token);
    const result =
      raw.success === undefined && (raw as { errors?: unknown }).errors
        ? ({ ...raw, success: false } as ApiResponse<T>)
        : raw;
    const status = result.success ? 200 : 400;

    return { result, status };
  } catch {
    return {
      result: { success: false, data: null, message: "API_OFFLINE", errors: null },
      status: 503,
    };
  }
}

export function jsonFromProxy<T>(result: ApiResponse<T>, status = 200) {
  return NextResponse.json(result, { status: result.success ? status : status === 200 ? 400 : status });
}

const API_URL = process.env.API_URL ?? "http://localhost:8000/api";

export async function proxyFormToApi<T>(
  path: string,
  formData: FormData,
): Promise<{ result: ApiResponse<T>; status: number }> {
  const token = getAuthToken();

  if (!token) {
    return {
      result: { success: false, data: null, message: "M0101", errors: null },
      status: 401,
    };
  }

  try {
    const response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: formData,
      cache: "no-store",
    });

    const result = (await response.json()) as ApiResponse<T>;

    return { result, status: response.status };
  } catch {
    return {
      result: { success: false, data: null, message: "API_OFFLINE", errors: null },
      status: 503,
    };
  }
}
