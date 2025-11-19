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
      const r = await fetch(
        `/api/services/cancel?id=${encodeURIComponent(String(id))}`,
        {
          method: "POST",
        }
      );
      const txt = await r.text();
      let j: any = {};
      try {
        j = JSON.parse(txt);
      } catch {}

      if (!r.ok || j?.ok === false) {
        const msg = j?.message || txt || "No se pudo cancelar el servicio.";
        setErrorMsg(msg);
        alert(msg);
        return;
      }

      alert(j?.message || "Servicio cancelado correctamente.");
      setOpen(false);
      router.refresh();
    } catch (e: any) {
      const msg = e?.message || "Error al cancelar servicio.";
      setErrorMsg(msg);
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const modal = (
    <div
      role="dialog"
      aria-modal="true"
      // overlay oscuro que cubre toda la pantalla
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        backgroundColor: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          setOpen(false);
          setErrorMsg(null);
        }
      }}
    >
      {/* Caja del modal */}
      <div
        style={{
          width: "min(520px, 92vw)",
          backgroundColor: "#ffffff",
          borderRadius: 16,
          padding: 16,
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
          border: "1px solid #e5e7eb",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ marginBottom: 12 }}>
          <h3
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            Confirmar cancelación
          </h3>
          <p
            style={{
              margin: "6px 0 0",
              fontSize: 14,
              opacity: 0.85,
            }}
          >
            Vas a cancelar el servicio <b>{humanType}</b>
            {humanPlate ? (
              <>
                {" "}
                de la placa <b>{humanPlate}</b>
              </>
            ) : null}
            .
          </p>
        </div>

        {errorMsg && (
          <div
            style={{
              marginBottom: 10,
              padding: "6px 8px",
              borderRadius: 8,
              border: "1px solid #fecaca",
              backgroundColor: "#fef2f2",
              color: "#b91c1c",
              fontSize: 13,
            }}
          >
            {errorMsg}
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            marginTop: 4,
          }}
        >
          <button
            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-black/5 transition"
            onClick={() => {
              setOpen(false);
              setErrorMsg(null);
            }}
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
        title="Cancelar servicio"
      >
        {label}
      </button>

      {mounted && open ? createPortal(modal, document.body) : null}
    </>
  );
}
