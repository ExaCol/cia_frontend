/*
 Developed by Tomás Vera & Luis Romero
 Version 1.5
 Client Service Detail (tabla + botones abajo)
*/
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import ServicePayButton from "@/components/ServicePayButton";
import ServiceCancelButton from "@/components/ServiceCancelButton";
import { formatCOP } from "@/lib/format";

/** ============== Helpers de auth ============== */
function extractJWT(anyVal: any): string | null {
  if (typeof anyVal === "string" && anyVal.split(".").length === 3) return anyVal;
  if (anyVal?.token && typeof anyVal.token === "string" && anyVal.token.split(".").length === 3) return anyVal.token;
  if (anyVal?.data?.token && typeof anyVal.data.token === "string" && anyVal.data.token.split(".").length === 3) return anyVal.data.token;
  if (anyVal?.backendToken && typeof anyVal.backendToken === "string" && anyVal.backendToken.split(".").length === 3) return anyVal.backendToken;
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

/** ============== Helpers UI ============== */
function statusPillClass(status: string) {
  const s = String(status ?? "").toUpperCase();
  if (s === "CANCELLED" || s === "CANCELED") return "border-red-300 text-red-700 bg-red-50";
  if (s === "COMPLETED" || s === "FINISHED" || s === "PAID") return "border-green-300 text-green-700 bg-green-50";
  if (["PENDING", "CREATED", "EN_PROCESO", "SOLICITADO"].includes(s)) return "border-amber-300 text-amber-700 bg-amber-50";
  return "border-slate-300 text-slate-700 bg-slate-50";
}

function fmtDate(d: any) {
  if (!d) return "-";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return String(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${hh}:${mm}`;
}

/** ============== Fetch + normalización ============== */
async function fetchServiceById(id: string) {
  const jwt = await getBackendJWTViaApiRoute();
  const base = process.env.NEXT_PUBLIC_URL?.replace(/\/+$/, "") || "http://localhost:8080";

  // Intento directo
  let res = await fetch(`${base}/services/${id}`, {
    headers: { Authorization: `Bearer ${jwt}` },
    cache: "no-store",
  });

  // Fallback a /byUser si no existe endpoint por id
  if (res.status === 404 || res.status === 400) {
    const res2 = await fetch(`${base}/services/byUser`, {
      headers: { Authorization: `Bearer ${jwt}` },
      cache: "no-store",
    });
    if (!res2.ok) throw new Error(`Error ${res2.status}`);
    const arr = await res2.json().catch(() => []);
    const found = Array.isArray(arr) ? arr.find((x: any) => String(x?.id) === String(id)) : null;
    if (!found) return null;
    return normalizeService(found);
  }

  if (!res.ok) throw new Error(`Error ${res.status}`);
  const data = await res.json().catch(() => null);
  if (!data) return null;
  return normalizeService(data);
}

function normalizeService(s: any) {
  if (!s || typeof s !== "object") return null;

  const price = Number(
    s?.price ?? s?.amount ?? s?.total ?? s?.totalAmount ?? s?.value ?? s?.cost ?? 0
  );

  return {
    ...s,
    id: s?.id ?? s?.serviceId ?? null,
    name: s?.name ?? s?.title ?? s?.serviceName ?? null,
    serviceType: s?.serviceType ?? s?.type ?? null,
    plate: s?.plate ?? s?.vehiclePlate ?? s?.carPlate ?? null,
    status: s?.status ?? s?.state ?? null,
    assurance: s?.assurance ?? s?.insurer ?? s?.provider ?? null,
    duration: s?.duration ?? s?.months ?? s?.term ?? null,
    courseType: s?.courseType ?? s?.category ?? null,
    exp_date: s?.exp_date ?? s?.expDate ?? s?.expirationDate ?? null,
    createdAt: s?.createdAt ?? s?.created_at ?? null,
    updatedAt: s?.updatedAt ?? s?.updated_at ?? null,
    price,
  };
}

/** ============== Page ============== */
type Props = { params: Promise<{ id: string }> };

export default async function ServiceDetailPage({ params }: Props) {
  const { id } = await params; // Next 15: params es Promise
  const service = await fetchServiceById(id).catch(() => null);
  if (!service) notFound();

  const s = String(service.status ?? "").toUpperCase();
  const showPay = !["COMPLETED", "FINISHED", "PAID", "CANCELLED", "CANCELED"].includes(s);

  return (
    <div className="max-w-5xl mx-auto space-y-8 px-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <h2 className="text-2xl font-semibold tracking-tight">Servicio #{service.id}</h2>
          <div className="text-sm text-slate-600">
            {service.name ?? service.serviceType ?? "Servicio"}
            {service.courseType ? (
              <span className="ml-2 rounded-full border bg-slate-50 px-2 py-0.5 text-xs text-slate-700">
                {service.courseType}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${statusPillClass(service.status)}`}>
            {service.status ?? "-"}
          </span>
          <Link href="/client/services">
            <button className="appearance-none rounded-xl border px-3 py-2 text-xs hover:bg-black/5 transition">
              Volver
            </button>
          </Link>
        </div>
      </div>

      {/* =================== Detalle en TABLA =================== */}
      <section className="rounded-2xl border shadow-sm bg-white">
        <header className="px-6 py-4 border-b">
          <h3 className="text-sm font-semibold tracking-wide text-slate-700">Detalle del servicio</h3>
        </header>

        <div className="overflow-x-auto border-slate-200 rounded-xl">
          <table className="w-full text-sm border-separate border-spacing-0">
            <tbody>
              <tr className="border-b border-slate-200">
                <th className="w-56 bg-slate-50 px-4 py-3 text-left font-medium text-slate-600 rounded-tl-xl">Tipo</th>
                <td className="px-4 py-3 rounded-tr-xl">{service.serviceType ?? "-"}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <th className="bg-slate-50 px-4 py-3 text-left font-medium text-slate-600">Placa</th>
                <td className="px-4 py-3">{service.plate ?? "-"}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <th className="bg-slate-50 px-4 py-3 text-left font-medium text-slate-600">Precio</th>
                <td className="px-4 py-3">
                  <span className="text-base font-semibold">{formatCOP(service.price)}</span>
                </td>
              </tr>
              <tr className="border-b border-slate-200">
                <th className="bg-slate-50 px-4 py-3 text-left font-medium text-slate-600">Expira</th>
                <td className="px-4 py-3">{fmtDate(service.exp_date)}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <th className="bg-slate-50 px-4 py-3 text-left font-medium text-slate-600">Aseguradora</th>
                <td className="px-4 py-3">{service.assurance ?? "-"}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <th className="bg-slate-50 px-4 py-3 text-left font-medium text-slate-600">Duración</th>
                <td className="px-4 py-3">{service.duration ?? "-"}</td>
              </tr>
              {service.courseType ? (
                <tr className="border-b border-slate-200">
                  <th className="bg-slate-50 px-4 py-3 text-left font-medium text-slate-600">Tipo de curso</th>
                  <td className="px-4 py-3">{service.courseType}</td>
                </tr>
              ) : null}
              <tr>
                <th className="bg-slate-50 px-4 py-3 text-left font-medium text-slate-600 rounded-bl-xl">Estado</th>
                <td className="px-4 py-3 rounded-br-xl">
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${statusPillClass(service.status)}`}>
                    {service.status ?? "-"}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Botones debajo de la tabla */}
        <footer className="flex items-center justify-end gap-2 px-6 py-4 border-t">
          <Link href="/client/services">
            <button className="appearance-none rounded-xl border px-4 py-2 text-sm hover:bg-black/5 transition">
              Volver
            </button>
          </Link>
          {showPay && (
            <ServicePayButton
              serviceId={Number(service.id)}
              label="Pagar ahora"
              className="h-10 justify-center text-sm bg-indigo-600 text-white hover:bg-indigo-500 border-indigo-600"
            />
          )}
          <ServiceCancelButton service={service} />
        </footer>
      </section>

      {/* =================== Trazabilidad en TABLA =================== */}
      <section className="rounded-2xl border shadow-sm bg-white">
        <header className="px-6 py-4 border-b">
          <h3 className="text-sm font-semibold tracking-wide text-slate-700">Trazabilidad</h3>
        </header>

        <div className="overflow-x-auto border-slate-200 rounded-xl">
          <table className="w-full text-sm border-separate border-spacing-0">
            <tbody>
              <tr className="border-b border-slate-200">
                <th className="w-56 bg-slate-50 px-4 py-3 text-left font-medium text-slate-600 rounded-tl-xl">Creado</th>
                <td className="px-4 py-3 rounded-tr-xl">{fmtDate(service.createdAt)}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <th className="bg-slate-50 px-4 py-3 text-left font-medium text-slate-600">Actualizado</th>
                <td className="px-4 py-3">{fmtDate(service.updatedAt)}</td>
              </tr>
              <tr>
                <th className="bg-slate-50 px-4 py-3 text-left font-medium text-slate-600 rounded-bl-xl">Vigencia</th>
                <td className="px-4 py-3 rounded-br-xl">{service.duration ?? "-"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
