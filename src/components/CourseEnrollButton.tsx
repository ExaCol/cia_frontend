"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type Course = {
  id: number | string;
  name: string;
  parcialCapacity?: number;
  capacity?: number;
};

export default function CourseEnrollButton({ course }: { course: Course }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onConfirm = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/courses/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(course), // el back espera el objeto curso
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.message || "No se pudo inscribir al curso.");
        return;
      }
      router.refresh(); // recarga la lista
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <>
      <button
        className="inline-flex items-center rounded px-3 py-1 text-sm border hover:opacity-90"
        onClick={() => setOpen(true)}
        disabled={loading}
      >
        Inscribirme
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-4 space-y-3 w-[320px]">
            <h3 className="font-semibold text-base">Confirmar inscripción</h3>
            <p className="text-sm">¿Deseas inscribirte a “{course.name}”?</p>
            <div className="flex justify-end gap-2">
              <button className="px-3 py-1 border rounded" onClick={() => setOpen(false)} disabled={loading}>
                No
              </button>
              <button className="px-3 py-1 border rounded" onClick={onConfirm} disabled={loading}>
                {loading ? "Inscribiendo..." : "Sí, inscribirme"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
