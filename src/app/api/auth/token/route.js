/*
Developed by Tomás Vera & Luis Romero
Version 1.0
Route to get token saved in cookies
*/
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(req) {
  const secretKey = process.env.JWT_KEY;
  if (!secretKey) {
    return NextResponse.json({ message: "JWT_KEY not set" }, { status: 500 });
  }
    const token = req.cookies.get("loginToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "No autenticado" }, { status: 401 });
    }

    let decoded;
    try {
        decoded = jwt.verify(token, secretKey);
    } catch (err) {
        return NextResponse.json({ message: "Token front inválido" }, { status: 401 });
    }
    const { email, token: backendToken } = decoded;
    if (!email || !backendToken) {
        return NextResponse.json({ message: "Token front inválido" }, { status: 401 });
    }
    return NextResponse.json(backendToken, { status: 200 });
}
   
  