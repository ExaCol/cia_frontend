/*
 Developed by Tomás Vera & Luis Romero
 Version 1.2
 Payments: historial y pendientes en la misma ruta (/client/payments?tab=...)
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

/* ==================== FETCH + NORMALIZACIÓN ==================== */
type Payment = {
  id: number | string;
  createdAt: string | null;
  amount: number;
  currency: string | null;
  status: string | null;
  method: string | null;
  gateway: string | null;
  serviceId: number | string | null;
  serviceName: string | null;
  receiptUrl?: string | null;
};

function normalizePayment(p: any): Payment {
  const amount = Number(
    p?.amount ?? p?.total ?? p?.value ?? p?.price ?? p?.transactionAmount ?? 0
  );
  const createdAt = p?.createdAt ?? p?.created_at ?? p?.date ?? p?.paymentDate ?? null;

  return {
    id: p?.id ?? p?.paymentId ?? p?.code ?? p?.uuid ?? "-",
    createdAt,
    amount,
    currency: p?.currency ?? p?.currency_id ?? p?.currencyId ?? "COP",
    status: p?.status ?? p?.state ?? p?.payment_status ?? null,
    method: p?.method ?? p?.paymentMethod ?? p?.payment_type ?? null,
    gateway: p?.gateway ?? p?.provider ?? p?.platform ?? p?.source ?? "Mercado Pago",
    serviceId: p?.serviceId ?? p?.service_id ?? p?.service?.id ?? null,
    serviceName: p?.serviceName ?? p?.service?.name ?? p?.description ?? null,
    receiptUrl: p?.receiptUrl ?? p?.ticketUrl ?? p?.invoiceUrl ?? p?.receipt?.url ?? null,
  };
}

async function getPayments(): Promise<Payment[]> {
  const jwt = await getBackendJWTViaApiRoute();
  const base = process.env.NEXT_PUBLIC_URL?.replace(/\/+$/, "") || "http://localhost:8080";

  // ➜ Endpoint real según tu Postman: GET /api/payments/getPayments
  const res = await fetch(`${base}/api/payments/getPayments`, {
    headers: { Authorization: `Bearer ${jwt}` },
    cache: "no-store",
  });

  if (!res.ok) {
    if (res.status === 400 || res.status === 404) return []; // sin pagos
    const text = await res.text().catch(() => "");
    throw new Error(text || `Error ${res.status}`);
  }

  const data = await res.json().catch(() => []);
  const arr = Array.isArray(data) ? data : (Array.isArray((data as any)?.content) ? (data as any).content : []);
  return arr.map(normalizePayment);
}


/* ==================== UI HELPERS ==================== */
function statusPillClass(status: string | null) {
  const s = String(status ?? "").toUpperCase();
  if (["APPROVED", "PAID", "COMPLETED", "SUCCESS", "FINISHED"].includes(s))
    return "border-green-300 text-green-700 bg-green-50";
  if (["PENDING", "IN_PROCESS", "CREATED", "EN_PROCESO", "SOLICITADO"].includes(s))
    return "border-amber-300 text-amber-700 bg-amber-50";
  if (["REJECTED", "CANCELLED", "CANCELED", "FAILED"].includes(s))
    return "border-red-300 text-red-700 bg-red-50";
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

/* ==================== PAGE (TABS EN /client/payments) ==================== */
type PageProps = { searchParams: Promise<{ tab?: string }> };

export default async function PaymentsPage({ searchParams }: PageProps) {
  const { tab } = await searchParams;
  const activeTab = tab === "pending" ? "pending" : "all";

  let payments: Payment[] = [];
  let error: string | null = null;

  try {
    const all = await getPayments();
    payments =
      activeTab === "pending"
        ? all.filter((p) =>
            ["PENDING", "IN_PROCESS", "CREATED", "EN_PROCESO", "SOLICITADO"].includes(
              String(p.status ?? "").toUpperCase()
            )
          )
        : all;
  } catch (e: any) {
    error = e?.message ?? "No se pudo cargar el historial de pagos";
  }

  return (
    <div className="space-y-6">
      {/* Header + tabs */}
      <div className="flex items-center justify-between">
        <h2>Pagos</h2>
        <div className="flex items-center gap-2">
          <Link href="/client/payments">
            <button
              className={`appearance-none rounded-lg px-3 py-1.5 text-sm border transition
              ${activeTab === "all" ? "bg-indigo-600 text-white border-indigo-600" : "hover:bg-black/5"}`}
              title="Ver historial de pagos"
            >
              Historial
            </button>
          </Link>
          <Link href="/client/payments?tab=pending">
            <button
              className={`appearance-none rounded-lg px-3 py-1.5 text-sm border transition
              ${activeTab === "pending" ? "bg-indigo-600 text-white border-indigo-600" : "hover:bg-black/5"}`}
              title="Ver pagos pendientes"
            >
              Pendientes
            </button>
          </Link>
        </div>
      </div>

      {error ? (
        <p>{error}</p>
      ) : payments.length === 0 ? (
        <p>{activeTab === "pending" ? "No tienes pagos pendientes." : "No hay pagos registrados."}</p>
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead className="bg-slate-50">
              <tr>
                <th className="py-3 pl-4 pr-3 text-left font-semibold border-b border-slate-200">Fecha</th>
                <th className="py-3 px-3 text-left font-semibold border-b border-slate-200">Servicio</th>
                <th className="py-3 px-3 text-left font-semibold border-b border-slate-200">Monto</th>
                <th className="py-3 px-3 text-left font-semibold border-b border-slate-200">Estado</th>
                <th className="py-3 px-3 text-left font-semibold border-b border-slate-200">Método</th>
                <th className="py-3 px-3 text-left font-semibold border-b border-slate-200">Pasarela</th>
                <th className="py-3 px-3 text-left font-semibold border-b border-slate-200">Comprobante</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr
                  key={String(p.id)}
                  className="border-b border-slate-100 odd:bg-white even:bg-slate-50/60 hover:bg-indigo-50/40 transition-colors"
                >
                  <td className="py-3 pl-4 pr-3">{fmtDate(p.createdAt)}</td>
                  <td className="py-3 px-3">
                    {p.serviceId ? (
                      <Link className="text-indigo-600 hover:underline" href={`/client/services/${p.serviceId}`}>
                        {p.serviceName ?? `Servicio #${p.serviceId}`}
                      </Link>
                    ) : (
                      p.serviceName ?? "—"
                    )}
                  </td>
                  <td className="py-3 px-3 font-medium">
                    {formatCOP(p.amount)}{p.currency && p.currency !== "COP" ? ` ${p.currency}` : ""}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${statusPillClass(p.status)}`}>
                      {p.status ?? "-"}
                    </span>
                  </td>
                  <td className="py-3 px-3">{p.method ?? "-"}</td>
                  <td className="py-3 px-3">
                    <span className="rounded-full border bg-white px-2 py-0.5 text-xs text-slate-700">
                      {p.gateway ?? "Mercado Pago"}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    {p.receiptUrl ? (
                      <a className="text-indigo-600 hover:underline" href={p.receiptUrl} target="_blank" rel="noreferrer">
                        Ver comprobante
                      </a>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
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
