/*
Developed by Tomás Vera & Luis Romero
Version 1.0
Register Page
*/

import React from "react";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Registrarse - ST",
  description: "Página de registro de SmartTraffic",
};

function Register() {
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
        <h2 style={{ margin: 0, alignSelf: "center" }}>Registro de Usuario</h2>

        <label htmlFor="user">Nombre Completo</label>
        <input id="user" type="text" placeholder="Ej: Tomás Vera" />

        <label htmlFor="user">Nombre de Usuario</label>
        <input id="user" type="text" placeholder="Ej: TomVer27" />

        <label htmlFor="user">Tipo de documento</label>
        <select id="tipoDoc" name="tipoDoc" defaultValue={"cc"}>
          <option value="cc">Cédula de ciudadanía</option>
          <option value="ce">Cédula de extranjería</option>
          <option value="ti">Tarjeta de identidad</option>
          <option value="pp">Pasaporte</option>
        </select>

        <label htmlFor="user">Documento</label>
        <input id="user" type="number" placeholder="Ej: 1234567890" />

        <label htmlFor="pass">Contraseña</label>
        <input
          id="pass"
          type="password"
          placeholder="Con caracteres especiales y mayúsculas"
        />
        <input
          id="pass2"
          type="password"
          placeholder="Confirma tu contraseña"
        />

        <label htmlFor="user">Correo</label>
        <input id="user" type="email" placeholder="Ej: tomasvera@correo.com" />

        <label htmlFor="user">Fecha de Nacimiento</label>
        <input id="user" type="date" placeholder="Ej: 27/01/2005" />

        <label htmlFor="user">Ubicación</label>
        <input id="user" type="address" placeholder="Ej: Calle 45 #8-14" />

        <button>Registrar</button>

        <div style={{ marginTop: 6, alignSelf: "center" }}>
          <Link
            href="/login"
            style={{ color: "gray", textDecoration: "underline" }}
          >
            ¿Ya tienes un usuario?
          </Link>
        </div>
      </form>
    </div>
  );
}

export default Register;
