import "@/styles/globals.css";
import Link from "next/link";
import { cookies } from "next/headers";

/* === Helpers para token y fetch con back === */
function extractJWT(anyVal: any): string | null {
  if (typeof anyVal === "string" && anyVal.split(".").length === 3) return anyVal;
  if (anyVal?.token && typeof anyVal.token === "string" && anyVal.token.split(".").length === 3) return anyVal.token;
  if (anyVal?.data?.token && typeof anyVal.data.token === "string" && anyVal.data.token.split(".").length === 3) return anyVal.data.token;
  if (anyVal?.backendToken && typeof anyVal.backendToken === "string" && anyVal.backendToken.split(".").length === 3) return anyVal.backendToken;
  return null;
}

async function getBackendJWT() {
  const cookieHeader = (await cookies()).getAll().map(c => `${c.name}=${c.value}`).join("; ");
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/,"") || "http://localhost:3000";
  const r = await fetch(`${site}/api/auth/token`, { headers: { Cookie: cookieHeader }, cache: "no-store" });
  if (!r.ok) throw new Error("Sesión expirada. Inicia sesión nuevamente.");
  const data = await r.json().catch(() => ({}));
  const jwt = extractJWT(data);
  if (!jwt) throw new Error("Token inválido recibido de /api/auth/token");
  return jwt;
}

async function getFromBack<T=any>(path: string): Promise<T> {
  const jwt = await getBackendJWT();
  const base = process.env.NEXT_PUBLIC_URL?.replace(/\/+$/,"") || "http://localhost:8080";
  const r = await fetch(`${base}${path}`, {
    headers: { Authorization: `Bearer ${jwt}` },
    cache: "no-store",
  });
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    try { const j = JSON.parse(text); throw new Error(j?.message || j?.error || text || `Error ${r.status}`); }
    catch { throw new Error(text || `Error ${r.status}`); }
  }
  try { return await r.json(); } catch { return [] as any; }
}

/* === Helpers de formato locales (sin crear archivos nuevos) === */
const fmtCOP = (v: number | string | null | undefined) => {
  const n = typeof v === "string" ? Number(v) : v ?? 0;
  if (Number.isNaN(n)) return "-";
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n as number);
};

const fmtDate = (v: string | null | undefined) => {
  if (!v) return "-";
  // Soporta ISO o "yyyy-mm-dd"
  const d = new Date(v);
  if (isNaN(d.getTime())) return v; // deja el texto tal cual si no parsea
  return d.toLocaleDateString("es-CO");
};

export default async function ClientPaymentsPage() {
  let error: string | null = null;
  let payments: any[] = [];
  let summary: any = null; // si /payments/paymentHistory devuelve algo útil

  try {
    // Principal: pagos del usuario
    payments = await getFromBack<any[]>("/payments/byUser");

    // Opcional: resumen/histórico (si aplica en tu back para el usuario autenticado)
    try {
      summary = await getFromBack<any>("/payments/paymentHistory");
    } catch {
      summary = null; // si no existe/permite, no rompemos la página
    }
  } catch (e: any) {
    error = e?.message || "No se pudieron cargar los pagos";
  }

  return (
    <div className="space-y-6">
      
      <div className="flex items-center justify-between">
  <h2>Mis pagos</h2>
  <div className="flex gap-2">
    {/* Botón nuevo hacia la vista aislada */}
    <Link href="/client/payments/history">
      <button className="border px-3 py-1 rounded">Historial de pagos </button>
    </Link>

    <Link href="/client">
      <button>Volver</button>
    </Link>
  </div>
</div>

      {/* Resumen opcional */}
      {summary && (
        <div className="border rounded-lg p-3">
          <h3 className="text-lg font-semibold mb-2">Resumen</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div><span className="opacity-70">Total pagado: </span><b>{fmtCOP(summary?.total ?? summary?.sum)}</b></div>
            <div><span className="opacity-70">Pagos realizados: </span><b>{summary?.count ?? "-"}</b></div>
            <div><span className="opacity-70">Último pago: </span><b>{fmtDate(summary?.lastDate)}</b></div>
          </div>
        </div>
      )}

      {/* Tabla principal */}
      {error ? (
        <p>{error}</p>
      ) : !payments || payments.length === 0 ? (
        <p>No tienes pagos registrados.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full border-collapse">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-3">ID</th>
                <th className="py-2 pr-3">Fecha</th>
                <th className="py-2 pr-3">Monto</th>
                <th className="py-2 pr-3">Método</th>
                <th className="py-2 pr-3">Estado</th>
                <th className="py-2 pr-3">Servicio</th>
                <th className="py-2 pr-3">Descripción</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id ?? p.paymentId} className="border-b">
                  <td className="py-2 pr-3">{p.id ?? p.paymentId ?? "-"}</td>
                  <td className="py-2 pr-3">{fmtDate(p.date ?? p.createdAt ?? p.paymentDate)}</td>
                  <td className="py-2 pr-3">{fmtCOP(p.amount ?? p.total ?? p.value)}</td>
                  <td className="py-2 pr-3">{p.method ?? p.paymentMethod ?? "-"}</td>
                  <td className="py-2 pr-3">{p.status ?? p.state ?? "-"}</td>
                  <td className="py-2 pr-3">{p.serviceId ?? p.service?.id ?? "-"}</td>
                  <td className="py-2 pr-3">{p.description ?? p.notes ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


