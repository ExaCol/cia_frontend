/*
Developed by Tomás Vera & Luis Romero
Version 1.1
Usuario Home Page
*/

import React from "react";
import Link from "next/link";
import Image from "next/image";
import s from "./ClientHome.module.css";

export default function Home() {
  return (
    <div className={s.page}>
      {/* Bloque 1 */}
      <section className={s.section}>
        <h2 className={s.title}>Encuentra oficinas de trámite cercanas a ti</h2>
        <div className={s.imageWrapper}>
          <Link href="/client/services">
            <Image
              src="/people.png"
              alt="People"
              fill
              className={`${s.image} image_home`}
              priority
            />
          </Link>
        </div>
      </section>

      {/* Bloque 2 */}
      <section className={s.section}>
        <h2 className={s.title}>
          Para información más detallada accede a tu perfil
        </h2>
        <div className={s.imageWrapper}>
          <Link href="/client/profile">
            <Image
              src="/user.png"
              alt="User"
              fill
              className={`${s.image} image_home`}
              priority
            />
          </Link>
        </div>
      </section>

      {/* Bloque 3 */}
      <section className={s.section}>
        <h2 className={s.title}>
          Realiza consultas al simit de tus vehiculos
        </h2>
        <div className={s.imageWrapper}>
          <Link
            href="https://www.fcm.org.co/simit/#/home-public"
            rel="noopener noreferrer"
            target="_blank"
          >
            <Image
              src="/simit.png"
              alt="SIMIT"
              fill
              className={`${s.image} image_home`}
              priority
            />
          </Link>
        </div>
      </section>
    </div>
  );
}
