/*
Developed by Tomás Vera & Luis Romero
Version 1.1
Client Services List
*/
import Link from "next/link";
import { cookies } from "next/headers";
import "@/styles/globals.css";

function extractJWT(anyVal: any): string | null {
  if (typeof anyVal === "string" && anyVal.split(".").length === 3)
    return anyVal;
  if (
    anyVal?.token &&
    typeof anyVal.token === "string" &&
    anyVal.token.split(".").length === 3
  ) {
    return anyVal.token;
  }
  if (
    anyVal?.token?.token &&
    typeof anyVal.token.token === "string" &&
    anyVal.token.token.split(".").length === 3
  ) {
    return anyVal.token.token;
  }
  if (
    typeof anyVal?.backendToken === "string" &&
    anyVal.backendToken.split(".").length === 3
  ) {
    return anyVal.backendToken;
  }
  if (
    typeof anyVal?.data?.token === "string" &&
    anyVal.data.token.split(".").length === 3
  ) {
    return anyVal.data.token;
  }

  return null;
}

async function getBackendJWTFromCookie(): Promise<string | null> {
  const cookieStore = await cookies(); // Next 15: await
  const raw = cookieStore.get("loginToken")?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return extractJWT(parsed);
  } catch {
    return extractJWT(raw);
  }
}

async function getServices(): Promise<any[]> {
  const jwt = await getBackendJWTFromCookie();
  if (!jwt) throw new Error("No se encontró JWT en la cookie de sesión.");

  const base =
    process.env.NEXT_PUBLIC_URL?.replace(/\/+$/, "") ?? "http://localhost:8080";

  const res = await fetch(`${base}/services/byUser`, {
    headers: { Authorization: `Bearer ${jwt}` },
    cache: "no-store",
  });
  if (res.status === 400) {
    const text = await res.text();
    if (text.includes("No hay servicios registrados")) return [];
    throw new Error(text || "Error 400");
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Error ${res.status}`);
  }

  const list = await res.json();
  return Array.isArray(list) ? list : [];
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

      <div>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
