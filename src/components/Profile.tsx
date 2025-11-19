/*
Developed by Tomás Vera & Luis Romero
Version 1.0
Profile Component
*/

import React, { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
type Vehicle = {
  id: number;
  type: string;
  plate: string;
  soatRateType: string;
  model: string;
  soatExpiration: string;
  technoExpiration: string;
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

function formatDate(s: string) {
  const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (ymd) {
    const [, y, m, d] = ymd;
    return `${y}-${m}-${d}`;
  }

  const dmy = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s.trim());
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m}-${d}`;
  }

  const d = new Date(s);
  if (isNaN(d.getTime())) return s;

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}



interface RegisterFormProps {
  role: string;
}

export default function Profile({ role }: RegisterFormProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        if (e.response.status == 401) {
          setError("Expiró su sesión, cerrando sesión...");
          axios.post("/api/auth/logout").finally(() => {
            window.location.href = "/";
          });
        } else {
          setError(e?.message ?? "Error obteniendo el perfil");
        }
        console.error("Error obteniendo el perfil:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <p>Cargando perfil…</p>;
  if (error) return <p>Error: {error}</p>;
  if (!user) return <p>Sin datos</p>;

  const handleDeleteVehicle = (vehiclePlate: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este vehículo?")) {
      return;
    }
    axios
      .get("/api/auth/token")
      .then(async (response: any) => {
        const token = response.data;
        axios
          .delete(
            process.env.NEXT_PUBLIC_URL + `/vehicle/byPlate/${vehiclePlate}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )
          .then((res: any) => {
            if (res.status === 200) {
              alert("Vehículo eliminado exitosamente.");
              // Actualizar la lista de vehículos en el estado
              setUser((prevUser) => {
                if (!prevUser) return prevUser;
                return {
                  ...prevUser,
                  vehicles: prevUser.vehicles.filter(
                    (v) => v.plate !== vehiclePlate
                  ),
                };
              });
            } else {
              alert(
                "Error al eliminar el vehículo. Por favor, intenta nuevamente."
              );
            }
          })
          .catch((error: any) => {
            console.error("Error al eliminar el vehículo:", error);
            alert("Error al obtener el token. Por favor, intenta nuevamente.");
          });
      })
      .catch((error: any) => {
        console.error("Error al obtener el token:", error);
        alert("Error al obtener el token. Por favor, intenta nuevamente.");
      });
  };

  return (
    <div style={{ margin: "0 auto", marginLeft: 10 }}>
      <section style={{ marginBottom: 16 }}>
        <p>
          <b>Nombre:</b> {user.name}
        </p>

        <p>
          <b>Identificación:</b> {user.identification}
        </p>
        <p>
          <b>Correo Electrónico:</b> {user.email}
        </p>
        <p>
          <b>Rol:</b> {user.role}
        </p>
        <p>
          <Link
            href={`https://www.google.com/maps/search/?api=1&query=${user.lat},${user.lon}`}
            target="_blank"
            style={{ color: "black", textDecoration: "underline" }}
          >
            <b>Ubicación:</b>
          </Link>
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <iframe
            width="800"
            height="300"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_API_KEY}&q=${user.lat},${user.lon}&zoom=15`}
          />
        </div>
      </section>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            alignContent: "center",
          }}
        >
          <div style={{ marginTop: 6, alignSelf: "center" }}>
            <Link href={`/${role.toLowerCase()}/profile/update`}>
              <button>Editar Perfil</button>
            </Link>
          </div>

          <div style={{ marginTop: 6, alignSelf: "center", marginBottom: 10 }}>
            <Link
              href={`/${role.toLowerCase()}/profile/update-password`}
              style={{ color: "gray", textDecoration: "underline" }}
            >
              ¿Quieres actualizar tu contraseña?
            </Link>
          </div>
        </div>
      </div>

      {role === "client" && (
        <>
          <hr></hr>
          <h3>Vehículos</h3>
          {user.vehicles?.length ? (
            <div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "0.5fr 0.5fr 0.6fr 0.5fr 0.3fr",
                  gap: "2px 2px",
                  fontWeight: 600,
                  marginBottom: 2,
                }}
              >
                <div>Tipo / Placa</div>
                <div>Modelo</div>
                <div>SOAT (tipo)</div>
                <div>Vencimientos</div>
                <div>Acciones</div>
              </div>

              {/* Filas */}
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {user.vehicles.map((v) => (
                  <li
                    key={v.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.0fr 1fr 1.2fr 1.2fr 0.8fr",
                      gap: "8px 12px",
                      alignItems: "center",
                      padding: "8px 0",
                    }}
                  >
                    <div>
                      <b>{v.type}</b> · {v.plate}
                    </div>
                    <div>{v.model}</div>
                    <div>SOAT ({v.soatRateType})</div>
                    <div>
                      SOAT: {formatDate(v.soatExpiration)} · Tecno:{" "}
                      {formatDate(v.technoExpiration)}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => handleDeleteVehicle(v.plate)}>
                        Eliminar
                      </button>
                      <Link
                        href={`/client/update-vehicle/?plate=${v.plate}&soatExpiration=${formatDate(v.soatExpiration)}&technoExpiration=${formatDate(v.technoExpiration)}&id=${v.id}`}
                      >
                        <button>Editar</button>
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p>No tiene vehículos registrados.</p>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Link href="/client/register-vehicle">
              <button>Registrar Vehículo</button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
