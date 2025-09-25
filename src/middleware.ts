/*
Developed by Tomás Vera & Luis Romero
Version 1.1
Middleware
*/

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify, JWTPayload } from "jose";

const PUBLIC_PATHS = new Set<string>(["/", "/login", "/register"]);

const ROLE_PREFIX: Record<string, string> = {
  Worker: "/worker",
  Admin: "/admin",
  Client: "/client",
};

function normalize(p: string) {
  if (p.length > 1 && p.endsWith("/")) return p.slice(0, -1);
  return p;
}

async function verifyJwt(token: string): Promise<JWTPayload | null> {
  try {
    const secret = process.env.JWT_KEY;
    if (!secret) return null;
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const pathname = normalize(req.nextUrl.pathname);

  if (/\.(?:png|jpg|jpeg|svg|gif|webp|ico|css|js|woff2?|ttf|eot)$/.test(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get("loginToken")?.value;
  const isPublic = PUBLIC_PATHS.has(pathname);

  if (!token) {
    if (!isPublic) {
      const to = "/";
      if (pathname !== to) return NextResponse.redirect(new URL(to, req.url));
    }
    return NextResponse.next();
  }

  const payload = await verifyJwt(token);
  if (!payload) {
    const to = "/login";
    if (pathname !== to) {
      const url = new URL(to, req.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const role = String(payload.role ?? "");
  const roleHome = ROLE_PREFIX[role];

  if (!roleHome) {
    const to = "/login";
    if (pathname !== to) return NextResponse.redirect(new URL(to, req.url));
    return NextResponse.next();
  }

  if (isPublic) {
    if (pathname !== roleHome) return NextResponse.redirect(new URL(roleHome, req.url));
    return NextResponse.next();
  }

  const inArea = pathname === roleHome || pathname.startsWith(roleHome + "/");
  if (!inArea) {
    return NextResponse.redirect(new URL(roleHome, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|assets).*)",
  ],
};

