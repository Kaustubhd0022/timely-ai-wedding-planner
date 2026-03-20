import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Placeholder logic for protected routes
  const isProtectedRoute = path.startsWith("/app");
  
  // For MVP/Demo: Always allow or check for a mock cookie
  // const session = request.cookies.get("session")?.value;
  // if (isProtectedRoute && !session) {
  //   return NextResponse.redirect(new URL("/login", request.url));
  // }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*"],
};
