"use client";

import React, { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const Mapa = dynamic(() => import("@/components/Mapa"), {
  ssr: false,
  loading: () => <div style={{ height: 500 }}>Cargando mapa…</div>,
});

function OficinasTramites() {
  const sp = useSearchParams();
  const router = useRouter();
  const [serviceType, setServiceType] = React.useState<string | null>(null);
  const [courseType, setCourseType] = React.useState<string | null>(null);
  const [plate, setPlate] = React.useState<string | null>(null);

  useEffect(() => {
    const service = decodeURIComponent(sp.get("serviceType") ?? "");
    const plateC = decodeURIComponent(sp.get("plate") ?? "");
    const course = decodeURIComponent(sp.get("courseType") ?? "");
    setServiceType(service);
    setCourseType(course);
    setPlate(plateC);
      if(!service){
        router.push("/client/profile");
        return;
      
    }
  }, [sp]);

  return (
    <div>
      <h1>Oficinas de trámite cercanas</h1>
      <p>
        Por favor, elige una ubicación para solicitar tu servicio de {serviceType}
      </p>
      <Mapa />
    </div>
  );
}

export default OficinasTramites;
