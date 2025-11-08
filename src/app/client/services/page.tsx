/*
Developed by Tomás Vera & Luis Romero
Version 2.3
Client Services List (materializa cursos inscritos -> Service al cargar)
*/

import Link from "next/link";
import { cookies } from "next/headers";
import "@/styles/globals.css";
import ServiceCancelButton from "@/components/ServiceCancelButton";
import ServicePayButton from "@/components/ServicePayButton";
import { formatCOP } from "@/lib/format";

/* ==================== Auth helpers ==================== */
function extractJWT(anyVal: any): string | null {
  if (typeof anyVal === "string" && anyVal.split(".").length === 3) return anyVal;
  if (anyVal?.token && typeof anyVal.token === "string" && anyVal.token.split(".").length === 3) return anyVal.token;
  if (anyVal?.data?.token && typeof anyVal.data.token === "string" && anyVal.data.token.split(".").length === 3) return anyVal.data.token;
  if (anyVal?.backendToken && typeof anyVal.backendToken === "string" && anyVal.backendToken.split(".").length === 3) return anyVal.backendToken;
  return null;
}

async function getBackendJWTViaApiRoute(): Promise<string> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join("; ");
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || "http://localhost:3000";

  const r = await fetch(`${site}/api/auth/token`, {
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  });
  if (!r.ok) throw new Error("Sesión expirada. Inicia sesión nuevamente.");

  const data = await r.json().catch(() => ({}));
  const jwt = extractJWT(data);
  if (!jwt) throw new Error("Token inválido recibido de /api/auth/token");
  return jwt;
}

/* ==================== Normalizadores ==================== */
function normalizeCourseType(input?: string | null): string | null {
  if (!input) return null;
  const s = String(input).toUpperCase();
  const m1 = s.match(/\b([ABC][123])\b/); if (m1) return m1[1];
  const m2 = s.match(/([ABC][123])\s*CURSO/); if (m2) return m2[1];
  const m3 = s.match(/COURSE\S*\s*([ABC][123])/); if (m3) return m3[1];
  const m4 = s.match(/([ABC][123])\s*COURSE/); if (m4) return m4[1];
  const m5 = s.match(/([ABC][123])/); if (m5) return m5[1];
  return null;
}

function cryptoRandomId() {
  try {
    // @ts-ignore
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch {}
  return `rnd-${Math.random().toString(36).slice(2, 10)}`;
}

/* ==================== Fetch + materialización ==================== */
async function fetchServices(jwt: string, base: string) {
  const res = await fetch(`${base}/services/byUser`, {
    headers: { Authorization: `Bearer ${jwt}` },
    cache: "no-store",
  });

  if (!res.ok) {
    if (res.status === 400) return [];
    const text = await res.text().catch(() => "");
    throw new Error(text || `Error ${res.status}`);
  }
  const raw = await res.json().catch(() => []);
  const list = Array.isArray(raw) ? raw : [];
  return list.map((s: any) => ({
    ...s,
    exp_date: s?.exp_date ?? s?.expDate ?? s?.expirationDate ?? null,
    assurance: s?.assurance ?? s?.insurer ?? s?.provider ?? null,
    duration: s?.duration ?? s?.months ?? s?.term ?? null,
    status: s?.status ?? s?.state ?? null,
    price: Number(s?.price ?? s?.amount ?? s?.total ?? s?.totalAmount ?? s?.value ?? s?.cost ?? 0),
    isCourseOnly: false,
  }));
}

async function fetchCourses(jwt: string, base: string) {
  try {
    const res = await fetch(`${base}/usr/courseByUser`, {
      headers: { Authorization: `Bearer ${jwt}` },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const raw = await res.json().catch(() => []);
    const arr = Array.isArray(raw) ? raw : (Array.isArray((raw as any)?.content) ? (raw as any).content : []);
    return arr.map((c: any) => ({
      id: `course-${(c?.id ?? c?.courseId ?? "") || cryptoRandomId()}`,
      courseId: c?.id ?? c?.courseId ?? null,
      serviceType: c?.type ?? c?.courseType ?? "COURSE",
      status: c?.status ?? c?.state ?? "INSCRITO",
      price: Number(c?.price ?? c?.amount ?? 0),
      duration: c?.duration ?? c?.months ?? null,
      graduated: c?.graduated ?? false,
      isCourseOnly: true,
      courseName: c?.name ?? c?.courseName ?? null,
    }));
  } catch {
    return [];
  }
}

/** Crea en backend un Service real a partir de un curso inscrito. */
async function materializeCourseAsService(
  jwt: string,
  base: string,
  courseRow: { courseId: number | string | null; serviceType?: string | null; courseName?: string | null; price?: number | null }
) {
  const inferred =
    normalizeCourseType(courseRow?.serviceType) ||
    normalizeCourseType(courseRow?.courseName);

  // payload mínimo que el backend ya aceptó en el flujo de checkout
  const body = {
    serviceType: "COURSE",
    courseType: inferred,       // A1/B1/B3…
    plate: "-",                 // no aplica (para que no truene si es requerido)
    price: Number(courseRow?.price ?? 0) || undefined,
  };

  const res = await fetch(`${base}/services`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  }).catch(() => null);

  if (!res || !res.ok) return null;
  const data = await res.json().catch(() => null);
  const newId = data?.id ?? data?.serviceId ?? data?.service?.id ?? null;
  return newId ? Number(newId) : null;
}

/**
 * Carga servicios y cursos; si detecta cursos sin Service correspondiente,
 * los materializa (crea Service) y vuelve a cargar servicios. Devuelve SOLO servicios reales.
 */
async function loadServicesEnsuringMaterialization(): Promise<any[]> {
  const jwt = await getBackendJWTViaApiRoute();
  const base = process.env.NEXT_PUBLIC_URL?.replace(/\/+$/, "") ?? "http://localhost:8080";

  // 1) carga actual
  const [services, courseRows] = await Promise.all([fetchServices(jwt, base), fetchCourses(jwt, base)]);

  // Mapa de “tipos de curso” ya cubiertos por un Service real
  const coveredTypes = new Set<string>();
  for (const s of services) {
    const isCourseService = String(s?.serviceType ?? "").toUpperCase().startsWith("COURSE");
    if (!isCourseService) continue;
    const t =
      normalizeCourseType(s?.courseType) ||
      normalizeCourseType(s?.serviceType) ||
      normalizeCourseType(s?.name);
    if (t) coveredTypes.add(t);
  }

  // 2) cursos que NO están cubiertos por un Service → hay que crearlos
  const toCreate = courseRows.filter((c: any) => {
    const t =
      normalizeCourseType(c?.serviceType) ||
      normalizeCourseType(c?.courseName);
    return t ? !coveredTypes.has(t) : true;
  });

  if (toCreate.length === 0) {
    return services; // ya está todo materializado
  }

  // 3) materializar en paralelo (no romper si alguno falla)
  await Promise.all(
    toCreate.map((c: any) =>
      materializeCourseAsService(jwt, base, c).catch(() => null)
    )
  );

  // 4) recargar servicios ya “completos”
  const finalServices = await fetchServices(jwt, base);
  return finalServices;
}

/* ==================== UI helpers ==================== */
function canPay(row: any) {
  // al final de este flujo, todas las filas deberían ser Services reales
  const s = String(row?.status ?? "").toUpperCase().trim();
  const closed = ["COMPLETED", "FINISHED", "PAID", "PAID_OUT", "CANCELLED", "CANCELED", "CANCELADO"];
  if (!s) return Number(row?.price ?? 0) > 0;
  return !closed.includes(s) && Number(row?.price ?? 0) > 0;
}
function canCancel(row: any) {
  const s = String(row?.status ?? "").toUpperCase().trim();
  const closed = ["COMPLETED", "FINISHED", "PAID", "PAID_OUT", "CANCELLED", "CANCELED", "CANCELADO"];
  if (!s) return true;
  return !closed.includes(s);
}

/* ==================== Page ==================== */
export default async function ServicesListPage() {
  let services: any[] = [];
  let error: string | null = null;

  try {
    services = await loadServicesEnsuringMaterialization();
  } catch (e: any) {
    error = e?.message ?? "No se pudo cargar la lista de servicios";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2>Mis servicios</h2>
        <div className="flex gap-2">
          <Link href="/client/services/new">
            <button className="inline-flex items-center rounded-lg px-4 py-2 text-sm border hover:bg-black/5 transition">
              Solicitar servicio
            </button>
          </Link>
        </div>
      </div>

      {error ? (
        <>
          {console.error("Servicios | Error:", error)}
          <p>No pudimos cargar tus servicios. Intenta nuevamente.</p>
        </>
      ) : services.length === 0 ? (
        <p>No hay servicios todavía.</p>
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="min-w-[960px] w-full text-sm border-separate border-spacing-0">
            <thead className="bg-slate-50">
              <tr>
                <th className="py-3 pl-4 pr-3 text-left font-semibold border-b border-slate-200">ID</th>
                <th className="py-3 px-3 text-left font-semibold border-b border-slate-200">Tipo</th>
                <th className="py-3 px-3 text-left font-semibold border-b border-slate-200">Placa</th>
                <th className="py-3 px-3 text-left font-semibold border-b border-slate-200">Precio</th>
                <th className="py-3 px-3 text-left font-semibold border-b border-slate-200">Detalle</th>
                <th className="py-3 pr-4 pl-3 text-right font-semibold border-b border-slate-200">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s: any) => (
                <tr key={s.id} className="border-b border-slate-100 odd:bg-white even:bg-slate-50/60 hover:bg-indigo-50/40 transition-colors">
                  <td className="py-3 pl-4 pr-3">{s.id}</td>
                  <td className="py-3 px-3">{s.serviceType ?? "-"}</td>
                  <td className="py-3 px-3">{s.plate ?? "-"}</td>
                  <td className="py-3 px-3 font-medium">{formatCOP(s.price ?? 0)}</td>
                  <td className="py-3 px-3">
                    <Link href={`/client/services/${s.id}`}>
                      <button className="rounded-lg border px-3 py-1.5 text-xs hover:bg-black/5 transition">
                        Ver
                      </button>
                    </Link>
                  </td>
                  <td className="py-3 pr-4 pl-3">
                    <div className="flex items-center justify-end gap-2">
                      {canPay(s) && <ServicePayButton serviceId={Number(s.id)} />}
                      {canCancel(s) && <ServiceCancelButton service={s} />}
                    </div>
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
