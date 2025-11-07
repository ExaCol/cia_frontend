"use client";

import React from "react";

type CoursePayload = {
  id: number | string;
  type?: string | null;  // puede venir como "B3CURSO", "COURSE A1", etc.
  name?: string | null;  // "Curso de Conducción A1"
  price?: number | null;
};

function deriveCourseTypeLikeA1(input?: string | null): string | null {
  if (!input) return null;
  const s = String(input).toUpperCase();

  // 1) Intento directo: token exacto A1|A2|B1|B2|B3|C1|C2
  const m1 = s.match(/\b([ABC][123])\b/);
  if (m1) return m1[1];

  // 2) Caso pegado: A1CURSO, COURSEA1, XYZ-B3-CURSO, etc.
  const m2 = s.match(/([ABC][123])\s*CURSO/);
  if (m2) return m2[1];

  const m3 = s.match(/COURSE\s*([ABC][123])/);
  if (m3) return m3[1];

  const m4 = s.match(/([ABC][123])\s*COURSE/);
  if (m4) return m4[1];

  // 3) Último intento: cualquier patrón A1/B3 dentro del string
  const m5 = s.match(/([ABC][123])/);
  if (m5) return m5[1];

  return null;
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
      if (serviceId) {
        // Flujo normal: ya existe el servicio
        const r = await fetch("/api/payments/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ serviceId }),
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j?.message || "No se pudo iniciar el pago.");
        const url = j?.init_point || j?.initPoint || j?.sandbox_init_point || j?.url || j?.redirectUrl;
        if (!url) throw new Error("No se recibió una URL válida de checkout.");
        window.location.href = url;
        return;
      }

      // Flujo curso: inferimos courseType
      if (!course?.id) throw new Error("Falta el id del curso.");
      const inferred =
        deriveCourseTypeLikeA1(course?.type) ||
        deriveCourseTypeLikeA1(course?.name);

      if (!inferred) {
        throw new Error(
          "No se pudo inferir el tipo de curso (A1/B1/B3...). Edita la fila o revisa los datos del curso."
        );
      }

      const r = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course.id,
          courseType: inferred,   // <- siempre enviamos A1/B3/etc.
          price: course?.price ?? null,
        }),
      });

      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.message || "No se pudo iniciar el pago.");
      const url = j?.init_point || j?.initPoint || j?.sandbox_init_point || j?.url || j?.redirectUrl;
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
