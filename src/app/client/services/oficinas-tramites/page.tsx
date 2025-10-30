"use client";

import React from 'react'
import dynamic from "next/dynamic";
const Mapa = dynamic(() => import("@/components/Mapa"), {
  ssr: false,
  loading: () => <div style={{height: 500}}>Cargando mapa…</div>,
});

function OficinasTramites() {
  return (
    <div>
        <h1>Oficinas de trámite cercanas</h1>
        <p>Por favor, elige una ubicación</p>
        <Mapa />
    </div>
  )
}

export default OficinasTramites