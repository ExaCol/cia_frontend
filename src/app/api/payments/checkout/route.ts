import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/* ================= helpers ================= */
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

function deriveCourseTypeLikeA1(input?: string | null): string | null {
  if (!input) return null;
  const s = String(input).toUpperCase();
  const m1 = s.match(/\b([ABC][123])\b/);
  if (m1) return m1[1];
  const m2 = s.match(/([ABC][123])\s*CURSO/);
  if (m2) return m2[1];
  const m3 = s.match(/COURSE\s*([ABC][123])/);
  if (m3) return m3[1];
  const m4 = s.match(/([ABC][123])\s*COURSE/);
  if (m4) return m4[1];
  const m5 = s.match(/([ABC][123])/);
  if (m5) return m5[1];
  return null;
}

/* ================= POST ================= */
export async function POST(req: Request) {
  try {
    const jwt = await getBackendJWT();
    const base = process.env.NEXT_PUBLIC_URL?.replace(/\/+$/, "") || "http://localhost:8080";

    const body = await req.json().catch(() => ({}));
    const { serviceId, courseId } = body || {};
    let { courseType, price } = body || {}; // price opcional

    let finalServiceId: number | null = null;

    if (serviceId) {
      finalServiceId = Number(serviceId);
    } else if (courseId) {
      // ======== flujo curso ========

      // 1) Asegurar que tengamos un courseType válido
      let resolved = deriveCourseTypeLikeA1(courseType);

      // Si no viene o no se pudo derivar, intentamos pedírselo al backend
      if (!resolved) {
        try {
          const r1 = await fetch(`${base}/coursesData/getSpecificCourse/${courseId}`, {
            headers: { Authorization: `Bearer ${jwt}` },
            cache: "no-store",
          });
          if (r1.ok) {
            const cj = await r1.json().catch(() => ({}));
            resolved =
              deriveCourseTypeLikeA1(cj?.courseType) ||
              deriveCourseTypeLikeA1(cj?.type) ||
              deriveCourseTypeLikeA1(cj?.name);
            if (!price) price = cj?.price ?? cj?.amount ?? null;
          }
        } catch {}
      }

      if (!resolved) {
        // último intento: buscar el curso en la lista de cursos del usuario
        try {
          const r2 = await fetch(`${base}/usr/courseByUser`, {
            headers: { Authorization: `Bearer ${jwt}` },
            cache: "no-store",
          });
          if (r2.ok) {
            const list = await r2.json().catch(() => []);
            const arr = Array.isArray(list) ? list : (Array.isArray((list as any)?.content) ? (list as any).content : []);
            const found = arr.find((x: any) => String(x?.id ?? x?.courseId) === String(courseId));
            if (found) {
              resolved =
                deriveCourseTypeLikeA1(found?.courseType) ||
                deriveCourseTypeLikeA1(found?.type) ||
                deriveCourseTypeLikeA1(found?.name);
              if (!price) price = found?.price ?? found?.amount ?? null;
            }
          }
        } catch {}
      }

      if (!resolved) {
        return NextResponse.json(
          { message: "No se pudo determinar el courseType del curso (A1/B1/B3...)." },
          { status: 400 }
        );
      }

      // 2) Partner (opcional, si existe en el curso específico)
      let partnerId: number | null = null;
      try {
        const r = await fetch(`${base}/coursesData/getSpecificCourse/${courseId}`, {
          headers: { Authorization: `Bearer ${jwt}` },
          cache: "no-store",
        });
        if (r.ok) {
          const cj = await r.json().catch(() => ({}));
          partnerId = cj?.partner?.id ?? cj?.partnerId ?? null;
        }
      } catch {}

      // 3) Crear el servicio en backend con courseType válido
      const payload: any = {
        name: `Curso ${resolved}`,
        serviceType: "COURSES", // usa "COURSES" si tu backend lo espera así
        courseType: resolved,   // <- ¡IMPORTANTE! nunca null
        plate: "-",             // no aplica cursos
      };
      if (price != null) payload.price = Number(price);
      if (partnerId) payload.partner = { id: partnerId };

      const rCreate = await fetch(`${base}/services/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify(payload),
      });

      if (!rCreate.ok) {
        const txt = await rCreate.text().catch(() => "");
        return NextResponse.json(
          { message: txt || "No se pudo crear el servicio del curso." },
          { status: 400 }
        );
      }

      const created = await rCreate.json().catch(() => ({}));
      const newId = created?.id ?? created?.serviceId ?? null;
      if (!newId) {
        return NextResponse.json(
          { message: "El backend no devolvió id del servicio creado." },
          { status: 400 }
        );
      }
      finalServiceId = Number(newId);
    } else {
      return NextResponse.json(
        { message: "Faltan parámetros: serviceId o courseId." },
        { status: 400 }
      );
    }

    // 4) Checkout en backend
    const rCheckout = await fetch(`${base}/api/payments/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({ serviceId: finalServiceId }),
    });

    const txt = await rCheckout.text().catch(() => "");
    let json: any = null;
    try {
      json = JSON.parse(txt);
    } catch {
      const m = txt.match(/https?:\/\/\S+/);
      if (m) json = { url: m[0] };
    }

    if (!rCheckout.ok) {
      return NextResponse.json(
        { message: json?.message || txt || `Error ${rCheckout.status}` },
        { status: rCheckout.status }
      );
    }

    return NextResponse.json(json ?? { ok: true });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || "Error interno en checkout." }, { status: 500 });
  }
}
