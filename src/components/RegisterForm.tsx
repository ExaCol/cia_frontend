/*
Developed by Tomás Vera & Luis Romero
Version 1.2
Register Form
*/
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { useRouter } from "next/navigation";
import "@/styles/globals.css";

const url = process.env.NEXT_PUBLIC_URL;

interface RegisterFormProps {
  role: string;
}

function AddressAutocompleteInput({
  id = "address",
  name = "address",
  placeholder = "Ej: Calle 45 #8-14",
  lang = "es",
  limit = 5,
  biasLat = 4.7110,
  biasLon = -74.0721,
}: {
  id?: string;
  name?: string;
  placeholder?: string;
  lang?: string;
  limit?: number;
  biasLat?: number;
  biasLon?: number;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hits, setHits] = useState<
    { label: string; lat?: number; lon?: number; raw?: any }[]
  >([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [coords, setCoords] = useState<{ lat: string; lon: string }>({
    lat: "",
    lon: "",
  });

  const rootRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const abortRef = useRef<AbortController | null>(null);

  const debouncedSearch = useMemo(() => {
    let timer: any;
    return (value: string) => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        if (!value || value.trim().length < 3) {
          setHits([]);
          setOpen(false);
          return;
        }
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setLoading(true);

        const safeLang =
          ["default", "en", "de", "fr"].includes(lang) ? lang : "default";
        const boostColombia = (txt: string) => {
          const low = txt.toLowerCase();
          if (!low.includes("colombia") && !low.includes("bogotá") && !low.includes("bogota")) {
            return `${txt}, Colombia`;
          }
          return txt;
        };

        try {
          const pUrl = new URL("https://photon.komoot.io/api/");
          pUrl.searchParams.set("q", boostColombia(value));
          pUrl.searchParams.set("limit", String(limit));
          pUrl.searchParams.set("lang", safeLang);
          pUrl.searchParams.set("lat", String(biasLat));
          pUrl.searchParams.set("lon", String(biasLon));

          const res = await fetch(pUrl.toString(), { signal: controller.signal });
          if (!res.ok) {
            const txt = await res.text().catch(() => "");
            console.error("[Photon] HTTP", res.status, res.statusText, txt);
            throw new Error(`Photon ${res.status}`);
          }

          const data = await res.json();
          const mapped =
            (data.features ?? []).map((f: any) => {
              const p = f.properties ?? {};
              const c = f.geometry?.coordinates ?? [];
              const label = buildLabel(p);
              return { label, lat: c[1], lon: c[0], raw: f };
            }) ?? [];

          setHits(mapped);
          setOpen(mapped.length > 0);
          setActiveIndex(-1);
        } catch (err: any) {
          if (err?.name === "AbortError") return;

          console.warn("[Photon] fallo, probando fallback Nominatim…", err?.message);

          try {
            const nUrl = new URL("https://nominatim.openstreetmap.org/search");
            nUrl.searchParams.set("q", value);
            nUrl.searchParams.set("format", "json");
            nUrl.searchParams.set("limit", String(limit));
            nUrl.searchParams.set("accept-language", "es");

            const nRes = await fetch(nUrl.toString(), {
              signal: controller.signal,
              headers: { Accept: "application/json" },
            });
            if (!nRes.ok) {
              const txt = await nRes.text().catch(() => "");
              console.error("[Nominatim] HTTP", nRes.status, nRes.statusText, txt);
              setHits([]);
              setOpen(false);
              return;
            }
            const nData = await nRes.json();
            const mapped = (nData ?? []).map((r: any) => ({
              label: r.display_name,
              lat: r.lat ? Number(r.lat) : undefined,
              lon: r.lon ? Number(r.lon) : undefined,
              raw: r,
            }));
            setHits(mapped);
            setOpen(mapped.length > 0);
            setActiveIndex(-1);
          } catch (e) {
            console.error("[Fallback Nominatim] error:", e);
            setHits([]);
            setOpen(false);
          }
        } finally {
          setLoading(false);
        }
      }, 300);
    };
  }, [lang, limit, biasLat, biasLon]);

  function buildLabel(p: any) {
    const parts = [
      [p.name || "", p.housenumber || ""].filter(Boolean).join(" "),
      p.street,
      p.suburb,
      p.city || p.town || p.village,
      p.state,
      p.country,
    ].filter(Boolean);
    const dedup = parts.filter((x, i, arr) => x && x !== arr[i - 1]);
    return dedup.join(", ");
  }

  const choose = (place: { label: string; lat?: number; lon?: number }) => {
    setQuery(place.label);
    setCoords({
      lat: place.lat != null ? String(place.lat) : "",
      lon: place.lon != null ? String(place.lon) : "",
    });
    setOpen(false);
    setActiveIndex(-1);
  };

  return (
    <div ref={rootRef}>
      <input
        id={id}
        name={name}
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          debouncedSearch(e.target.value);
        }}
        onFocus={() => hits.length && setOpen(true)}
        onKeyDown={(e) => {
          if (!open) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((i) => Math.min(i + 1, hits.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter") {
            if (activeIndex >= 0 && activeIndex < hits.length) {
              e.preventDefault();
              choose(hits[activeIndex]);
            }
          } else if (e.key === "Escape") {
            setOpen(false);
            setActiveIndex(-1);
          }
        }}
        style={{ width: "100%" }}
      />

      {open && (
        <ul
          role="listbox"
          style={{
            position: "absolute",
            zIndex: 50,
            top: "100%",
            left: 0,
            right: 0,
            maxHeight: 260,
            overflowY: "auto",
            background: "white",
            border: "1px solid #ddd",
            borderRadius: 6,
            marginTop: 6,
            boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
          }}
        >
          {loading && (
            <li style={{ padding: "8px 12px", fontSize: 13, color: "#666" }}>
              Buscando…
            </li>
          )}
          {!loading && hits.length === 0 && (
            <li style={{ padding: "8px 12px", fontSize: 13, color: "#666" }}>
              Sin resultados
            </li>
          )}
          {!loading &&
            hits.map((h, i) => (
              <li
                key={`${h.lat}-${h.lon}-${i}`}
                role="option"
                aria-selected={i === activeIndex}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(h)}
                style={{
                  padding: "8px 12px",
                  cursor: "pointer",
                  background: i === activeIndex ? "#f5f5f5" : "white",
                }}
              >
                <div style={{ fontSize: 14 }}>{h.label}</div>
                {h.lat != null && h.lon != null && (
                  <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                    {h.lat.toFixed(6)}, {h.lon.toFixed(6)}
                  </div>
                )}
              </li>
            ))}
        </ul>
      )}

      <input type="hidden" name="lat" value={coords.lat} />
      <input type="hidden" name="lon" value={coords.lon} />
    </div>
  );
}

function RegisterForm({ role }: RegisterFormProps) {
  console.log("Role:", role);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    // Solo mayores de 16 años
    const birth = String(fd.get("birth") ?? "").trim();
    const minimo = new Date();
    minimo.setFullYear(minimo.getFullYear() - 16);
    if (new Date(birth) > minimo) {
      alert("Debes ser mayor de 16 años para registrarte");
      return;
    }

    // Verificación de contraseñas iguales
    const password = String(fd.get("pass") ?? "");
    const password2 = String(fd.get("pass2") ?? "");
    if (password !== password2) {
      alert("Las contraseñas no coinciden");
      return;
    }

    // Recolectar datos
    const name = String(fd.get("name") ?? "").trim();
    const tipoDoc = String(fd.get("tipoDoc") ?? "").trim();
    const documento = String(fd.get("documento") ?? "").trim();
    const identification = tipoDoc + "-" + documento;
    const email = String(fd.get("mail") ?? "").trim();

    const address = String(fd.get("address") ?? "").trim();
    const roleValue = String(fd.get("role") ?? "Client").trim();

    const lonStr = String(fd.get("lon") ?? "").trim();
    const latStr = String(fd.get("lat") ?? "").trim();
    const lon = lonStr ? Number(lonStr) : -74000000;
    const lat = latStr ? Number(latStr) : 4300000;

    const payload = { name, identification, email, password, role: roleValue, lon, lat };

    try {
      const response = await axios.post(url + "/usr/register", payload);
      if (response.status === 201) {
        alert("Usuario registrado con éxito");
        router.push("/login");
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        alert("Error al registrarse: " + error.response.data);
      } else {
        alert("Error al registrarse: " + String(error));
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        width: "100%",
        maxWidth: 420,
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        gap: 10,
        textAlign: "left",
      }}
    >
      <h2 style={{ margin: 0, alignSelf: "center" }}>Registro de Usuario</h2>

      <label htmlFor="name">Nombre Completo</label>
      <input
        id="name"
        name="name"
        type="text"
        placeholder="Ej: Tomás Vera"
        required
      />

      <label htmlFor="tipoDoc">Tipo de documento</label>
      <select id="tipoDoc" name="tipoDoc" defaultValue="cc" required>
        <option value="cc">Cédula de ciudadanía</option>
        <option value="ce">Cédula de extranjería</option>
        <option value="ti">Tarjeta de identidad</option>
        <option value="pp">Pasaporte</option>
      </select>

      <label htmlFor="documento">Documento</label>
      <input
        id="documento"
        name="documento"
        type="number"
        placeholder="Ej: 1234567890"
        required
      />

      <label htmlFor="pass">Contraseña</label>
      <input
        id="pass"
        name="pass"
        type="password"
        placeholder="Con caracteres especiales y mayúsculas"
        required
        autoComplete="new-password"
        minLength={8}
      />
      <input
        id="pass2"
        name="pass2"
        type="password"
        placeholder="Confirma tu contraseña"
        required
        autoComplete="new-password"
        minLength={8}
      />

      <label htmlFor="mail">Correo</label>
      <input
        id="mail"
        name="mail"
        type="email"
        placeholder="Ej: tomasvera@correo.com"
        required
      />

      <label htmlFor="birth">Fecha de Nacimiento</label>
      <input id="birth" name="birth" type="date" required />

      <label htmlFor="address">Ubicación</label>
      <AddressAutocompleteInput
        id="address"
        name="address"
        placeholder="Ej: Calle 45 #8-14"
        lang="es"
        biasLat={4.7110}
        biasLon={-74.0721}
      />

      {role === "Admin" && (
        <>
          <label htmlFor="role">Rol</label>
          <select id="role" name="role">
            <option value="Client">Cliente</option>
            <option value="Worker">Empleado</option>
            <option value="Admin">Administrador</option>
          </select>
        </>
      )}

      <button type="submit">Registrar</button>

      <div style={{ marginTop: 6, alignSelf: "center" }}>
        <Link
          href="/login"
          style={{ color: "gray", textDecoration: "underline" }}
        >
          ¿Ya tienes un usuario?
        </Link>
      </div>
    </form>
  );
}

export default RegisterForm;
