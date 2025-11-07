import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/** Igual que el patrón del proyecto: pedimos el JWT del backend a /api/auth/token */
async function getBackendJWT() {
  const cookieHeader = (await cookies()).getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || "http://localhost:3000";
  const r = await fetch(`${site}/api/auth/token`, {
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  });
  if (!r.ok) throw new Error("Sesión expirada. Inicia sesión nuevamente.");
  const data = await r.json().catch(() => ({}));

  const extractJWT = (anyVal: any): string | null => {
    if (typeof anyVal === "string" && anyVal.split(".").length === 3) return anyVal;
    if (anyVal?.token && typeof anyVal.token === "string" && anyVal.token.split(".").length === 3) return anyVal.token;
    if (anyVal?.data?.token && typeof anyVal.data.token === "string" && anyVal.data.token.split(".").length === 3) return anyVal.data.token;
    if (anyVal?.backendToken && typeof anyVal.backendToken === "string" && anyVal.backendToken.split(".").length === 3) return anyVal.backendToken;
    return null;
  };

  const jwt = extractJWT(data);
  if (!jwt) throw new Error("Token inválido recibido de /api/auth/token");
  return jwt;
}

export async function POST(req: Request) {
  try {
    const { serviceId } = await req.json().catch(() => ({ serviceId: null }));
    if (!serviceId && serviceId !== 0) {
      return NextResponse.json({ message: "serviceId inválido" }, { status: 400 });
    }

    const backendJWT = await getBackendJWT();
    const base = process.env.NEXT_PUBLIC_URL?.replace(/\/+$/, "") || "http://localhost:8080";

    const r = await fetch(`${base}/api/payments/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${backendJWT}`,
      },
      body: JSON.stringify({ serviceId }),
      cache: "no-store",
    });

    // 1) Si el backend respondió con Location (redirect)
    const location = r.headers.get("location");
    if (location && /^https?:\/\//i.test(location)) {
      return NextResponse.json({ redirectUrl: location }, { status: 200 });
    }

    // 2) Intentar parsear JSON; si no, quedarnos con texto
    const raw = await r.text();
    let data: any = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      data = null;
    }

    // 3) Si no es ok y no tenemos info útil, propagar error
    if (!r.ok && !location && !data) {
      return NextResponse.json(
        { message: raw || `Error ${r.status}` },
        { status: r.status }
      );
    }

    // 4) Si el cuerpo es texto plano y parece URL, úsala
    if (!data && raw && /^https?:\/\//i.test(raw.trim())) {
      return NextResponse.json({ redirectUrl: raw.trim() }, { status: 200 });
    }

    // 5) Devolver el JSON tal cual (cliente decide qué campo usar)
    return NextResponse.json(data ?? {}, { status: r.ok ? 200 : r.status });
  } catch (e: any) {
    return NextResponse.json({ message: "Error inesperado", error: String(e) }, { status: 500 });
  }
}
