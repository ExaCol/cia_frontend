/*
Developed by Tomás Vera & Luis Romero
Version 1.1
Profile Page
*/

"use client";

import React from "react";
import axios from "axios";
import Profile from "@/components/Profile";
import s from "./ProfilePage.module.css";

function ProfilePage() {
  const eliminarCuenta = async () => {
    if (
      !confirm(
        "¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer."
      )
    ) {
      return;
    }

    // Obtener JWT desde el api route
    try {
      const response = await axios.get("/api/auth/token");
      const token = response.data;

      const res = await axios.delete(
        `${process.env.NEXT_PUBLIC_URL}/usr/user`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.status === 200) {
        alert("Cuenta eliminada exitosamente.");
        await cerrarSesion(true);
      } else {
        alert(
          "Error al eliminar la cuenta. Por favor, intenta nuevamente."
        );
      }
    } catch (error) {
      console.error("Error al eliminar la cuenta:", error);
      alert(
        "Error al obtener el token o eliminar la cuenta. Por favor, intenta nuevamente."
      );
    }
  };

  const cerrarSesion = async (cuentaEliminada: boolean) => {
    if (!cuentaEliminada) {
      const ok = confirm("¿Estás seguro de que deseas cerrar sesión?");
      if (!ok) return;
    }

    try {
      await axios.post("/api/auth/logout");
      alert("Sesión cerrada exitosamente.");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      window.location.href = "/";
    }
  };

  return (
    <div className={s.page}>
      {/* Encabezado */}
      <div className={s.headerRow}>
        <h2 className={s.title}>Perfil de usuario</h2>
      </div>

      {/* Layout principal */}
      <div className={s.layout}>
        {/* Columna izquierda: datos del perfil */}
        <section className={s.card}>
          {/* El componente Profile ya hace todo el render de información */}
          <div className={s.profileWrapper}>
            <Profile role="client" />
          </div>
        </section>

        {/* Columna derecha: acciones de cuenta */}
        <section className={s.card}>
          <h3 className={s.sectionTitle}>Seguridad de la cuenta</h3>
          <p className={s.sectionText}>
            Desde aquí puedes cerrar sesión de forma segura o eliminar tu cuenta
            de SmartTraffic. Ten en cuenta que la eliminación es una acción
            permanente.
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

export default ProfilePage;
