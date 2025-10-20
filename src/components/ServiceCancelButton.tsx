"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

type Service = {
  id: number | string;
  serviceType?: string | null;
  plate?: string | null;
};

export default function ServiceCancelButton({ service }: { service: Service }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // para que el modal salga en <body> y no “rompa” la tabla
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!service?.id) return null;

  const onConfirm = async () => {
    setErrorMsg(null);
    try {
      setLoading(true);
      const res = await fetch(`/api/services/cancel?id=${service.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}), // sin motivo
      });

      if (!res.ok) {
        // mostramos el error dentro del modal (nada de alert)
        const data = await res.json().catch(() => ({}));
        setErrorMsg(
          data?.message ||
            "No se pudo cancelar el servicio en este momento."
        );
        return;
      }

      // éxito
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const modal = open ? (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => (!loading ? setOpen(false) : null)}
      />
      {/* Panel */}
      <div className="relative bg-white w-[92%] max-w-md rounded-2xl shadow-xl p-5 space-y-4">
        <div className="space-y-1">
          <h3 className="text-base font-semibold">Confirmar cancelación</h3>
          <p className="text-sm opacity-80">
            Vas a cancelar el servicio <b>{service?.serviceType ?? "—"}</b>
            {service?.plate ? (
              <>
                {" "}
                de la placa <b>{service.plate}</b>
              </>
            ) : null}
            .
          </p>
        </div>

        {errorMsg && (
          <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
            {errorMsg}
          </div>
        )}

        <div className="flex items-center justify-end gap-2">
          <button
            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-black/5 transition"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            {errorMsg ? "Cerrar" : "No"}
          </button>
          {!errorMsg && (
            <button
              className="px-3 py-1.5 text-sm border rounded-lg hover:bg-black/5 transition"
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? "Cancelando..." : "Sí, cancelar"}
            </button>
          )}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        className="inline-flex items-center rounded-lg px-3 py-1.5 text-sm border hover:bg-black/5 transition"
        onClick={() => setOpen(true)}
        disabled={loading}
      >
        Cancelar
      </button>

      {/* Modal montado en body para que no desordene la tabla */}
      {mounted ? createPortal(modal, document.body) : null}
    </>
  );
}
