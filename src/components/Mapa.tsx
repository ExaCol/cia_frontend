"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import axios from "axios";

type Punto = {
  id: string;
  nombre: string;
  position: google.maps.LatLngLiteral;
};

type Partner = {
  id: number;
  name: string;
  lat: number;
  lon: number;
  soat: boolean;
  techno: boolean;
};

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_URL,
  timeout: 10000,
});

const url = process.env.NEXT_PUBLIC_URL;

export default function Mapa() {
  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const infoRef = useRef<google.maps.InfoWindow | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const sp = useSearchParams();

  const [puntos, setPuntos] = useState<Punto[]>([]);
  const serviceType = decodeURIComponent(sp.get("serviceType") ?? "");
  const plate = decodeURIComponent(sp.get("plate") ?? "");
  const courseType = decodeURIComponent(sp.get("courseType") ?? "");
  const router = useRouter();
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: jwt } = await axios.get("/api/auth/token");
        if (!jwt) throw new Error("No se obtuvo token");

        const resp = await api.get<Partner[] | Partner>(
          `/usr/nearestPartner?type=${serviceType}&maxDistance=1000`,
          {
            headers: { Authorization: `Bearer ${jwt}` },
            params: { serviceType, plate },
          }
        );

        const raw = Array.isArray(resp.data) ? resp.data : [resp.data];
        const seen = new Set<string>();

        const points: Punto[] = raw
          .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon))
          .reduce<Punto[]>((acc, p) => {
            const key = `${p.lat},${p.lon}`;
            if (seen.has(key)) return acc;
            seen.add(key);
            acc.push({
              id: String(p.id),
              nombre: p.name,
              position: { lat: p.lat, lng: p.lon },
            });
            return acc;
          }, []);

        if (mounted) setPuntos(points);
      } catch (e: any) {
        if (e?.response?.status === 401) {
          axios
            .post("/api/auth/logout")
            .finally(() => (window.location.href = "/"));
          return;
        }
        console.error("Error obteniendo puntos:", e);
        if (mounted) {
          setPuntos([
            { id: "1", nombre: "Plaza", position: { lat: 4.65, lng: -74.06 } },
            { id: "2", nombre: "Museo", position: { lat: 4.61, lng: -74.07 } },
            { id: "3", nombre: "Parque", position: { lat: 4.64, lng: -74.08 } },
          ]);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [serviceType, plate]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!divRef.current || mapRef.current) return;
      setOptions({ key: process.env.NEXT_PUBLIC_API_KEY! });
      const mapId = process.env.NEXT_PUBLIC_GMP_MAP_ID;

      const { Map, InfoWindow } = (await importLibrary(
        "maps"
      )) as google.maps.MapsLibrary;

      if (cancelled) return;
      mapRef.current = new Map(divRef.current, {
        center: { lat: 4.64, lng: -74.07 },
        zoom: 13,
        mapId,
      });
      infoRef.current = new InfoWindow();
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    (async () => {
      const map = mapRef.current;
      if (!map) return;

      const { AdvancedMarkerElement } = (await importLibrary(
        "marker"
      )) as google.maps.MarkerLibrary;

      markersRef.current.forEach((m) => (m.map = null));
      markersRef.current = [];

      const bounds = new google.maps.LatLngBounds();

      puntos.forEach((p) => {
        const marker = new AdvancedMarkerElement({
          map,
          position: p.position,
          title: p.nombre,
        });
        markersRef.current.push(marker);
        bounds.extend(p.position);

        marker.addListener("click", () => {
          if (!infoRef.current) return;

          const onSelectPartner = (punto: Punto) => {
            const payload = {
              nombre: punto.nombre,
              price : 0,
              plate,
              serviceType,
              courseType,
              partner: {id : Number(punto.id)}
            }
            axios
              .get("/api/auth/token")
              .then((res) => {
                const jwt = res.data;
                axios
                  .post(url + "/services/create", payload, {
                    headers: {
                      Authorization: `Bearer ${jwt}`,
                    },
                  })
                  .then((res) => {
                    alert("Servicio registrado exitosamente");
                    router.push("/client/services");
                  })
                  .catch((err) => {
                    console.error("Error al registrar el servicio:", err);
                    alert(
                      "Error al registrar el servicio: " + err.response.data
                    );
                  });
              })
              .catch((err) => {
                console.error("Error al obtener el token JWT:", err);
                alert("Error al obtener el token JWT");
                return;
              });
          };

          const wrap = document.createElement("div");
          wrap.innerHTML = `
      <div style="min-width:220px">
        <h3>${p.nombre}</h3><br/>
        <form id="frm-${p.id}" style="margin-top:8px; display:flex; gap:6px; align-items:center">
          <input type="hidden" name="partnerId" value="${p.id}" />
          <button type="submit">Registrar servicio</button>
        </form>
      </div>
    `;

          const form = wrap.querySelector<HTMLFormElement>(`#frm-${p.id}`);
          form?.addEventListener("submit", (e) => {
            e.preventDefault();
            onSelectPartner(p);
          });

          const btn = wrap.querySelector<HTMLButtonElement>(`#btn-${p.id}`);
          btn?.addEventListener("click", () => {
            onSelectPartner(p);
          });

          infoRef.current.close();
          infoRef.current.setContent(wrap);
          infoRef.current.open({ map, anchor: marker });
        });
      });

      if (!bounds.isEmpty()) map.fitBounds(bounds);
    })();
  }, [puntos]);

  return <div ref={divRef} style={{ width: "100%", height: 500 }} />;
}
