/*
  Developed by Tomás Vera & Luis Romero
  Version 1.1
  Worker Home Page
*/

import React from "react";
import Image from "next/image";
import Link from "next/link";
import s from "./WorkerHome.module.css";

function Worker() {
  return (
    <div className={s.page}>
      {/* Sección 1: cursos y comparendos */}
      <section className={s.section}>
        <div>
          <h2 className={s.title}>
            Gestión de cursos de conducción y comparendos
          </h2>
        </div>

        <div className={s.imageWrapper}>
          <Link href="/worker/courses">
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

      {/* Sección 2: estadísticas */}
      <section className={s.section}>
        <div>
          <h2 className={s.title}>Estadísticas de Estudiantes</h2>
        </div>

        <div className={s.imageWrapper}>
          <Link href="/worker/stats">
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
  );
}

export default Worker;
