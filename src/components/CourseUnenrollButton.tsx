"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export type Course = { id: number|string; name: string; parcialCapacity?: number; capacity?: number; };

export default function CourseUnenrollButton({ course }: { course: Course }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onConfirm = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/courses/unenroll", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(course),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.message || "No se pudo cancelar la inscripción.");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <>
      <button className="rounded px-3 py-1 text-sm border" onClick={() => setOpen(true)}>Cancelar curso</button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => !loading && setOpen(false)} />
          <div className="relative bg-white rounded-2xl p-4 w-[92%] max-w-md space-y-3">
            <h3 className="font-semibold text-base">Confirmar cancelación</h3>
            <p className="text-sm">¿Seguro que deseas cancelar tu inscripción a “{course.name}”?</p>
            <div className="flex justify-end gap-2">
              <button className="border rounded px-3 py-1 text-sm" onClick={() => setOpen(false)} disabled={loading}>No</button>
              <button className="border rounded px-3 py-1 text-sm" onClick={onConfirm} disabled={loading}>
                {loading ? "Cancelando..." : "Sí, cancelar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
