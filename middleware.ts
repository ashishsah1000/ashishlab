import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "default_unsafe_secret";

// Define the routes that need to be protected
const protectedRoutes = ["/journals/new", "/labnotes/new"];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Check if the route is protected
  const isProtected = protectedRoutes.some(route => path.startsWith(route));

  if (isProtected) {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      // Rewrite to a non-existent page to show 404 (simulating page not found)
      return NextResponse.rewrite(new URL("/404", request.url));
    }

    try {
      // Verify token using jose (edge compatible)
      await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
      return NextResponse.next();
    } catch (error) {
      // Invalid token -> 404
      return NextResponse.rewrite(new URL("/404", request.url));
    }
  }

  return NextResponse.next();
}

// Configure middleware matcher to only run on specific paths for performance
export const config = {
  matcher: [
    "/journals/new/:path*",
    "/labnotes/new/:path*",
  ],
};
