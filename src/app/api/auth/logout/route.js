/*
Developed by Tomás Vera & Luis Romero
Version 1.0
Route to logout user by clearing the authentication cookie
*/
import { verify } from "jsonwebtoken";
import { NextResponse } from "next/server";
import { serialize } from "cookie";

export async function POST(req) {
  const token = req.cookies.get("loginToken")?.value;

  if (!token) {
    // Borra la cookie igualmente para asegurar logout
    const serialized = serialize("loginToken", null, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 0,
      path: "/",
    });
    const response = NextResponse.json(
      { message: "No Token" },
      { status: 401 }
    );
    response.headers.set("Set-Cookie", serialized);
    return response;
  }

  try {
    verify(token, process.env.JWT_KEY);
    const serialized = serialize("loginToken", null, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 0,
      path: "/",
    });
    const response = NextResponse.json(
      { message: "Logout exitoso" },
      { status: 200 }
    );
    response.headers.set("Set-Cookie", serialized);
    return response;
  } catch (e) {
    return NextResponse.json({ mensaje: "Token inválido" }, { status: 401 });
  }
}
