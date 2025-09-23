/*
Developed by Tomás Vera & Luis Romero
Version 1.0
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

  let backendData = null;
  try {
    const backendRes = await axios.request({
      method: "POST",
      url: endpoint,
      headers: { "Content-Type": "application/json" },
      data: { email, password },
      validateStatus: () => true,
    });

    if (!backendRes || backendRes.status >= 400) {
      console.error("⚠️ Error del backend auth:", backendRes?.data ?? backendRes?.statusText);
      return NextResponse.json(
        { message: backendRes?.data ?? "Error en autenticación externa" },
        { status: backendRes?.status || 500 }
      );
    }

    backendData = backendRes.data;
  } catch (err) {
    console.error("⚠️ Error al autenticar (request):", err?.response?.data || err?.message || err);
    return NextResponse.json(
      { message: err?.response?.data || err?.message || "Error en autenticación" },
      { status: err?.response?.status || 500 }
    );
  }

  const role =
    backendData?.role ??
    backendData?.rol ??
    (typeof backendData === "string" ? backendData : null);

  let token = backendData?.token ?? backendData?.accessToken ?? backendData?.jwt ?? null;

  if (!token) {
    token = jwt.sign(
      {
        email,
        role,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 días
      },
      secretKey
    );
  }

  const authObj = {
    token,
    role: role ?? null,
    email: email ?? null,
  };

  const maxAge = 60 * 60 * 24 * 7; // 7 días en segundos
  const cookieValue = encodeURIComponent(JSON.stringify(authObj));

  const serialized = serialize("auth", cookieValue, {
    httpOnly: false,
    secure: false,
    sameSite: "lax",
    maxAge,
    path: "/",
  });

  const responseBody = {
    role: authObj.role,
    email: authObj.email,
    message: "Login exitoso",
  };

  const response = NextResponse.json(responseBody, { status: 200 });
  response.headers.set("Set-Cookie", serialized);
  return response;
}

