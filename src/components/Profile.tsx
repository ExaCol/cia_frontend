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
  technoClassification: string;
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

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString();
  } catch {
    return iso;
  }
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
        }else{
            setError(e?.message ?? "Error obteniendo el perfil")
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
          .delete(process.env.NEXT_PUBLIC_URL + `/vehicle/byPlate/${vehiclePlate}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          .then((res: any) => {
            if (res.status === 200) {
              alert("Vehículo eliminado exitosamente.");
              // Actualizar la lista de vehículos en el estado
              setUser((prevUser) => {
                if (!prevUser) return prevUser;
                return {
                  ...prevUser,
                  vehicles: prevUser.vehicles.filter((v) => v.plate !== vehiclePlate),
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
            <b>Email:</b> {user.email}
          </p>
          <p>
            <b>Rol:</b> {user.role}
          </p>
          <p>
            <b>Lat/Lon:</b> {user.lat} / {user.lon}
          </p>
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
            <Link href={`/${role.toLowerCase()}/profile/update`}>
              <button>Editar Perfil</button>
            </Link>
            <div style={{ marginTop: 6, alignSelf: "center" }}>
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
            <h3>Vehículos</h3>
            {user.vehicles?.length ? (
              <ul>
                {user.vehicles.map((v) => (
                  <li key={v.id} style={{ marginBottom: 8 }}>
                    <div>
                      <b>{v.type}</b> · {v.plate}
                    </div>
                    <div>
                      SOAT ({v.soatRateType}) vence:{" "}
                      {formatDate(v.soatExpiration)}
                    </div>
                    <div>
                      Tecnomecánica ({v.technoClassification}) vence:{" "}
                      {formatDate(v.technoExpiration)}
                    </div>
                    <button onClick={() => handleDeleteVehicle(v.plate)} >
                      Eliminar
                    </button>
                  </li>
                ))}
              </ul>
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
