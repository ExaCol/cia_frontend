/*
Developed by Tomás Vera & Luis Romero
Version 1.1
Worker Profile Page
*/

"use client";

import React from "react";
import axios from "axios";
import Profile from "@/components/Profile";
import s from "./WorkerProfilePage.module.css";

function WorkerProfilePage() {
  const eliminarCuenta = async () => {
    if (
      confirm(
        "¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer."
      )
    ) {
      axios
        .get("/api/auth/token")
        .then(async (response: any) => {
          const token = response.data;
          axios
            .delete(process.env.NEXT_PUBLIC_URL + "/usr/user", {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })
            .then((res: any) => {
              if (res.status === 200) {
                alert("Cuenta eliminada exitosamente.");
                cerrarSesion(true);
              } else {
                alert(
                  "Error al eliminar la cuenta. Por favor, intenta nuevamente."
                );
              }
            })
            .catch((error: any) => {
              console.error("Error al eliminar la cuenta:", error);
              alert(
                "Error al obtener el token. Por favor, intenta nuevamente."
              );
            });
        })
        .catch((error: any) => {
          console.error("Error al obtener el token:", error);
          alert("Error al obtener el token. Por favor, intenta nuevamente.");
        });
    }
  };

  const cerrarSesion = async (cuentaEliminada: boolean) => {
    if (!cuentaEliminada) {
      if (!confirm("¿Estás seguro de que deseas cerrar sesión?")) {
        return;
      }
    }

    axios
      .post("/api/auth/logout")
      .then(() => {
        alert("Sesión cerrada exitosamente.");
        window.location.href = "/";
      })
      .catch((error: any) => {
        console.error("Error al cerrar sesión:", error);
        window.location.href = "/";
      });
  };

  return (
    <div className={s.page}>
      <h1 className={s.title}>Perfil de empleado</h1>

      <div className={s.layout}>
        {/* Card principal con el perfil */}
        <section className={s.card}>
          <div className={s.profileWrapper}>
            <Profile role="worker" />
          </div>
        </section>

        {/* Card de seguridad de la cuenta */}
        <section className={s.card}>
          <h2 className={s.cardTitle}>Seguridad de la cuenta</h2>
          <p className={s.cardText}>
            Desde aquí puedes cerrar sesión o eliminar tu cuenta de empleado.
          </p>

          <div className={s.actions}>
            <button
              type="button"
              className={s.dangerButton}
              onClick={() => cerrarSesion(false)}
            >
              Cerrar sesión
            </button>

            <button
              type="button"
              className={s.dangerButton}
              onClick={eliminarCuenta}
            >
              Eliminar cuenta
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default WorkerProfilePage;
