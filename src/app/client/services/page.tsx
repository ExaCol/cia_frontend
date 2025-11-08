/*
Developed by Tomás Vera & Luis Romero
Version 2.2
Client Services List (sin columna Detalle)
*/

import Link from "next/link";
import { cookies } from "next/headers";
import "@/styles/globals.css";
import ServiceCancelButton from "@/components/ServiceCancelButton";
import ServicePayButton from "@/components/ServicePayButton";
import { formatCOP } from "@/lib/format";
import AutoRefreshOnFocus from "@/components/AutoRefreshOnFocus";


/** ==================== Helpers Auth ==================== */
function extractJWT(anyVal: any): string | null {
  if (typeof anyVal === "string" && anyVal.split(".").length === 3) return anyVal;
  if (anyVal?.token && typeof anyVal.token === "string" && anyVal.token.split(".").length === 3) return anyVal.token;
  if (anyVal?.data?.token && typeof anyVal.data.token === "string" && anyVal.data.token.split(".").length === 3) return anyVal.data.token;
  if (anyVal?.backendToken && typeof anyVal.backendToken === "string" && anyVal.backendToken.split(".").length === 3) return anyVal.backendToken;
  return null;
}

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

async function getBackendJWTViaApiRoute(): Promise<string> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
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

/** ==================== Fetch servicios + cursos ==================== */
async function getServices(): Promise<any[]> {
  const jwt = await getBackendJWTViaApiRoute();
  const base = process.env.NEXT_PUBLIC_URL?.replace(/\/+$/, "") ?? "http://localhost:8080";

  // 1) Servicios del usuario
  const resServices = await fetch(`${base}/services/byUser`, {
    headers: { Authorization: `Bearer ${jwt}` },
    cache: "no-store",
  });

  let servicesList: any[] = [];
  if (resServices.ok) {
    try {
      const list = await resServices.json();
      servicesList = Array.isArray(list) ? list : [];
    } catch {
      servicesList = [];
    }
  } else if (resServices.status !== 400) {
    const text = await resServices.text().catch(() => "");
    try {
      const j = JSON.parse(text);
      throw new Error(j?.message || j?.error || text || `Error ${resServices.status}`);
    } catch {
      throw new Error(text || `Error ${resServices.status}`);
    }
  }

  // 2) Cursos inscritos del usuario
  let coursesList: any[] = [];
  try {
    const resCourses = await fetch(`${base}/usr/courseByUser`, {
      headers: { Authorization: `Bearer ${jwt}` },
      cache: "no-store",
    });
    if (resCourses.ok) {
      const raw = await resCourses.json().catch(() => []);
      coursesList = Array.isArray(raw)
        ? raw
        : (Array.isArray((raw as any)?.content) ? (raw as any).content : []);
    }
  } catch {
    coursesList = [];
  }

  // 3) Normalizar servicios
  const services = servicesList.map((s: any) => ({
    ...s,
    exp_date: s?.exp_date ?? s?.expDate ?? s?.expirationDate ?? null,
    assurance: s?.assurance ?? s?.insurer ?? s?.provider ?? null,
    duration: s?.duration ?? s?.months ?? s?.term ?? null,
    status: s?.status ?? s?.state ?? null,
    price: Number(
      s?.price ?? s?.amount ?? s?.total ?? s?.totalAmount ?? s?.value ?? s?.cost ?? 0
    ),
    isCourseOnly: false,
  }));

  // 4) Normalizar cursos como “pseudo-servicio”
  const courseRows = coursesList.map((c: any) => ({
    id: `course-${(c?.id ?? c?.courseId ?? "") || cryptoRandomId()}`,
    courseId: c?.id ?? c?.courseId ?? null,
    serviceType: c?.type ?? c?.courseType ?? "COURSE",
    plate: "-",
    status: c?.status ?? c?.state ?? "INSCRITO",
    price: Number(c?.price ?? c?.amount ?? 0),
    exp_date: null,
    assurance: null,
    duration: c?.duration ?? c?.months ?? null,
    graduated: c?.graduated ?? false,
    isCourseOnly: true,
    courseName: c?.name ?? c?.courseName ?? null,
  }));

  // 5) Deduplicación (si ya hay un servicio COURSE del mismo tipo, ocultar pseudo-curso)
  const existingCourseTypes = new Set<string>();
  for (const s of services) {
    const isCourseService = String(s?.serviceType ?? "").toUpperCase().startsWith("COURSE");
    if (isCourseService) {
      const t =
        normalizeCourseType(s?.courseType) ||
        normalizeCourseType(s?.serviceType) ||
        normalizeCourseType(s?.name);
      if (t) existingCourseTypes.add(t);
    }
  }
  const filteredCourseRows = courseRows.filter((c: any) => {
    const t =
      normalizeCourseType(c?.serviceType) ||
      normalizeCourseType(c?.courseName) ||
      normalizeCourseType(c?.type);
    return t ? !existingCourseTypes.has(t) : true;
  });

  return [...services, ...filteredCourseRows];
}

// util local para id aleatorio
function cryptoRandomId() {
  try {
    // @ts-ignore
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch {}
  return `rnd-${Math.random().toString(36).slice(2, 10)}`;
}

// ======== lógica de botones ========
function canPay(row: any) {
  if (row?.isCourseOnly) return true;
  const s = String(row?.status ?? "").toUpperCase().trim();
  const closed = ["COMPLETED", "FINISHED", "PAID", "PAID_OUT", "CANCELLED", "CANCELED", "CANCELADO"];
  if (!s) return Number(row?.price ?? 0) > 0;
  return !closed.includes(s) && Number(row?.price ?? 0) > 0;
}

function canCancel(row: any) {
  if (row?.isCourseOnly) return false;
  const s = String(row?.status ?? "").toUpperCase().trim();
  const closed = ["COMPLETED", "FINISHED", "PAID", "PAID_OUT", "CANCELLED", "CANCELED", "CANCELADO"];
  if (!s) return true;
  return !closed.includes(s);
}

/** ==================== Page ==================== */
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
      <AutoRefreshOnFocus />
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
        <p>No pudimos cargar tus servicios. Intenta nuevamente.</p>
      ) : services.length === 0 ? (
        <p>No hay servicios todavía.</p>
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="min-w-[760px] w-full text-sm border-separate border-spacing-0">
            <thead className="bg-slate-50">
              <tr>
                <th className="py-3 pl-4 pr-3 text-left font-semibold border-b border-slate-200">ID</th>
                <th className="py-3 px-3 text-left font-semibold border-b border-slate-200">Tipo</th>
                <th className="py-3 px-3 text-left font-semibold border-b border-slate-200">Placa</th>
                <th className="py-3 px-3 text-left font-semibold border-b border-slate-200">Precio</th>
                <th className="py-3 pr-4 pl-3 text-right font-semibold border-b border-slate-200">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {services.map((s: any) => (
                <tr
                  key={s.id}
                  className="border-b border-slate-100 odd:bg-white even:bg-slate-50/60 hover:bg-indigo-50/40 transition-colors"
                >
                  <td className="py-3 pl-4 pr-3">{s.id}</td>

                  <td className="py-3 px-3">
                    {s.serviceType ?? "-"}
                    {s.isCourseOnly && (
                      <span className="ml-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] text-slate-600">
                        CURSO
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3">{s.plate ?? "-"}</td>

                  <td className="py-3 px-3 font-medium">
                    {s.isCourseOnly ? (s.price > 0 ? formatCOP(s.price) : "—") : formatCOP(s.price)}
                  </td>

                  <td className="py-3 pr-4 pl-3">
                    <div className="flex items-center justify-end gap-2">
                      {/* PAGAR */}
                      {canPay(s) &&
                        (s.isCourseOnly ? (
                          <ServicePayButton
                            course={{
                              id: s.courseId,
                              type: s.serviceType || s.courseType,
                              price: s.price,
                            }}
                            label="Pagar"
                          />
                        ) : (
                          <ServicePayButton serviceId={Number(s.id)} />
                        ))}

                      {/* CANCELAR */}
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
