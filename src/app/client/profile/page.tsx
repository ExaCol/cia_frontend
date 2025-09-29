/*
Developed by Tomás Vera & Luis Romero
Version 1.0
Profile Page
*/

"use client";

import React from "react";
import axios from "axios";
import Link from "next/link";
import Profile from "@/components/Profile";


function profile() {
  const eliminarCuenta = async () => {
    //Alerta de confirmacion si / no para eliminar cuenta
    if (
      confirm(
        "¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer."
      )
    ) {
      //Obtener jwt
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
              return;
            });
        })
        .catch((error: any) => {
          console.error("Error al obtener el token:", error);
          alert("Error al obtener el token. Por favor, intenta nuevamente.");
          return;
        });
    }
  };

  const cerrarSesion = async (cuentaEliminada : boolean) => {
    if(!cuentaEliminada){
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
    <div>
      <h1>Perfil de usuario</h1>
      <Profile />
      <Link href="/client/profile/update"><button>Editar Perfil</button></Link>
      <button onClick={eliminarCuenta}>Eliminar Cuenta</button>
      <button onClick={() => cerrarSesion(false)}>Cerrar Sesión</button>
    </div>
  );
}

export default profile;
