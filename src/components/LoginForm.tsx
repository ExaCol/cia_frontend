/*
Developed by Tomás Vera & Luis Romero
Version 1.2
Login Form
*/

"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";

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
      const response = await axios.post(
        "/api/auth/login",
        {
          email,
          password
        },
        { withCredentials: true }
      );
      if (response.status === 200) {
        router.refresh();
      }
    } catch (err: any) {
      console.error("Login error:", err);
      alert("Error de inicio de sesión: " + (err.response?.data?.message || err.message || "Unknown error"));
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
      <input
        id="user"
        name="user"
        type="mail"
        placeholder="Ej: tomas@correo.com"
      />

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

      <div style={{ marginTop: 6, alignSelf: "center" }}>
        <Link
          href="/new-password"
          style={{ color: "gray", textDecoration: "underline" }}
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </div>
    </form>
  );
}
