/*
Developed by Tomás Vera & Luis Romero
Version 1.0
Service Create Form (Cliente)
*/
"use client";

import React, { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import "@/styles/globals.css";

const url = process.env.NEXT_PUBLIC_URL;

type ServicePayload = {
  serviceType: string;
  plate?: string;
  exp_date?: string; // yyyy-mm-dd
  assurance?: string;
  duration?: string;
  graduated?: boolean;
  notes?: string;
};

export default function ServiceForm() {
  const router = useRouter();
  const [data, setData] = useState<ServicePayload>({
    serviceType: "",
    plate: "",
    exp_date: "",
    assurance: "",
    duration: "",
    graduated: false,
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  const onChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type, checked } = e.target as any;
    setData((d) => ({ ...d, [name]: type === "checkbox" ? checked : value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const tRes = await axios.get("/api/auth/token", {
        withCredentials: true,
      });
      const jwt = tRes.data;
      const payload: Record<string, any> = { ...data };
      Object.keys(payload).forEach(
        (k) => payload[k] === "" && delete payload[k]
      );
      await axios.post(url + "/services/create", payload, {
        headers: { Authorization: `Bearer ${jwt}` },
      });

      alert("Servicio guardado exitosamente");
      router.replace("/client/services");
    } catch (err: any) {
      console.error(
        "Error al crear servicio:",
        err?.response?.data || err.message
      );
      alert(
        "Error al registrar servicio: " + (err?.response?.data || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      style={{
        width: "100%",
        maxWidth: 480,
        margin: "0 auto",
        display: "grid",
        gap: 12,
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: 8 }}>
        Solicitar Servicio
      </h2>

      <label htmlFor="serviceType">Tipo de Servicio*</label>
      <select
        id="serviceType"
        name="serviceType"
        required
        value={data.serviceType}
        onChange={onChange}
      >
        <option value="" disabled>
          Selecciona…
        </option>
        <option value="SOAT">SOAT</option>
        <option value="Tecnomecanica">Tecnomecánica</option>
        <option value="CursoConduccion">Curso de Conducción</option>
        <option value="Otro">Otro</option>
      </select>

      <label htmlFor="plate">Placa (si aplica)</label>
      <input
        id="plate"
        name="plate"
        placeholder="ABC123"
        value={data.plate}
        onChange={onChange}
      />

      <label htmlFor="exp_date">Fecha de expiración (si aplica)</label>
      <input
        id="exp_date"
        name="exp_date"
        type="date"
        value={data.exp_date}
        onChange={onChange}
      />

      <label htmlFor="assurance">Aseguradora (si aplica)</label>
      <input
        id="assurance"
        name="assurance"
        placeholder="SURA, AXA..."
        value={data.assurance}
        onChange={onChange}
      />

      <label htmlFor="duration">Duración (si aplica)</label>
      <input
        id="duration"
        name="duration"
        placeholder="1 año, 6 meses..."
        value={data.duration}
        onChange={onChange}
      />

      <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          type="checkbox"
          name="graduated"
          checked={data.graduated}
          onChange={onChange}
        />
        ¿Graduado (si aplica)?
      </label>

      <label htmlFor="notes">Notas</label>
      <textarea
        id="notes"
        name="notes"
        placeholder="Detalles adicionales…"
        value={data.notes}
        onChange={onChange}
      />

      <button type="submit" disabled={loading}>
        {loading ? "Guardando…" : "Registrar servicio"}
      </button>
    </form>
  );
}
