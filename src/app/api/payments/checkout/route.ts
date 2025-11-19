import { NextResponse } from "next/server";
import { cookies } from "next/headers";

function extractJWT(anyVal: any): string | null {
  if (typeof anyVal === "string" && anyVal.split(".").length === 3) return anyVal;
  if (anyVal?.token && typeof anyVal.token === "string" && anyVal.token.split(".").length === 3) return anyVal.token;
  if (anyVal?.data?.token && typeof anyVal.data?.token === "string" && anyVal.data.token.split(".").length === 3)
    return anyVal.data.token;
  if (anyVal?.backendToken && typeof anyVal.backendToken === "string" && anyVal.backendToken.split(".").length === 3)
    return anyVal.backendToken;
  return null;
}

async function getBackendJWT() {
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

function pickServiceIdFrom(anyJson: any): number | null {
  const cand = anyJson?.id ?? anyJson?.serviceId ?? anyJson?.data?.id ?? anyJson?.data?.serviceId;
  const n = Number(cand);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function POST(req: Request) {
  try {
    const jwt = await getBackendJWT();
    const base = process.env.NEXT_PUBLIC_URL?.replace(/\/+$/, "") || "http://localhost:8080";
    const body = await req.json().catch(() => ({}));

    // 1) Si viene serviceId → directo a checkout
    const directServiceId = Number(body?.serviceId);
    if (Number.isFinite(directServiceId) && directServiceId > 0) {
      const r = await fetch(`${base}/api/payments/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
        body: JSON.stringify({ serviceId: directServiceId }),
      });
      const j = await r.json().catch(() => ({}));
      return NextResponse.json(j, { status: r.status });
    }

    // 2) Compatibilidad: { courseId, courseType, price }
    let courseId = body?.courseId ?? body?.course?.id;
    let courseType = body?.courseType ?? body?.course?.type;
    let price = body?.price ?? body?.course?.price ?? null;

    if (!courseId || !courseType) {
      return NextResponse.json(
        { ok: false, message: "Faltan parámetros: serviceId o course." },
        { status: 400 }
      );
    }

    // 2.a Crear servicio para el curso
    const createPayload: any = {
      name: `Curso ${String(courseType).toUpperCase()}`,
      price: Number(price ?? 0),
      courseType: String(courseType).toUpperCase(), // A1/B3/...
      serviceType: "COURSE",
      plate: "-",            // no aplica para cursos
      // partner: { id: 5 }, // solo si tu backend lo requiere
    };

    const rCreate = await fetch(`${base}/services/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
      body: JSON.stringify(createPayload),
    });
    const jCreate = await rCreate.json().catch(() => ({}));
    if (!rCreate.ok) {
      const msg = jCreate?.message || jCreate?.error || "No se pudo crear el servicio del curso.";
      return NextResponse.json({ ok: false, message: msg, detail: jCreate }, { status: rCreate.status });
    }

    const newServiceId = pickServiceIdFrom(jCreate);
    if (!newServiceId) {
      return NextResponse.json(
        { ok: false, message: "El backend no devolvió id del servicio creado.", detail: jCreate },
        { status: 502 }
      );
    }

    // 2.b Checkout con el serviceId creado
    const rPay = await fetch(`${base}/api/payments/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
      body: JSON.stringify({ serviceId: newServiceId }),
    });
    const jPay = await rPay.json().catch(() => ({}));
    return NextResponse.json(jPay, { status: rPay.status });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e?.message || "Error en checkout." }, { status: 500 });
  }
}
