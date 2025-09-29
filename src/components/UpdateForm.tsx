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
function UpdateForm() {
  const router = useRouter();
  useEffect(() => {
  } , []);
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    // Recolectar datos
    const name = String(fd.get("name") ?? "").trim();
    const email = String(fd.get("mail") ?? "").trim();

    const payload = { name, email };

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
      <h2 style={{ margin: 0, alignSelf: "center" }}>Actualizar Usuario</h2>

      <label htmlFor="name">Nombre Completo</label>
      <input
        id="name"
        name="name"
        type="text"
        placeholder="Ej: Tomás Vera"
        required
      />

      <label htmlFor="mail">Correo</label>
      <input
        id="mail"
        name="mail"
        type="email"
        placeholder="Ej: tomasvera@correo.com"
        required
      />

      <button type="submit">Actualizar</button>

    </form>
  );
}

export default UpdateForm;
