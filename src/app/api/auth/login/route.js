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
    return NextResponse.json(
      { message: "JWT_KEY not set" },
      { status: 500 }
    );
  }

  const { email, password} = await req.json();

  const baseUrl = process.env.NEXT_PUBLIC_URL;
  const endpoint = `${baseUrl}/usr/login`;

  let validUser = null;
  try {
    const backendRes = await axios.request({
      method: 'POST',
      url: endpoint,
      headers: { 'Content-Type': 'application/json' },
      data: { email, password}
    });

    validUser = { email, role: backendRes.data, token : backendRes.data};
  } catch (err) {
    console.error("⚠️ Error al autenticar:", err.response?.data || err);
    return NextResponse.json(
      { message: err.response?.data || err.message },
      { status: err.response?.status || 500 }
    );
  }

  if (validUser) {
    const token = jwt.sign(
      {
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 días
        email: validUser.email,
        role: validUser.role,
        token: validUser.token
      },
      secretKey
    );

    const serialized = serialize("loginToken", token, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: "/",
    });

    const response = NextResponse.json(
      { message: "Login exitoso", role: validUser.role },
      { status: 200 }
    );

    response.headers.set("Set-Cookie", serialized);
    return response;
  }

  return NextResponse.json(
    { message: "Credenciales inválidas" },
    { status: 401 }
  );
}

