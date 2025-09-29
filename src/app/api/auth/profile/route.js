/*
Developed by Tomás Vera & Luis Romero
Version 1.0
Route to handle user profile retrieval, authenticate against the backend
*/
import { verify } from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function GET(req) {
    const token = req.cookies.get("loginToken")?.value;

    if (!token) {
        return NextResponse.json({ mensaje: "No autorizado" }, { status: 401 });
    }

    try {
        const user = verify(token, process.env.JWT_KEY);
        return NextResponse.json({ email : user.email, rol: user.role}, { status: 200 });
    } catch (e) {
        return NextResponse.json({ mensaje: "Token inválido" }, { status: 401 });
    }
}