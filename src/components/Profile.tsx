/*
Developed by Tomás Vera & Luis Romero
Version 1.0
Profile Component (single file)
*/

import React, { useEffect, useState } from "react";
import axios from "axios";

// ====== Tipos locales (sin contraseña) ======
type Vehicle = {
  id: number;
  type: string;
  plate: string;
  soatRateType: string;
  technoClassification: string;
  soatExpiration: string;   // ISO date
  technoExpiration: string; // ISO date
};

type UserProfile = {
  id: number;
  name: string;
  identification: string;
  email: string;
  role: string;
  lon: number;
  lat: number;
  vehicles: Vehicle[];
};

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_URL,
  timeout: 10000,
});

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString();
  } catch {
    return iso;
  }
}

export default function Profile() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const tokenRes = await axios.get("/api/auth/token");
        const jwt = tokenRes.data;
        if (!jwt) throw new Error("No se obtuvo token");
        const userRes = await api.get<UserProfile>("/usr/user", {
          headers: { Authorization: `Bearer ${jwt}` },
        });

        if (mounted) setUser(userRes.data);
      } catch (e: any) {
        console.error("Error obteniendo el perfil:", e);
        if (mounted) setError(e?.message ?? "Error obteniendo el perfil");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <p>Cargando perfil…</p>;
  if (error)   return <p>Error: {error}</p>;
  if (!user)   return <p>Sin datos</p>;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto"}}>
      <section style={{ marginBottom: 16 }}>
        <p><b>Nombre:</b> {user.name}</p>
        <p><b>Identificación:</b> {user.identification}</p>
        <p><b>Email:</b> {user.email}</p>
        <p><b>Rol:</b> {user.role}</p>
        <p><b>Lat/Lon:</b> {user.lat} / {user.lon}</p>
      </section>

      <h3>Vehículos</h3>
      {user.vehicles?.length ? (
        <ul>
          {user.vehicles.map((v) => (
            <li key={v.id} style={{ marginBottom: 8 }}>
              <div><b>{v.type}</b> · {v.plate}</div>
              <div>SOAT ({v.soatRateType}) vence: {formatDate(v.soatExpiration)}</div>
              <div>Tecnomecánica ({v.technoClassification}) vence: {formatDate(v.technoExpiration)}</div>
            </li>
          ))}
        </ul>
      ) : (
        <p>No tiene vehículos registrados.</p>
      )}
    </div>
  );
}
