/*
Developed by Tomás Vera & Luis Romero
Version 1.1
Middleware
*/
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify, JWTPayload } from "jose";

const PUBLIC_ROUTES = new Set<string>([
  "/", 
  "/login",
  "/register",
]);

const ROLE_PREFIX: Record<string, string> = {
  Cliente: "/cliente",
  Administrador: "/administrador",
  Empleado: "/empleado",
};

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
  const { pathname } = req.nextUrl;

  const PUBLIC_FILE = /\.(.*)$/;
  if (PUBLIC_FILE.test(pathname)) return NextResponse.next();

  const token = req.cookies.get("loginToken")?.value;
  const isPublic = PUBLIC_ROUTES.has(pathname);

  if (!token) {
    if (isPublic) return NextResponse.next();

    const url = new URL("/", req.url);
    return NextResponse.redirect(url);
  }

  const payload = await verifyJwt(token);
  if (!payload) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const role = String(payload.role ?? "");
  const roleHome = ROLE_PREFIX[role];

  if (!roleHome) {
    const url = new URL("/login", req.url);
    return NextResponse.redirect(url);
  }

  if (isPublic) {
    return NextResponse.redirect(new URL(roleHome, req.url));
  }

  if (!pathname.startsWith(roleHome)) {
    return NextResponse.redirect(new URL(roleHome, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|assets|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|css|js|woff|woff2|ttf|eot)).*)",
  ],
};
