/*
Developed by Tomás Vera & Luis Romero
Version 1.0
Update Form
*/
"use client";

import React, { useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import "@/styles/globals.css";

const url = process.env.NEXT_PUBLIC_URL;

interface RegisterFormProps {
  role: string;
}
function UpdateForm() {
  const router = useRouter();
  useEffect(() => {
    axios
      .get("/api/auth/token")
      .then((res) => {
        const jwt = res.data;
        axios
          .get(url + "/usr/user", {
            headers: {
              Authorization: `Bearer ${jwt}`,
            },
          })
          .then((res) => {
            const user = res.data;
            (document.getElementById("name") as HTMLInputElement).value =
              user.name;
            (document.getElementById("mail") as HTMLInputElement).value =
              user.email;
          })
          .catch((err) => {
            console.error("Error al obtener el usuario:", err);
            alert("Error al obtener el usuario: " + err.response.data);
          });
      })
      .catch((err) => {
        console.error("Error al obtener el token JWT:", err);
        alert("Error al obtener el token JWT");
        return;
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    // Recolectar datos
    const name = String(fd.get("name") ?? "").trim();
    const email = String(fd.get("mail") ?? "").trim();

    const payload = { name, email };
    axios
      .get("/api/auth/token")
      .then((res) => {
        const jwt = res.data;
        axios
          .patch(url + "/usr/user", payload, {
            headers: {
              Authorization: `Bearer ${jwt}`,
            },
          })
          .then((res) => {
            axios
              .post("/api/auth/new-token", { token: res.data.token })
              .then(() => {
                alert("Usuario actualizado exitosamente");
                router.push("/client/profile");
              })
              .catch((err) => {
                console.error("Error al actualizar el token:", err);
                alert("Error al actualizar el token: " + err.response.data);
              });
          })
          .catch((err) => {
            console.error("Error al actualizar:", err);
            const msg =
              err?.response?.data?.message ||
              err?.response?.data ||
              err?.message ||
              "Error al actualizar";
            alert(msg);
          });
      })
      .catch((err) => {
        console.error("Error al obtener el token JWT:", err);
        alert("Error al obtener el token JWT");
        return;
      });
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
