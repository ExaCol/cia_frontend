/*
 Developed by Tomás Vera & Luis Romero
 Version 1.4
 Payments: historial completo (pendientes, pagados, cancelados) sin duplicados visibles
*/
import Link from "next/link";
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

/* ==================== TYPES + NORMALIZACIÓN ==================== */
type Payment = {
  id: string;                 // normalizado a string
  createdAt: string | null;
  amount: number;
  currency: string | null;
  status: string | null;
  serviceId: string | null;   // normalizado a string
  serviceName: string | null;
};

function normalizePayment(p: any): Payment {
  const amount = Number(
    p?.amount ?? p?.total ?? p?.value ?? p?.price ?? p?.transactionAmount ?? 0
  );
  const createdAt =
    p?.createdAt ?? p?.created_at ?? p?.date ?? p?.paymentDate ?? null;

  const rawId = p?.id ?? p?.paymentId ?? p?.code ?? p?.uuid ?? "-";
  const rawServiceId = p?.serviceId ?? p?.service_id ?? p?.service?.id ?? null;

  return {
    id: String(rawId),
    createdAt,
    amount,
    currency: p?.currency ?? p?.currency_id ?? p?.currencyId ?? "COP",
    status: p?.status ?? p?.state ?? p?.payment_status ?? null,
    serviceId: rawServiceId != null ? String(rawServiceId) : null,
    serviceName: p?.serviceName ?? p?.service?.name ?? p?.description ?? null,
  };
}

async function fetchPayments(): Promise<Payment[]> {
  const jwt = await getBackendJWTViaApiRoute();
  const base =
    process.env.NEXT_PUBLIC_URL?.replace(/\/+$/, "") || "http://localhost:8080";

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
  const arr = Array.isArray(data)
    ? data
    : Array.isArray((data as any)?.content)
    ? (data as any).content
    : [];

  return arr.map(normalizePayment);
}

/* ==================== DEDUPE + ORDEN ==================== */
// Queremos ver todas las transacciones, pero eliminar “duplicados” obvios.
// Usamos una clave robusta: id si está, y como fallback un hash del (serviceId|status|amount|createdAt)
function dedupe(payments: Payment[]): Payment[] {
  const seen = new Set<string>();
  const out: Payment[] = [];

  for (const p of payments) {
    const key =
      p.id && p.id !== "-"
        ? `id:${p.id}`
        : `svc:${p.serviceId ?? "null"}|st:${String(p.status ?? "").toUpperCase()}|amt:${p.amount}|ts:${p.createdAt ?? "null"}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }

  // Orden: más recientes primero (si no hay fecha, los dejamos al final)
  out.sort((a, b) => {
    const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
    const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
    return tb - ta;
  });

  return out;
}

function statusLabel(s: string | null): string {
  const u = String(s ?? "").toUpperCase();
  if (["CANCELLED", "CANCELED", "CANCELADO"].includes(u)) return "Cancelado";
  if (["APPROVED", "PAID", "COMPLETED", "SUCCESS", "FINISHED"].includes(u)) return "Pagado";
  if (["PENDING", "IN_PROCESS", "CREATED", "EN_PROCESO", "SOLICITADO"].includes(u)) return "Pendiente";
  return u || "—";
}

/* ==================== PAGE ==================== */
export default async function PaymentsPage() {
  let rows: Payment[] = [];
  let error: string | null = null;

  try {
    const all = await fetchPayments();
    rows = dedupe(all);
  } catch (e: any) {
    error = e?.message ?? "No se pudo cargar los pagos.";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2>Pagos</h2>
      </div>

      {error ? (
        <p>{error}</p>
      ) : rows.length === 0 ? (
        <p>No hay pagos registrados.</p>
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead className="bg-slate-50">
              <tr>
                <th className="py-3 pl-4 pr-3 text-left font-semibold border-b border-slate-200">
                  Concepto
                </th>
                <th className="py-3 px-3 text-left font-semibold border-b border-slate-200">
                  Monto
                </th>
                <th className="py-3 px-3 text-left font-semibold border-b border-slate-200">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr
                  key={p.id + "|" + (p.createdAt ?? "")}
                  className="border-b border-slate-100 odd:bg-white even:bg-slate-50/60 hover:bg-indigo-50/40 transition-colors"
                >
                  <td className="py-3 pl-4 pr-3">
                    {p.serviceId ? (
                      <Link
                        className="text-indigo-600 hover:underline"
                        href={`/client/services/${p.serviceId}`}
                      >
                        {p.serviceName ?? `Servicio #${p.serviceId}`}
                      </Link>
                    ) : (
                      p.serviceName ?? "Servicio"
                    )}
                  </td>
                  <td className="py-3 px-3 font-medium">
                    {formatCOP(p.amount)}
                    {p.currency && p.currency !== "COP" ? ` ${p.currency}` : ""}
                  </td>
                  <td className="py-3 px-3">{statusLabel(p.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
