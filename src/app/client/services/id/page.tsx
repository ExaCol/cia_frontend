/*
Developed by Tomás Vera & Luis Romero
Version 1.0
Client Service Detail
*/
import Link from "next/link";
import axios from "axios";
import "@/styles/globals.css";

const url = process.env.NEXT_PUBLIC_URL;

async function getService(id: string): Promise<any> {
  const tRes = await fetch("http://localhost:3000/api/auth/token", {
    cache: "no-store",
    credentials: "include",
  });

  if (!tRes.ok) throw new Error("No autenticado");

  let data: any;
  try { data = await tRes.json(); } catch { data = await tRes.text(); }

  const jwt = typeof data === "string" ? data : data?.token ?? null;
  if (!jwt) throw new Error("No autenticado");

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_URL?.replace(/\/+$/, "") ?? "http://localhost:8080"}/services/specificServices/${id}`,
    { headers: { Authorization: `Bearer ${jwt}` }, cache: "no-store" }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Error ${res.status}`);
  }
  return res.json();
}


export default async function ServiceDetailPage({ params }: { params: { id: string } }) {
  let svc: any = null;
  let error: string | null = null;

  try {
    svc = await getService(params.id);
  } catch (e: any) {
    error = e?.message ?? "No se pudo cargar el servicio";
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div style={{ marginBottom: 12 }}>
        <Link href="/client/services"><button>← Volver</button></Link>
      </div>

      {error ? (
        <p style={{ color: "crimson" }}>{error}</p>
      ) : !svc ? (
        <p>No se encontró el servicio.</p>
      ) : (
        <div className="p-4" style={{ border: "1px solid var(--color-holder)", borderRadius: 12 }}>
          <h2 style={{ marginBottom: 8 }}>Servicio #{svc.id}</h2>
          <p><b>Tipo:</b> {svc.serviceType ?? "-"}</p>
          <p><b>Placa:</b> {svc.plate ?? "-"}</p>
          <p><b>Expira:</b> {svc.exp_date ?? "-"}</p>
          <p><b>Aseguradora:</b> {svc.assurance ?? "-"}</p>
          <p><b>Duración:</b> {svc.duration ?? "-"}</p>
          <p><b>Graduado:</b> {svc.graduated ? "Sí" : "No"}</p>
        </div>
      )}
    </div>
  );
}
