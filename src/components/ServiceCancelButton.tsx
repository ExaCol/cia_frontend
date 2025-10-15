"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = { serviceId: string | number };

export default function ServiceCancelButton({ serviceId }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onConfirm = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/services/cancel?id=${serviceId}`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.message || "No se pudo cancelar el servicio.");
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
      <button
        className="inline-flex items-center rounded px-3 py-1 text-sm border hover:opacity-90"
        onClick={() => setOpen(true)}
        disabled={loading}
      >
        Cancelar
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-4 space-y-3 w-[320px]">
            <h3 className="font-semibold text-base">Confirmar cancelación</h3>
            <p className="text-sm">¿Seguro que deseas cancelar este servicio?</p>
            <div className="flex justify-end gap-2">
              <button className="px-3 py-1 border rounded" onClick={() => setOpen(false)} disabled={loading}>
                No
              </button>
              <button className="px-3 py-1 border rounded" onClick={onConfirm} disabled={loading}>
                {loading ? "Cancelando..." : "Sí, cancelar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
