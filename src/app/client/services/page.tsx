/*
Developed by Tomás Vera & Luis Romero
Version 1.1
Client Services List
*/
import Link from "next/link";
import { cookies } from "next/headers";
import "@/styles/globals.css";
import ServiceCancelButton from "@/components/ServiceCancelButton";

/** Extrae un JWT de diferentes envolturas */
function extractJWT(anyVal: any): string | null {
  if (typeof anyVal === "string" && anyVal.split(".").length === 3) return anyVal;
  if (anyVal?.token && typeof anyVal.token === "string" && anyVal.token.split(".").length === 3) return anyVal.token;
  if (anyVal?.data?.token && typeof anyVal.data.token === "string" && anyVal.data.token.split(".").length === 3) return anyVal.data.token;
  if (anyVal?.backendToken && typeof anyVal.backendToken === "string" && anyVal.backendToken.split(".").length === 3) return anyVal.backendToken;
  return null;
}

/** Obtiene el token del BACKEND pidiendo a /api/auth/token (flujo oficial del proyecto) */
async function getBackendJWTViaApiRoute(): Promise<string> {
  // Reenvía todas las cookies del user al API Route, para que obtenga el token correcto
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");

  const site =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || "http://localhost:3000";

  const r = await fetch(`${site}/api/auth/token`, {
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  });

  if (!r.ok) {
    throw new Error("Sesión expirada. Inicia sesión nuevamente.");
  }

  const data = await r.json().catch(() => ({}));
  const jwt = extractJWT(data);
  if (!jwt) throw new Error("Token inválido recibido de /api/auth/token");
  return jwt;
}

async function getServices(): Promise<any[]> {
  const jwt = await getBackendJWTViaApiRoute();

  const base =
    process.env.NEXT_PUBLIC_URL?.replace(/\/+$/, "") ?? "http://localhost:8080";

  const res = await fetch(`${base}/services/byUser`, {
    headers: { Authorization: `Bearer ${jwt}` },
    cache: "no-store",
  });

  // Manejo de errores del backend (intenta mostrar mensaje claro)
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    try {
      const j = JSON.parse(text);
      throw new Error(j?.message || j?.error || text || `Error ${res.status}`);
    } catch {
      throw new Error(text || `Error ${res.status}`);
    }
  }

  // Caso especial 200 con texto "No hay servicios..."
  try {
    const list = await res.json();
    return Array.isArray(list) ? list : [];
  } catch {
    // Si el back devuelve texto plano sin JSON
    return [];
  }
}

export default async function ServicesListPage() {
  let services: any[] = [];
  let error: string | null = null;

  try {
    services = await getServices();
  } catch (e: any) {
    error = e?.message ?? "No se pudo cargar la lista de servicios";
  }

  return (
    <div>
      <h2>Mis servicios</h2>

      <div style={{ margin: "12px 0" }}>
        <Link href="/client/services/new">
          <button>Solicitar servicio</button>
        </Link>
      </div>

      {error ? (
        <p>{error}</p>
      ) : services.length === 0 ? (
        <p>No hay servicios todavía.</p>
      ) : (
        <div>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tipo</th>
                <th>Placa</th>
                <th>Expira</th>
                <th>Aseguradora</th>
                <th>Duración</th>
                <th>Graduado</th>
                <th>Detalle</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td>{s.serviceType ?? "-"}</td>
                  <td>{s.plate ?? "-"}</td>
                  <td>{s.exp_date ?? "-"}</td>
                  <td>{s.assurance ?? "-"}</td>
                  <td>{s.duration ?? "-"}</td>
                  <td>{s.graduated ? "Sí" : "No"}</td>
                  <td>
                    <Link href={`/client/services/${s.id}`}>
                      <button>Ver</button>
                    </Link>
                  </td>
                  <td>
                    <ServiceCancelButton serviceId={s.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
