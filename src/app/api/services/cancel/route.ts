import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/* Helpers para sacar el JWT que devuelve /api/auth/token */
function extractJWT(anyVal: any): string | null {
  if (typeof anyVal === "string" && anyVal.split(".").length === 3) return anyVal;
  if (anyVal?.token && typeof anyVal.token === "string" && anyVal.token.split(".").length === 3) return anyVal.token;
  if (anyVal?.data?.token && typeof anyVal.data.token === "string" && anyVal.data.token.split(".").length === 3)
    return anyVal.data.token;
  if (anyVal?.backendToken && typeof anyVal.backendToken === "string" && anyVal.backendToken.split(".").length === 3)
    return anyVal.backendToken;
  return null;
}

async function getBackendJWT(): Promise<string> {
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

export async function POST(req: Request) {
  try {
    // Admite ?id= y/o body JSON { serviceId: ... }
    const url = new URL(req.url);
    const idFromQuery = url.searchParams.get("id");
    const body = await req.json().catch(() => ({}));
    const idFromBody = body?.serviceId ?? body?.id;

    const id = Number(idFromBody ?? idFromQuery);
    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ message: "Parámetro serviceId inválido." }, { status: 400 });
    }

    const jwt = await getBackendJWT();
    const base = process.env.NEXT_PUBLIC_URL?.replace(/\/+$/, "") || "http://localhost:8080";

    const resp = await fetch(`${base}/services/specificService/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${jwt}` },
    });

    const text = await resp.text().catch(() => "");
    if (!resp.ok) {
      return NextResponse.json(
        { message: text || `Error ${resp.status} al cancelar el servicio.` },
        { status: resp.status }
      );
    }

    // Ejemplo backend: "Servicio eliminado exitosamente"
    return NextResponse.json({ ok: true, message: text || "Servicio cancelado.", serviceId: id });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || "Error al cancelar servicio." }, { status: 500 });
  }
}
