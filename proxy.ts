import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth-cookies";

const privatePaths = ["/dashboard", "/contas", "/perfil"];
const authPaths = ["/login", "/cadastro"];

export function proxy(request: NextRequest) {
  const hasSession = Boolean(request.cookies.get(ACCESS_COOKIE)?.value || request.cookies.get(REFRESH_COOKIE)?.value);
  const path = request.nextUrl.pathname;

  if (privatePaths.some((prefix) => path.startsWith(prefix)) && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (authPaths.includes(path) && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*", "/contas/:path*", "/perfil/:path*", "/login", "/cadastro"] };
