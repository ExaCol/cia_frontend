// src/components/ServiceCancelButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  service: any;
  label?: string;
};

export default function ServiceCancelButton({ service, label = "Cancelar" }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const id = Number(service?.id);
  const disabled = !id || loading;

  const onCancel = async () => {
    if (!id) {
      alert("No se encontró el id del servicio.");
      return;
    }
    const ok = window.confirm("¿Seguro que deseas cancelar este servicio?");
    if (!ok) return;

    try {
      setLoading(true);
      const r = await fetch("/api/services/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId: id }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        alert(data?.message || "No fue posible cancelar el servicio.");
        return;
      }
      // opcional: mostrar mensaje del backend
      if (data?.message) console.log(data.message);
      // refrescar la tabla
      router.refresh();
    } catch (e: any) {
      alert(e?.message || "Error cancelando el servicio.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={onCancel}
      disabled={disabled}
      className="rounded-lg border px-3 py-1.5 text-xs hover:bg-black/5 transition disabled:opacity-50 disabled:cursor-not-allowed"
      title="Cancelar servicio"
    >
      {loading ? "Cancelando..." : label}
    </button>
  );
}
