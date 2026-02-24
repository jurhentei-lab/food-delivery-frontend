import { NextResponse } from "next/server";

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const authCookie = request.cookies.get("auth")?.value;
  const userRole = request.cookies.get("user_role")?.value;
  const isLoggedIn = authCookie === "1";

  if (pathname.startsWith("/main") && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (userRole !== "admin") {
      return NextResponse.redirect(new URL("/main", request.url));
    }
  }

  if (pathname === "/login" && isLoggedIn) {
    const target = userRole === "admin" ? "/admin" : "/main";
    return NextResponse.redirect(new URL(target, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/main/:path*", "/admin/:path*", "/login"],
};
