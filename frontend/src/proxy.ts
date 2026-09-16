import { NextResponse, type NextRequest } from "next/server";

// Cookie-presence routing only; real auth is enforced by the API.
const PROTECTED = ["/messages", "/notifications", "/settings", "/ember", "/tools", "/bookmarks", "/onboarding", "/mod", "/plus"];

export function proxy(req: NextRequest) {
  const hasSession = req.cookies.has("op_refresh");
  const { pathname } = req.nextUrl;

  if (hasSession && (pathname === "/" || pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/home", req.url));
  }
  if (!hasSession && PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|api/|favicon.ico|icon.svg|.*\\..*).*)"],
};
