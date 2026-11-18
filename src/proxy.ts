import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { getAuthSecret, SESSION_COOKIE } from "@/lib/secret";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  let role: string | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, getAuthSecret());
      role = typeof payload.role === "string" ? payload.role : null;
    } catch {
      role = null;
    }
  }

  const signedIn = role !== null;
  const isAuthPage = pathname === "/" || pathname === "/signup";
  const needsAuth =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/exam") ||
    pathname.startsWith("/admin");

  if (needsAuth && !signedIn) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isAuthPage && signedIn) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/signup", "/dashboard/:path*", "/exam/:path*", "/admin/:path*"],
};
