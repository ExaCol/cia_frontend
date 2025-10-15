/*
Developed by Tomás Vera & Luis Romero
Version 1.0
Usuario Home Page
*/

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <Link href="/client/services/new">
          <button>Solicitar servicio</button>
        </Link>
      </div>
      <h2>Realiza consultas al simit de tus vehiculos</h2>

      <div
        style={{
          position: "relative",
          width: "30%",
          aspectRatio: "4 / 3",
          margin: "0 auto",
        }}
      >
        <Link href="/client/profile">
          <Image
            src="/simit.png"
            alt="SIMIT"
            fill
            className="image_home"
            priority
          />
        </Link>
      </div>

      <h2>Encuentra oficinas de trámite cercanas a ti</h2>
      <div
        style={{
          position: "relative",
          width: "30%",
          aspectRatio: "4 / 3",
          margin: "0 auto",
        }}
      >
        <Link href="/client/profile">
          <Image
            src="/people.png"
            alt="People"
            fill
            className="image_home"
            priority
          />
        </Link>
      </div>
      <h2>Para información más detallada accede a tu perfil</h2>
      <div
        style={{
          position: "relative",
          width: "30%",
          aspectRatio: "4 / 3",
          margin: "0 auto",
        }}
      >
        <Link href="/client/profile">
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