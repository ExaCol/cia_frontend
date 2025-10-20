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

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    try {
      const j = JSON.parse(text);
      throw new Error(j?.message || j?.error || text || `Error ${res.status}`);
    } catch {
      throw new Error(text || `Error ${res.status}`);
    }
  }

  try {
    const list = await res.json();
    return Array.isArray(list) ? list : [];
  } catch {
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2>Mis servicios</h2>
        <div className="flex gap-2">
          <Link href="/client/courses">
            <button className="inline-flex items-center rounded-lg px-4 py-2 text-sm border hover:bg-black/5 transition">
              Mis cursos
            </button>
          </Link>
          <Link href="/client/services/new">
            <button className="inline-flex items-center rounded-lg px-4 py-2 text-sm border hover:bg-black/5 transition">
              Solicitar servicio
            </button>
          </Link>
        </div>
      </div>


      {error ? (
        <p>{error}</p>
      ) : services.length === 0 ? (
        <p>No hay servicios todavía.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[960px] w-full border-separate border-spacing-0 rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-black/5 text-left">
                <th className="py-3 pl-4 pr-3 text-sm font-semibold">ID</th>
                <th className="py-3 px-3 text-sm font-semibold">Tipo</th>
                <th className="py-3 px-3 text-sm font-semibold">Placa</th>
                <th className="py-3 px-3 text-sm font-semibold">Expira</th>
                <th className="py-3 px-3 text-sm font-semibold">Aseguradora</th>
                <th className="py-3 px-3 text-sm font-semibold">Duración</th>
                <th className="py-3 px-3 text-sm font-semibold">Graduado</th>
                <th className="py-3 px-3 text-sm font-semibold">Estado</th>
                <th className="py-3 px-3 text-sm font-semibold">Detalle</th>
                <th className="py-3 pr-4 pl-3 text-sm font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s: any, idx: number) => {
                const status = String(s.status ?? "").toUpperCase();
                const pill =
                  status === "CANCELLED" || status === "CANCELED"
                    ? "border-red-300 text-red-700 bg-red-50"
                    : status === "COMPLETED" || status === "FINISHED"
                      ? "border-green-300 text-green-700 bg-green-50"
                      : status === "PENDING" || status === "CREATED" || status === "EN_PROCESO" || status === "SOLICITADO"
                        ? "border-amber-300 text-amber-700 bg-amber-50"
                        : "border-slate-300 text-slate-700 bg-slate-50";

                return (
                  <tr
                    key={s.id}
                    className={idx % 2 ? "bg-white" : "bg-slate-50/60"}
                  >
                    <td className="py-3 pl-4 pr-3 text-sm">{s.id}</td>
                    <td className="py-3 px-3 text-sm">{s.serviceType ?? "-"}</td>
                    <td className="py-3 px-3 text-sm">{s.plate ?? "-"}</td>
                    <td className="py-3 px-3 text-sm">{s.exp_date ?? "-"}</td>
                    <td className="py-3 px-3 text-sm">{s.assurance ?? "-"}</td>
                    <td className="py-3 px-3 text-sm">{s.duration ?? "-"}</td>
                    <td className="py-3 px-3 text-sm">{s.graduated ? "Sí" : "No"}</td>
                    <td className="py-3 px-3 text-sm">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${pill}`}>
                        {s.status ?? "-"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-sm">
                      <Link href={`/client/services/${s.id}`}>
                        <button className="rounded-lg border px-3 py-1.5 text-xs hover:bg-black/5 transition">
                          Ver
                        </button>
                      </Link>
                    </td>
                    <td className="py-3 pr-4 pl-3 text-sm">
                      <div className="flex items-center justify-end">
                        {/* Siempre permite cancelar: pasa el objeto completo para mostrar tipo/placa en el modal */}
                        <ServiceCancelButton service={s} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
