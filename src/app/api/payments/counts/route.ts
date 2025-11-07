import { cookies } from "next/headers";

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
  if (!r.ok) throw new Error("No auth");
  const data = await r.json().catch(() => ({}));
  const jwt = extractJWT(data);
  if (!jwt) throw new Error("Invalid token");
  return jwt;
}

function normalizeStatus(x: any): string {
  const s = String(x?.status ?? x?.state ?? "").toUpperCase();
  return s || "-";
}

export async function GET() {
  try {
    const jwt = await getBackendJWTViaApiRoute();
    const base = process.env.NEXT_PUBLIC_URL?.replace(/\/+$/, "") || "http://localhost:8080";

    // lee todos los pagos del usuario
    let res = await fetch(`${base}/payments/byUser`, {
      headers: { Authorization: `Bearer ${jwt}` },
      cache: "no-store",
    });

    if (res.status === 404) {
      res = await fetch(`${base}/payments`, {
        headers: { Authorization: `Bearer ${jwt}` },
        cache: "no-store",
      });
    }

    if (!res.ok) {
      return new Response(JSON.stringify({ total: 0, pending: 0 }), { status: 200 });
    }

    const arr = await res.json().catch(() => []);
    const list = Array.isArray(arr) ? arr : [];

    const PENDING_STATES = new Set(["PENDING", "CREATED", "IN_PROCESS", "EN_PROCESO", "SOLICITADO"]);
    const FINAL_STATES   = new Set(["PAID", "APPROVED", "COMPLETED", "FINISHED", "SUCCESS"]);

    let total = 0;
    let pending = 0;

    for (const p of list) {
      total++;
      const st = normalizeStatus(p);
      if (PENDING_STATES.has(st)) pending++;
      // (no usamos final por ahora, pero queda la idea)
    }

    return new Response(JSON.stringify({ total, pending }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ total: 0, pending: 0 }), { status: 200 });
  }
}
