/*
Developed by Tomás Vera & Luis Romero
Version 1.1
Route to handle user login, authenticate against the backend
*/
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";
import axios from "axios";

export async function POST(req) {
  const secretKey = process.env.JWT_KEY;
  if (!secretKey) {
    return NextResponse.json({ message: "JWT_KEY not set" }, { status: 500 });
  }

  const { email, password } = await req.json();

  const baseUrl = process.env.NEXT_PUBLIC_URL;
  const endpoint = `${baseUrl}/usr/login`;

  try {
    const backendRes = await axios.post(
      endpoint,
      { email, password },
      { timeout: 10000, validateStatus: () => true }
    );

    if (backendRes.status >= 400) {
      return NextResponse.json(
        { message: backendRes.data || "Credenciales inválidas" },
        { status: backendRes.status }
      );
    }
    const { role, token } = backendRes.data ?? {};

    const appJwt = jwt.sign(
      {
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 días
        email,
        role,
        token, 
      },
      secretKey
    );

    const serialized = serialize("loginToken", appJwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    const res = NextResponse.json(
      { message: "Login exitoso", role },
      { status: 200 }
    );
    res.headers.set("Set-Cookie", serialized);
    return res;
  } catch (err) {
    console.error("⚠️ Error al autenticar:", err.response?.data || err.message);
    return NextResponse.json(
      { message: err.response?.data || err.message },
      { status: err.response?.status || 500 }
    );
  }
}
