import React from "react";
import Link from "next/link";
import Image from "next/image";

function Administrador() {
  return (
    <div>
      <h2>Gestión de cursos de conducción y comparendos</h2>

      <div
        style={{
          position: "relative",
          width: "30%",
          aspectRatio: "4 / 3",
          margin: "0 auto"
        }}
      >
        <Link href="/admin/courses">
          <Image
            src="/taxi.png"
            alt="Taxi"
            fill
            className="image_home"
            priority
          />
        </Link>
      </div>

      <h2>Estadísticas de usuarios</h2>
      <div
        style={{
          position: "relative",
          width: "30%",
          aspectRatio: "4 / 3",
          margin: "0 auto"
        }}
      >
        <Link href="/admin/stats">
          <Image
            src="/user.png"
            alt="User"
            fill
            className="image_home"
            priority
          />
        </Link>
      </div>
    </div>
  );
}

export default Administrador;
