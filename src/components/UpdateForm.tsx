/*
Developed by Tomás Vera & Luis Romero
Version 1.0
Update Form
*/
"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import axios from "axios";
import { useRouter } from "next/navigation";
import "@/styles/globals.css";
import AddressAutocompleteInput from "./AddressAutocompleteInput";

const url = process.env.NEXT_PUBLIC_URL;

interface RegisterFormProps {
  role: string;
}

//Llenar formulario con datos del usuario
/*
useEffect(() => {
    const fetchUserData = async () => {
        try {
            const response = await axios.get(url + "/usr/profile", {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            if (response.status === 200) {
                const userData = response.data;
                // Llenar los campos del formulario con los datos del usuario
                (document.getElementById("name") as HTMLInputElement).value = userData.name || "";
                const [tipoDoc, documento] = userData.identification ? userData.identification.split("-") : ["", ""];
                (document.getElementById("tipoDoc") as HTMLSelectElement).value = tipoDoc || "cc";
                (document.getElementById("documento") as HTMLInputElement).value = documento || "";
                (document.getElementById("mail") as HTMLInputElement).value = userData.email || "";
                (document.getElementById("address") as HTMLInputElement).value = userData.address || "";
                (document.getElementById("lon") as HTMLInputElement).value = userData.lon ? userData.lon.toString() : "";
                (document.getElementById("lat") as HTMLInputElement).value = userData.lat ? userData.lat.toString() : "";
                (document.getElementById("birth") as HTMLInputElement).value = userData.birth ? new Date(userData.birth).toISOString().split("T")[0] : "";
                if (role === "Admin" || role === "Worker") {
                    (document.getElementById("role") as HTMLSelectElement).value = userData.role || "Client";
                }
}
                */



function UpdateForm({ role }: RegisterFormProps) {
  console.log("Role:", role);
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

    // Verificación de contraseñas iguales
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
    const roleValue = String(fd.get("role") ?? "Client").trim();

    const lonStr = String(fd.get("lon") ?? "").trim();
    const latStr = String(fd.get("lat") ?? "").trim();
    const lon = lonStr ? Number(lonStr) : -74000000;
    const lat = latStr ? Number(latStr) : 4300000;

    const payload = { name, identification, email, password, role: roleValue, lon, lat };

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
      <AddressAutocompleteInput
        id="address"
        name="address"
        placeholder="Ej: Calle 45 #8-14"
        lang="es"
        biasLat={4.7110}
        biasLon={-74.0721}
      />

      {role === "Admin" && (
        <>
          <label htmlFor="role">Rol</label>
          <select id="role" name="role">
            <option value="Client">Cliente</option>
            <option value="Worker">Empleado</option>
            <option value="Admin">Administrador</option>
          </select>
        </>
      )}

      {role === "Worker" && (
        <>
          <label htmlFor="role">Rol</label>
          <select id="role" name="role">
            <option value="Client">Cliente</option>
            <option value="Worker">Empleado</option>
          </select>
        </>
      )}

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

export default UpdateForm;
