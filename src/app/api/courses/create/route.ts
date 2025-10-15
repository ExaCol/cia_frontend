import { NextResponse } from "next/server";
import { cookies } from "next/headers";

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
  if (!r.ok) throw new Error("Sesión expirada");
  const data = await r.json().catch(() => ({}));
  const jwt = extractJWT(data);
  if (!jwt) throw new Error("Token inválido");
  return jwt;
}

export async function POST(req: Request) {
  try {
    const body = await req.json(); // { name, capacity, parcialCapacity }
    const jwt = await getBackendJWT();
    const base = process.env.NEXT_PUBLIC_URL?.replace(/\/+$/,"") || "http://localhost:8080";

    const resp = await fetch(`${base}/coursesData/createCourse`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify(body),
    });

    const text = await resp.text();
    let parsed: any = null;
    try { parsed = JSON.parse(text); } catch {}
    return NextResponse.json(parsed ?? { ok: resp.ok }, { status: resp.status });
  } catch (e:any) {
    return NextResponse.json({ message: e?.message || "Error creando curso" }, { status: 500 });
  }
}
