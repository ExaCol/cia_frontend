import React from "react";
import Link from "next/link";
import Image from "next/image";
import s from "./AdminHome.module.css";

function Administrador() {
  return (
    <div className={s.page}>
      {/* Encabezado igual estilo que los otros */}
      <div className={s.headerRow}>
        <h1 className={s.title}>Panel de administrador</h1>
        <p className={s.subtitle}>
          Gestiona cursos de conducción, comparendos y revisa estadísticas de usuarios.
        </p>
      </div>

      {/* Tarjetas de navegación */}
      <div className={s.grid}>
        <section className={s.card}>
          <h2 className={s.cardTitle}>
            Gestión de cursos de conducción y comparendos
          </h2>

          <div className={s.imageWrapper}>
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
        </section>

        <section className={s.card}>
          <h2 className={s.cardTitle}>Estadísticas de usuarios</h2>

          <div className={s.imageWrapper}>
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
        </section>
      </div>
    </div>
  );
}

export default Administrador;
