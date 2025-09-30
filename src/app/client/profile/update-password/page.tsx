/*
Developed by Tomás Vera & Luis Romero
Version 1.0
Update Password Page
*/

"use client";
import React from "react";
import Link from "next/link";
import axios from "axios";
import { useRouter } from "next/navigation";

const url = process.env.NEXT_PUBLIC_URL;

function UpdatePassword() {
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const passwordCurrent = String(fd.get("pass") || "");
    const passwordNew = String(fd.get("passnew") || "");
    const newPassword2 = String(fd.get("passnew2") || "");
    if (passwordNew !== newPassword2) {
      alert("Las contraseñas nuevas no coinciden.");
      return;
    }

    axios
      .get("/api/auth/token")
      .then((res) => {
        const jwt = res.data;
        axios
          .patch(
            url + "/usr/update-password",
            {
              passwordCurrent,
              passwordNew,
            },
            {
              headers: {
                Authorization: `Bearer ${jwt}`,
              },
            }
          )
          .then((res: any) => {
            if (res.status === 200) {
              alert("Contraseña actualizada exitosamente.");
              router.push("/");
            } else {
              alert(
                "Error al actualizar la contraseña. Por favor, intenta nuevamente."
              );
            }
          })
          .catch((error: any) => {
            console.error("Error al actualizar la contraseña:", error);
            alert(
              error.response.data
            );
          });
      })
      .catch((err) => {
        console.error("Error al obtener el token JWT:", err);
        alert("Error al obtener el token JWT");
        return;
      });
  };
  return (
    <div>
      <h1>Actualizar Contraseña</h1>
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

        <label htmlFor="pass">Contraseña Actual</label>
        <input
          id="pass"
          name="pass"
          type="password"
          placeholder="Con caracteres especiales y mayúsculas"
          required
        />

        <label htmlFor="pass">Contraseña Nueva</label>
        <input
          id="passnew"
          name="passnew"
          type="password"
          placeholder="Con caracteres especiales y mayúsculas"
          required
        />

        <label htmlFor="pass">Confirmación Contraseña Nueva</label>
        <input
          id="passnew2"
          name="passnew2"
          type="password"
          placeholder="Confirma la nueva contraseña"
          required
        />

        <button type="submit">Cambiar Contraseña</button>

        <div style={{ marginTop: 6, alignSelf: "center" }}>
          <Link
            href="/client/profile/new-password"
            style={{ color: "gray", textDecoration: "underline" }}
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </form>
    </div>
  );
}

export default UpdatePassword;
