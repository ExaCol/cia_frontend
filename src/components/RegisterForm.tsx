/*
Developed by Tomás Vera & Luis Romero
Version 1.1
Register Form
*/
"use client";

import React from "react";
import Link from "next/link";
import axios from "axios";
import { useRouter } from "next/navigation";

const url = process.env.NEXT_PUBLIC_URL;

function RegisterForm({role}) {
  const router = useRouter();
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    // Solo mayores de 16 años
    const birth = String(fd.get("birth") ?? "").trim();
    const minimo = new Date();
    minimo.setFullYear(minimo.getFullYear() - 16);
    if (new Date(birth) > minimo) {
      alert("Debes ser mayor de 16 años para registrarte");
      return;
    }
    
    //Verificación de contraseñas iguales
    const password = String(fd.get("pass") ?? "");
    const password2 = String(fd.get("pass2") ?? "");

    if (password !== password2) {
      alert("Las contraseñas no coinciden");
      return;
    }

    // Recolectar datos
    const name = String(fd.get("name") ?? "").trim();
    const tipoDoc = String(fd.get("tipoDoc") ?? "").trim();
    const documento = String(fd.get("documento") ?? "").trim();
    const identification = tipoDoc + "-" + documento;
    const email = String(fd.get("mail") ?? "").trim();

    const address = String(fd.get("address") ?? "").trim();
    
    const lon = -74000000;
    const lat = 4300000;

    const payload = {name, identification, email, password, role, lon, lat};

    try {
      const response = await axios.post(url + "/usr/register", payload);
      if (response.status === 201) {
        alert("Usuario registrado con éxito");
        router.push("/login");
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        alert("Error al registrarse: " + error.response.data);
      } else {
        alert("Error al registrarse: " + String(error));
      }
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
      <h2 style={{ margin: 0, alignSelf: "center" }}>Registro de Usuario</h2>

      <label htmlFor="name">Nombre Completo</label>
      <input
        id="name"
        name="name"
        type="text"
        placeholder="Ej: Tomás Vera"
        required
      />

      <label htmlFor="tipoDoc">Tipo de documento</label>
      <select id="tipoDoc" name="tipoDoc" defaultValue="cc" required>
        <option value="cc">Cédula de ciudadanía</option>
        <option value="ce">Cédula de extranjería</option>
        <option value="ti">Tarjeta de identidad</option>
        <option value="pp">Pasaporte</option>
      </select>

      <label htmlFor="documento">Documento</label>
      <input
        id="documento"
        name="documento"
        type="number"
        placeholder="Ej: 1234567890"
        required
      />

      <label htmlFor="pass">Contraseña</label>
      <input
        id="pass"
        name="pass"
        type="password"
        placeholder="Con caracteres especiales y mayúsculas"
        required
        autoComplete="new-password"
        minLength={8}
      />
      <input
        id="pass2"
        name="pass2"
        type="password"
        placeholder="Confirma tu contraseña"
        required
        autoComplete="new-password"
        minLength={8}
      />

      <label htmlFor="mail">Correo</label>
      <input
        id="mail"
        name="mail"
        type="email"
        placeholder="Ej: tomasvera@correo.com"
        required
      />

      <label htmlFor="birth">Fecha de Nacimiento</label>
      <input id="birth" name="birth" type="date" required />

      <label htmlFor="address">Ubicación</label>
      <input
        id="address"
        name="address"
        type="text"
        placeholder="Ej: Calle 45 #8-14"
      />

      <button type="submit">Registrar</button>

      <div style={{ marginTop: 6, alignSelf: "center" }}>
        <Link
          href="/login"
          style={{ color: "gray", textDecoration: "underline" }}
        >
          ¿Ya tienes un usuario?
        </Link>
      </div>
    </form>
  );
}

export default RegisterForm;
