/*
  Developed by Tomás Vera & Luis Romero
  Version 1.7
  Historial de pagos mostrando TODOS los campos del JSON oficial.
*/

import { cookies } from "next/headers";
import { formatCOP } from "@/lib/format";
import s from "./PaymentsPage.module.css";

/* ============ Auth helpers ============ */
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
  const r = await fetch(`${site}/api/auth/token`, { headers: { Cookie: cookieHeader }, cache: "no-store" });
  if (!r.ok) throw new Error("Sesión expirada. Inicia sesión nuevamente.");
  const data = await r.json().catch(() => ({}));
  const jwt = extractJWT(data);
  if (!jwt) throw new Error("Token inválido recibido de /api/auth/token");
  return jwt;
}

/* ============ Types + normalización ============ */
// JSON oficial por elemento:
// {
//   "id": 1,
//   "releaseDate": "2025-11-07",
//   "amount": 1500000,
//   "state": "approved",
//   "serviceId": 1,
//   "externalReference": "svc-1-...",
//   "mpPaymentId": 132367672113,
//   "mpStatusDetail": "accredited"
// }

type RawPayment = any;

type Payment = {
  id: string;
  releaseDate: string | null;
  amount: number;
  state: string | null;
  serviceId: string | null;
  externalReference: string | null;
  mpPaymentId: string | null;
  mpStatusDetail: string | null;
};

function normalizePayment(p: RawPayment): Payment {
  return {
    id: String(p?.id ?? "-"),
    releaseDate: p?.releaseDate ?? null,
    amount: Number(p?.amount ?? 0),
    state: p?.state ?? null,
    serviceId: p?.serviceId != null ? String(p.serviceId) : null,
    externalReference: p?.externalReference ?? null,
    mpPaymentId: p?.mpPaymentId != null ? String(p.mpPaymentId) : null,
    mpStatusDetail: p?.mpStatusDetail ?? null,
  };
}

function fmtDateISO(d: string | null) {
  if (!d) return "—";
  const t = Date.parse(d);
  if (Number.isNaN(t)) return String(d);
  const dt = new Date(t);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function statusForDisplay(state: string | null) {
  const s = String(state ?? "").toUpperCase();
  if (["APPROVED", "COMPLETED", "PAID", "SUCCESS", "FINISHED"].includes(s)) return "pagado";
  if (["PENDING", "IN_PROCESS", "CREATED", "EN_PROCESO", "SOLICITADO"].includes(s)) return "pendiente";
  if (["CANCELED", "CANCELLED", "REJECTED", "FAILED"].includes(s)) return "cancelado";
  // fallback: devuelve el state tal cual si no coincide
  return state ?? "—";
}

function statusBadgeClass(label: string) {
  const l = label.toLowerCase();
  if (l === "pagado") return "border-green-300 text-green-700 bg-green-50";
  if (l === "pendiente") return "border-amber-300 text-amber-700 bg-amber-50";
  if (l === "cancelado") return "border-red-300 text-red-700 bg-red-50";
  return "border-slate-300 text-slate-600 bg-white";
}

/* ============ Fetch + dedupe + sort ============ */
async function fetchPayments(): Promise<Payment[]> {
  const jwt = await getBackendJWTViaApiRoute();
  const base = process.env.NEXT_PUBLIC_URL?.replace(/\/+$/, "") || "http://localhost:8080";

  const res = await fetch(`${base}/api/payments/getPayments`, {
    headers: { Authorization: `Bearer ${jwt}` },
    cache: "no-store",
  });

  if (!res.ok) {
    if (res.status === 400 || res.status === 404) return [];
    const text = await res.text().catch(() => "");
    throw new Error(text || `Error ${res.status}`);
  }

  const data = await res.json().catch(() => []);
  const arr: RawPayment[] = Array.isArray(data)
    ? data
    : Array.isArray((data as any)?.content)
    ? (data as any).content
    : [];

  const norm = arr.map(normalizePayment);

  // dedupe por id
  const seen = new Set<string>();
  const uniq: Payment[] = [];
  for (const p of norm) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    uniq.push(p);
  }

  // ordenar por releaseDate desc (sin fecha al final)
  uniq.sort((a, b) => {
    const ta = a.releaseDate ? Date.parse(a.releaseDate) : -1;
    const tb = b.releaseDate ? Date.parse(b.releaseDate) : -1;
    return tb - ta;
  });

  return uniq;
}

/* ============ Page ============ */
export default async function PaymentsPage() {
  let rows: Payment[] = [];
  let error: string | null = null;

  try {
    rows = await fetchPayments();
  } catch (e: any) {
    error = e?.message ?? "No se pudo cargar los pagos.";
  }

  return (
    <div className={s.page}>
      <h2 className={s.title}>Pagos</h2>

      {error ? (
        <p>{error}</p>
      ) : rows.length === 0 ? (
        <p>No hay pagos registrados.</p>
      ) : (
        <div className={s.tableWrapper}>
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead className="bg-slate-50">
              <tr>
                <th className="py-3 pl-4 pr-3 text-left font-semibold border-b border-slate-200">
                  ID
                </th>
                <th className="py-3 px-3 text-left font-semibold border-b border-slate-200">
                  Servicio
                </th>
                <th className="py-3 px-3 text-left font-semibold border-b border-slate-200">
                  Monto
                </th>
                <th className="py-3 px-3 text-left font-semibold border-b border-slate-200">
                  Estado
                </th>
                <th className="py-3 px-3 text-left font-semibold border-b border-slate-200">
                  Fecha
                </th>
                <th className="py-3 px-3 text-left font-semibold border-b border-slate-200">
                  Ref. externa
                </th>
                <th className="py-3 px-3 text-left font-semibold border-b border-slate-200">
                  MP Payment ID
                </th>
                <th className="py-3 px-3 text-left font-semibold border-b border-slate-200">
                  MP Detalle
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const label = statusForDisplay(p.state);
                const cls = statusBadgeClass(label);
                return (
                  <tr
                    key={p.id}
                    className="border-b border-slate-100 odd:bg-white even:bg-slate-50/60 hover:bg-indigo-50/40 transition-colors"
                  >
                    <td className="py-3 pl-4 pr-3">{p.id}</td>
                    <td className="py-3 px-3">
                      {p.serviceId ? `Servicio #${p.serviceId}` : "—"}
                    </td>
                    <td className="py-3 px-3 font-medium">
                      {formatCOP(p.amount)}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${cls}`}
                      >
                        {label}
                      </span>
                    </td>
                    <td className="py-3 px-3">{fmtDateISO(p.releaseDate)}</td>
                    <td className="py-3 px-3">
                      {p.externalReference ?? "—"}
                    </td>
                    <td className="py-3 px-3">{p.mpPaymentId ?? "—"}</td>
                    <td className="py-3 px-3">{p.mpStatusDetail ?? "—"}</td>
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