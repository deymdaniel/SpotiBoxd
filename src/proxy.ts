import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJWT } from "./lib/auth";

/**
 * Next.js Middleware to intercept requests for protected pages.
 * Explaining: We read the JWT token directly from the request cookies. If verified, we allow/disallow access.
 */
export default async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const isAdminRoute = path.startsWith("/admin");
  const isDashboardRoute = path.startsWith("/dashboard");
  const isAuthRoute = path === "/login" || path === "/signup";

  // Read session token cookie directly from the incoming request cookies
  const token = request.cookies.get("session_token")?.value;

  // Verify the JWT token
  let session = null;
  if (token) {
    session = await verifyJWT(token);
  }

  // 1. If trying to access Auth pages (/login, /signup) while logged in, redirect to dashboard
  if (isAuthRoute) {
    if (session) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // 2. If trying to access Private Dashboard without a session, redirect to login
  if (isDashboardRoute) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // 3. If trying to access Admin Moderation Panel without being an ADMIN, redirect appropriately
  if (isAdminRoute) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (session.role !== "ADMIN") {
      // Redirect regular users to their dashboard
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

// Limit the middleware to run only on these specific route paths
export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login", "/signup"],
};
