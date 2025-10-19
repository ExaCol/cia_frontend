"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

type Punto = { id: string; nombre: string; position: google.maps.LatLngLiteral };

const puntos: Punto[] = [
  { id: "1", nombre: "Plaza",  position: { lat: 4.65, lng: -74.06 } },
  { id: "2", nombre: "Museo",  position: { lat: 4.61, lng: -74.07 } },
  { id: "3", nombre: "Parque", position: { lat: 4.64, lng: -74.08 } },
];

export default function Mapa() {
  const divRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    let map: google.maps.Map | null = null;

    const init = async () => {
      if (!divRef.current) return;

      setOptions({
        key: process.env.NEXT_PUBLIC_API_KEY!,
      });
      const mapId = process.env.NEXT_PUBLIC_GMP_MAP_ID;

      const { Map, InfoWindow } = (await importLibrary("maps")) as google.maps.MapsLibrary;
      const { AdvancedMarkerElement } = (await importLibrary("marker")) as google.maps.MarkerLibrary;

      map = new Map(divRef.current, {
        center: { lat: 4.64, lng: -74.07 },
        zoom: 13,
        mapId,
      });

      const info = new InfoWindow();

      const bounds = new google.maps.LatLngBounds();

      puntos.forEach((p) => {
        const marker = new AdvancedMarkerElement({
          map,
          position: p.position,
          title: p.nombre,
        });

        bounds.extend(p.position);

        marker.addListener("click", () => {
          info.close();
          info.setContent(`<strong>${p.nombre}</strong><br/>ID: ${p.id}`);
          info.open({ map: map!, anchor: marker });

        });
      });

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds);
      }
    };

    init();
    return () => {
      map = null;
    };
  }, [router]);

  return <div ref={divRef} style={{ width: "100%", height: 500 }} />;
}
