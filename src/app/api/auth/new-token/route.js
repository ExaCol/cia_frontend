/*
Developed by Tomás Vera & Luis Romero
Version 1.0
Route to replace the token
*/
import { NextResponse } from "next/server";
import { serialize } from "cookie";
import jwt from "jsonwebtoken";

export async function POST(req) {
  const secretKey = process.env.JWT_KEY;
  if (!secretKey) {
    return NextResponse.json({ message: "JWT_KEY not set" }, { status: 500 });
  }

  let incoming;
  try {
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await req.json();
      incoming = typeof body === "string" ? body : body?.token ?? body?.jwt;
    } else {
      const text = await req.text();
      try {
        const maybe = JSON.parse(text);
        incoming = typeof maybe === "string" ? maybe : maybe?.token ?? maybe?.jwt;
      } catch {
        incoming = text;
      }
    }
  } catch {
    alert("Error leyendo body");
    return NextResponse.json({ message: "Error leyendo body" }, { status: 400 });
  }

  if (!incoming || typeof incoming !== "string") {
    return NextResponse.json(
      { message: "Body debe incluir el nuevo token (string) en { token } o texto plano" },
      { status: 400 }
    );
  }

  const currentCookie = req.cookies?.get?.("loginToken")?.value;

  let currentPayload;
  if (currentCookie) {
    const decoded = jwt.decode(currentCookie);
    if (decoded && typeof decoded === "object") {
      currentPayload = decoded;
    }
  }

  const newPayload= {
    ...currentPayload,
    token: incoming,
  };

  if (!newPayload.exp) {
    newPayload.exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7;
  }

  const appJwt = jwt.sign(newPayload, secretKey);

  const serialized = serialize("loginToken", appJwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7, // 7 días
    path: "/",
  });

  const res = NextResponse.json({ message: "Token actualizado en cookie" }, { status: 200 });
  res.headers.set("Set-Cookie", serialized);
  return res;
}
