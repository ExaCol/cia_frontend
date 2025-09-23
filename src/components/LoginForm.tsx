/*
Developed by Tomás Vera & Luis Romero
Version 1.1
Login Form
*/

"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { readAuthCookie } from "@/app/lib/client/cookies";

export default function LoginForm() {
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const fd = new FormData(e.currentTarget);
      const email = String(fd.get("user") || "").trim();
      const password = String(fd.get("pass") || "");

      if (!email || !password) {
        alert("Ingresa email y contraseña.");
        return;
      }

      const resp = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const body = await resp.json().catch(() => ({} as any));

      if (!resp.ok) {
        const msg = body?.message || `Error de autenticación (${resp.status})`;
        if(resp.status === 401) {
          alert("Credenciales inválidas. Intenta de nuevo.");
          return;
        }
        alert(msg);
        return;
      }

      const auth = typeof window !== "undefined" ? readAuthCookie() : null;

      const emailFromCookie = auth?.email ?? body?.email ?? email;
      const roleFromCookie = auth?.role ?? body?.role ?? null;
      const message = body?.message ?? "Login exitoso";

      alert(`${message}\nUsuario: ${emailFromCookie}${roleFromCookie ? `\nRole: ${roleFromCookie}` : ""}`);
      if(roleFromCookie === "admin") router.push("/admin");
      else if(roleFromCookie === "worker") router.push("/worker");
      else router.push("/client");

    } catch (err: any) {
      console.error("Login error:", err);
      alert("Error al conectar con el servidor.");
    } finally {
    }
  };


  return (
    <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: 420,
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          gap: 10,
          textAlign: "left",
        }}
      >
        <h2 style={{ margin: 0, alignSelf: "center" }}>Iniciar sesión</h2>

        <label htmlFor="user">Correo</label>
        <input id="user" name="user" type="mail" placeholder="Ej: tomas@correo.com" />

        <label htmlFor="pass">Contraseña</label>
        <input
          id="pass"
          name="pass"
          type="password"
          placeholder="Con caracteres especiales y mayúsculas"
        />

        <button type="submit">Iniciar sesión</button>

        <div style={{ marginTop: 6, alignSelf: "center" }}>
          <Link
            href="/register"
            style={{ color: "gray", textDecoration: "underline" }}
          >
            ¿No tienes cuenta?
          </Link>
        </div>
      </form>
  )
}
