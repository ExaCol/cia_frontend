/*
Developed by Tomás Vera & Luis Romero
Version 1.0
Login Page
*/

import React from "react";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar sesión - ST",
  description: "Página de inicio de sesión de SmartTraffic",
};

function LogIn() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        padding: "40px 16px",
      }}
    >
      <form
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

        <label htmlFor="user">Usuario</label>
        <input id="user" type="text" placeholder="Ej: TomVer27" />

        <label htmlFor="pass">Contraseña</label>
        <input
          id="pass"
          type="password"
          placeholder="Con caracteres especiales y mayúsculas"
        />

        <button>Iniciar sesión</button>

        <div style={{ marginTop: 6, alignSelf: "center" }}>
          <Link
            href="/register"
            style={{ color: "gray", textDecoration: "underline" }}
          >
            ¿No tienes cuenta?
          </Link>
        </div>
      </form>
    </div>
  );
}

export default LogIn;
