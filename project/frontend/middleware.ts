import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/api/auth/login"];

function isPublicAsset(pathname: string): boolean {
  return /\.(?:svg|png|jpe?g|gif|webp|ico|woff2?|ttf)$/i.test(pathname);
}

function isTokenExpired(request: NextRequest): boolean {
  const expiresAt = request.cookies.get("auth_expires_at")?.value;
  if (!expiresAt) return false;
  const expiry = new Date(expiresAt);
  return Number.isNaN(expiry.getTime()) || expiry.getTime() <= Date.now();
}

function clearAuthCookies(response: NextResponse) {
  response.cookies.delete("auth_token");
  response.cookies.delete("auth_user");
  response.cookies.delete("auth_expires_at");
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth_token")?.value;
  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  const isStaticOrApi =
    pathname.startsWith("/_next") || pathname.startsWith("/api/") || isPublicAsset(pathname);

  if (token && isTokenExpired(request) && !isStaticOrApi) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("expired", "1");
    const response = NextResponse.redirect(loginUrl);
    clearAuthCookies(response);
    return response;
  }

  if (!token && !isPublic && !isStaticOrApi) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (token && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL(token ? "/dashboard" : "/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo-tt\\.svg).*)"],
};
