/*
 Developed by Tomás Vera & Luis Romero
 Version 1.3
 Payments: listado simple sin links ni columnas extra
*/

import { cookies } from "next/headers";
import { formatCOP } from "@/lib/format";

/* ==================== AUTH HELPERS ==================== */
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
  const r = await fetch(`${site}/api/auth/token`, { headers: { Cookie: cookieHeader }, cache: "no-store" });
  if (!r.ok) throw new Error("Sesión expirada. Inicia sesión nuevamente.");
  const data = await r.json().catch(() => ({}));
  const jwt = extractJWT(data);
  if (!jwt) throw new Error("Token inválido recibido de /api/auth/token");
  return jwt;
}

/* ==================== FETCH + NORMALIZACIÓN ==================== */
type Payment = {
  id: string | number;
  amount: number;
  status: string | null;        // pending | approved | canceled | ...
  serviceId: string | number | null;
  serviceName: string | null;   // “Curso de Conducción …” o “Servicio #…”
};

function normalizePayment(p: any): Payment {
  const amount = Number(p?.amount ?? p?.total ?? p?.value ?? p?.price ?? 0);
  const status = (p?.status ?? p?.state ?? p?.payment_status ?? null) as string | null;
  const sid = p?.serviceId ?? p?.service_id ?? p?.service?.id ?? null;
  const sname = p?.serviceName ?? p?.service?.name ?? p?.description ?? (sid ? `Servicio #${sid}` : "Servicio");
  return {
    id: p?.id ?? p?.paymentId ?? p?.code ?? p?.uuid ?? `${sid ?? "NA"}-${amount}-${status ?? "NA"}`,
    amount,
    status,
    serviceId: sid,
    serviceName: sname,
  };
}

async function getPayments(): Promise<Payment[]> {
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
  const list = Array.isArray(data) ? data : (Array.isArray((data as any)?.content) ? (data as any).content : []);
  const norm = list.map(normalizePayment);

  // Deduplicar por id; si faltara, por (serviceId-amount-status)
  const seen = new Set<string>();
  const uniq: Payment[] = [];
  for (const p of norm) {
    const key = String(p.id ?? `${p.serviceId}-${p.amount}-${p.status ?? "NA"}`);
    if (seen.has(key)) continue;
    seen.add(key);
    uniq.push(p);
  }

  return uniq;
}

/* ==================== UI HELPERS ==================== */
function statusForDisplay(status: string | null) {
  const s = String(status ?? "").toUpperCase();
  if (["CANCELLED", "CANCELED", "CANCELADO"].includes(s)) return "cancelado";
  if (["APPROVED", "PAID", "COMPLETED", "SUCCESS", "FINISHED"].includes(s)) return "pagado";
  if (["PENDING", "IN_PROCESS", "CREATED", "EN_PROCESO", "SOLICITADO"].includes(s)) return "pendiente";
  return "—";
}


/* ==================== PAGE ==================== */
export default async function PaymentsPage() {
  let payments: Payment[] = [];
  let error: string | null = null;

  try {
    payments = await getPayments();
  } catch (e: any) {
    error = e?.message ?? "No se pudo cargar el historial de pagos";
  }

  return (
    <div className="space-y-6">
      <h2>Pagos</h2>

      {error ? (
        <p>{error}</p>
      ) : payments.length === 0 ? (
        <p>No hay pagos registrados.</p>
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead className="bg-slate-50">
              <tr>
                <th className="py-3 pl-4 pr-3 text-left font-semibold border-b border-slate-200">Concepto</th>
                <th className="py-3 px-3 text-left font-semibold border-b border-slate-200">Monto</th>
                <th className="py-3 px-3 text-left font-semibold border-b border-slate-200">Estado</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr
                  key={String(p.id)}
                  className="border-b border-slate-100 odd:bg-white even:bg-slate-50/60 hover:bg-indigo-50/40 transition-colors"
                >
                  {/* Concepto: sin link a detalle */}
                  <td className="py-3 pl-4 pr-3">{p.serviceName ?? (p.serviceId ? `Servicio #${p.serviceId}` : "Servicio")}</td>

                  {/* Monto */}
                  <td className="py-3 px-3 font-medium">{formatCOP(p.amount)}</td>

                  {/* Estado: solo si está cancelado, si no “—” */}
                  <td className="py-3 px-3">{statusForDisplay(p.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
