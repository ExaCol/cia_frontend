/*
Developed by Tomás Vera & Luis Romero
Version 1.0
Home Page
*/

import "@/styles/globals.css";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "SmartTraffic",
  description: "Página de inicio de SmartTraffic",
};

export default function Home() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        margin: "5%",
      }}
    >
      <div
        style={{
          width: "30%",
        }}
      >
        <h1>¡Bienvenido a la página de Smart Traffic!</h1>
        <p>
          Obtén notificaciones y novedades sobre tus vehículos, haz consultas al
          SIMIT. ¡Paga todos tus trámites viales en un solo portal!
        </p>
        <Link href="/login">
          <button>Inicia sesión</button>
        </Link>
        <Link href="/register">
        <button>Regístrate</button>
          </Link>
      </div>
      <div
        style={{
          position: "relative",
          width: "30%",
          aspectRatio: "4 / 3",
        }}
      >
        <Image
          src="/inicio.png"
          alt="Exa"
          fill
          style={{ objectFit: "contain" }}
          priority
        />
      </div>
    </div>
  );
}
