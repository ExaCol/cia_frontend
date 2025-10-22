/*
Developed by Tomás Vera & Luis Romero
Version 1.2
Register Partner Component con AddressAutocompleteInput
*/
"use client";

import React, { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import AddressAutocompleteInput from "./AddressAutocompleteInput";

type PartnerCreate = {
  name: string;
  soat: boolean;
  techno: boolean;
};

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_URL, 
  timeout: 10000,
});

export default function RegisterPartner() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<PartnerCreate>({
    name: "",
    soat: false,
    techno: false,
  });

  async function getAuthHeader() {
    try {
      const tokenRes = await axios.get("/api/auth/token");
      const jwt = tokenRes.data;
      return { Authorization: `Bearer ${jwt}` };
    } catch {
      return {};
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () =>
    setForm({
      name: "",
      soat: false,
      techno: false,
    });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData(e.currentTarget);
      const latStr = String(fd.get("lat") ?? "").trim();
      const lonStr = String(fd.get("lon") ?? "").trim();

      if (!latStr || !lonStr) {
        alert("Selecciona una ubicación válida desde el autocompletado.");
        setSaving(false);
        return;
      }

      const payload = {
        name: form.name,
        lat: Number(latStr),
        lon: Number(lonStr),
        soat: form.soat,
        techno: form.techno,
      };

      const headers = await getAuthHeader();
      await api.post("/partners/create", payload, { headers });
      alert("Partner creado");
      resetForm();
      router.push("/admin/partners");
    } catch (e: any) {
      console.error("Error creando partner:", e);
      alert(
        "Error creando partner: " + (e?.response?.data ?? e?.message ?? "desconocido")
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "grid",
        gap: 8,
        border: "1px solid #ddd",
        padding: 12,
        borderRadius: 8,
        overflow: "visible",
      }}
    >
      <h3 style={{ margin: 0 }}>Registrar Aliado</h3>

      <div>
        <label style={{ display: "block", fontWeight: 600 }}>Nombre</label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Ej: Quiosco SOAT El Dorado"
          required
        />
      </div>
      <div style={{ position: "relative", zIndex: 9999, overflow: "visible" }}>
        <label htmlFor="address" style={{ display: "block", fontWeight: 600 }}>
          Ubicación
        </label>
        <AddressAutocompleteInput
          id="address"
          name="address"
          placeholder="Ej: Calle 45 #8-14"
          lang="es"
          biasLat={4.7110}
          biasLon={-74.0721}
        />
        <small style={{ color: "#666" }}>
          Selecciona una opción del listado para capturar coordenadas.
        </small>
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="checkbox"
          name="soat"
          checked={form.soat}
          onChange={handleChange}
        />
        SOAT
      </label>

      <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="checkbox"
          name="techno"
          checked={form.techno}
          onChange={handleChange}
        />
        Tecnomecánica
      </label>

      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" disabled={saving}>
          {saving ? "Guardando..." : "Registrar"}
        </button>
        <button type="button" onClick={() => router.push("/admin/partners")} disabled={saving}>
          Volver
        </button>
      </div>
    </form>
  );
}
