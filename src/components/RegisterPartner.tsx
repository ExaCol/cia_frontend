/*
Developed by Tomás Vera & Luis Romero
Version 1.0
Register Partner Component
*/

"use client";

import React, { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

type PartnerCreate = {
  name: string;
  lat: number;
  lon: number;
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
    lat: 0,
    lon: 0,
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
      [name]:
        type === "checkbox"
          ? checked
          : name === "lat" || name === "lon"
          ? Number(value)
          : value,
    }));
  };

  const resetForm = () =>
    setForm({
      name: "",
      lat: 0,
      lon: 0,
      soat: false,
      techno: false,
    });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      const headers = await getAuthHeader();
      await api.post("/partners/create", form, { headers });
      alert("Partner creado");
      resetForm();
      router.push("/partners");
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
      }}
    >
      <h3 style={{ margin: 0 }}>Registrar Partner</h3>

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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div>
          <label style={{ display: "block", fontWeight: 600 }}>Lat</label>
          <input
            name="lat"
            type="number"
            value={form.lat}
            onChange={handleChange}
            placeholder="Ej: 46831000"
            required
          />
        </div>
        <div>
          <label style={{ display: "block", fontWeight: 600 }}>Lon</label>
          <input
            name="lon"
            type="number"
            value={form.lon}
            onChange={handleChange}
            placeholder="Ej: -74205000"
            required
          />
        </div>
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
        <button type="button" onClick={() => router.push("/partners")} disabled={saving}>
          Volver
        </button>
      </div>
    </form>
  );
}
