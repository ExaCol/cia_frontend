import React from "react";
import Image from "next/image";
import Link from "next/link";

function Worker() {
  return (
    <div>
      <h2>Gestión de cursos de conducción y comparendos</h2>

      <div
        style={{
          position: "relative",
          width: "30%",
          aspectRatio: "4 / 3",
          margin: "0 auto",
        }}
      >
        <Link href="/worker/profile">
          <Image
            src="/taxi.png"
            alt="Taxi"
            fill
            className="image_home"
            priority
          />
        </Link>
      </div>

      <h2>Estadísticas de Estudiantes</h2>
      <div
        style={{
          position: "relative",
          width: "30%",
          aspectRatio: "4 / 3",
          margin: "0 auto",
        }}
      >
        <Link href="/worker/profile">
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

export default Worker;
