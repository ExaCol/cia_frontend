/*
Developed by Tomás Vera & Luis Romero
Version 1.0
Route to handle user profile retrieval, authenticate against the backend
*/
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import axios from "axios";

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
        return NextResponse.json({ message: "Token inválido" }, { status: 401 });
    }
    const { email, token: backendToken } = decoded;
    if (!email || !backendToken) {
        return NextResponse.json({ message: "Token inválido" }, { status: 401 });
    }
    const baseUrl = process.env.NEXT_PUBLIC_URL;
    const endpoint = `${baseUrl}/usr/profile`;
    try {
        const backendRes = await axios.get(endpoint, {
            headers: { Authorization: `Bearer ${backendToken}` },
            timeout: 10000,
            validateStatus: () => true,
        });
        if (backendRes.status >= 400) {
            return NextResponse.json(
                { message: backendRes.data || "Error al obtener el perfil" },
                { status: backendRes.status }
            );
        }
        return NextResponse.json(backendRes.data, { status: 200 });
    } catch (err) {
        return NextResponse.json(
            { message: "Error del servidor" },
            { status: 500 }
        );
    }   
}
    return NextResponse.json(
      { message: "Error del servidor" },
      { status: 500 }
    );
  