"use client";

type CoursePayload = {
  id: number | string;     // puede venir como 5, "5", "course-5 B3CURSO -", etc.
  type?: string | null;    // "A1", "B3", "COURSE A1", "A1CURSO", etc.
  name?: string | null;    // "Curso de Conducción A1"
  price?: number | null;
};

function extractNumericId(anyId: number | string | null | undefined): number | null {
  if (anyId === null || anyId === undefined) return null;
  const s = String(anyId);
  const m = s.match(/\d+/);
  if (!m) return null;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : null;
}

function deriveCourseTypeLikeA1(input?: string | null): string | null {
  if (!input) return null;
  const s = String(input).toUpperCase();
  // A1 / B3 / C2 exacto
  let m = s.match(/\b([ABC][123])\b/);
  if (m) return m[1];
  // pegados o mezclados
  m = s.match(/([ABC][123])\s*CURSO/);
  if (m) return m[1];
  m = s.match(/COURSE\s*([ABC][123])/);
  if (m) return m[1];
  m = s.match(/([ABC][123])\s*COURSE/);
  if (m) return m[1];
  // último intento: cualquier patrón
  m = s.match(/([ABC][123])/);
  return m ? m[1] : null;
}

export default function ServicePayButton({
  serviceId,
  course,
  label = "Pagar",
}: {
  serviceId?: number | null;
  course?: CoursePayload | null;
  label?: string;
}) {
  const onPay = async () => {
    try {
      // Caso 1: ya hay serviceId (servicio creado en backend)
      if (serviceId) {
        const r = await fetch("/api/payments/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ serviceId }),
        });
        const txt = await r.text();
        let j: any = {};
        try { j = JSON.parse(txt); } catch {}
        if (!r.ok) throw new Error(j?.message || txt || "No se pudo iniciar el pago.");

        const url =
          j?.init_point ||
          j?.initPoint ||
          j?.sandbox_init_point ||
          j?.url ||
          j?.redirectUrl;
        if (!url) throw new Error("No se recibió una URL válida de checkout.");
        window.location.href = url;
        return;
      }

      // Caso 2: curso inscrito (sin serviceId)
      if (!course?.id) throw new Error("Falta el id del curso.");

      const courseId = extractNumericId(course.id);
      if (!courseId) throw new Error("No se pudo interpretar el courseId del curso.");

      const inferredType =
        deriveCourseTypeLikeA1(course?.type) || deriveCourseTypeLikeA1(course?.name);
      if (!inferredType) {
        throw new Error("No se pudo inferir el tipo de curso (A1/B1/B3...).");
      }

      const r = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          courseType: inferredType,        // A1 / B3 / etc.
          price: course?.price ?? null,    // opcional
        }),
      });

      const txt = await r.text();
      let j: any = {};
      try { j = JSON.parse(txt); } catch {}
      if (!r.ok) throw new Error(j?.message || txt || "No se pudo iniciar el pago.");

      const url =
        j?.init_point ||
        j?.initPoint ||
        j?.sandbox_init_point ||
        j?.url ||
        j?.redirectUrl;
      if (!url) throw new Error("No se recibió una URL válida de checkout.");
      window.location.href = url;
    } catch (e: any) {
      alert(e?.message || "Error al iniciar el pago.");
    }
  };

  return (
    <button
      onClick={onPay}
      className="inline-flex items-center rounded-lg px-3 py-1.5 text-xs border bg-white hover:bg-black/5 transition"
      title="Ir a pasarela de pagos"
    >
      {label}
    </button>
  );
}
