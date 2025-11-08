"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

type ServiceLike =
  | { id: number | string; serviceType?: string | null; plate?: string | null }
  | number
  | string
  | null
  | undefined;

function getServiceId(svc: ServiceLike): number | null {
  if (svc === null || svc === undefined) return null;
  if (typeof svc === "number") return svc;
  if (typeof svc === "string") {
    const m = svc.match(/\d+/);
    if (!m) return null;
    const n = Number(m[0]);
    return Number.isFinite(n) ? n : null;
  }
  const raw = (svc as any).id;
  if (raw === null || raw === undefined) return null;
  const n = Number(String(raw).match(/\d+/)?.[0] ?? NaN);
  return Number.isFinite(n) ? n : null;
}

export default function ServiceCancelButton({
  service,
  label = "Cancelar",
}: {
  service: ServiceLike;
  label?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  const id = getServiceId(service);
  if (!id) return null;

  const humanType =
    typeof service === "object" && service && "serviceType" in service
      ? (service as any).serviceType ?? "—"
      : "—";
  const humanPlate =
    typeof service === "object" && service && "plate" in service
      ? (service as any).plate ?? null
      : null;

  const onConfirm = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const r = await fetch(`/api/services/cancel?id=${encodeURIComponent(String(id))}`, {
        method: "POST",
      });
      const txt = await r.text();
      let j: any = {};
      try { j = JSON.parse(txt); } catch {}
      if (!r.ok) throw new Error(j?.message || txt || "No se pudo cancelar el servicio.");
      setOpen(false);
      router.refresh();
    } catch (e: any) {
      setErrorMsg(e?.message || "Error al cancelar servicio.");
    } finally {
      setLoading(false);
    }
  };

  const modal = (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/30"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-[min(92vw,520px)] rounded-xl bg-white p-4 shadow-xl border">
        <div className="mb-3">
          <h3 className="text-base font-semibold">Confirmar cancelación</h3>
          <p className="text-sm opacity-80">
            Vas a cancelar el servicio <b>{humanType}</b>
            {humanPlate ? <> de la placa <b>{humanPlate}</b></> : null}.
          </p>
        </div>

        {errorMsg && (
          <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 mb-3">
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
  );

  return (
    <>
      <button
        className="inline-flex items-center rounded-lg px-3 py-1.5 text-xs border bg-white hover:bg-black/5 transition"
        onClick={() => setOpen(true)}
        disabled={loading}
      >
        {label}
      </button>

      {/* 🔧 FIX: Solo portalizar cuando `open` esté en true */}
      {mounted && open ? createPortal(modal, document.body) : null}
    </>
  );
}
