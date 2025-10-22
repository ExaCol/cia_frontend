/*
Developed by Tomás Vera & Luis Romero
Version 1.2
Partners Component (Listar/Editar/Eliminar) con AddressAutocompleteInput
*/

"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import AddressAutocompleteInput from "./AddressAutocompleteInput";

type Partner = {
  id?: number;
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

export default function Partners() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partner | null>(null);
  const [updating, setUpdating] = useState(false);

  async function getAuthHeader() {
    try {
      const tokenRes = await axios.get("/api/auth/token");
      const jwt = tokenRes.data;
      return { Authorization: `Bearer ${jwt}` };
    } catch {
      return {};
    }
  }

  const loadPartners = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await getAuthHeader();
      const { data } = await api.get<Partner[]>("/partners/partners", { headers });
      setPartners(data ?? []);
    } catch (e: any) {
      if (e?.response?.status === 401) {
        setError("Expiró su sesión, cerrando sesión...");
        axios.post("/api/auth/logout").finally(() => {
          window.location.href = "/";
        });
      } else {
        setError(e?.message ?? "Error cargando partners");
      }
      console.error("Error cargando partners:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPartners();
  }, []);

  const startEdit = (p: Partner) => {
    setEditForm({ ...p });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => setEditForm(null);

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editForm) return;
    const { name, value, type, checked } = e.target;
    setEditForm({
      ...editForm,
      [name]: type === "checkbox" ? checked : value,
    } as Partner);
  };

  const submitUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editForm?.id) return alert("Falta ID para actualizar");
    setUpdating(true);
    try {
      const fd = new FormData(e.currentTarget);
      const latStr = String(fd.get("lat") ?? "").trim();
      const lonStr = String(fd.get("lon") ?? "").trim();
      const lat = latStr ? Number(latStr) : Number(editForm.lat);
      const lon = lonStr ? Number(lonStr) : Number(editForm.lon);

      const headers = await getAuthHeader();
      const payload = {
        id: editForm.id,
        name: editForm.name,
        lat,
        lon,
        soat: Boolean(editForm.soat),
        techno: Boolean(editForm.techno),
      };
      await api.patch("/partners/partner", payload, { headers });
      alert("Partner actualizado");
      setEditForm(null);
      await loadPartners();
    } catch (e: any) {
      console.error("Error actualizando partner:", e);
      alert(
        "Error actualizando partner: " + (e?.response?.data ?? e?.message ?? "desconocido")
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (p: Partner) => {
    if (!p.id) return;
    if (!confirm(`¿Eliminar el partner #${p.id} ("${p.name}")?`)) return;

    try {
      const headers = await getAuthHeader();
      await api.delete(`/partners/specificPartner/${p.id}`, { headers });
      alert("Partner eliminado");
      await loadPartners();
    } catch (e: any) {
      console.error("Error eliminando partner:", e);
      alert(
        "Error eliminando partner: " + (e?.response?.data ?? e?.message ?? "desconocido")
      );
    }
  };

  return (
    <div style={{ padding: 16, maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h1 style={{ marginTop: 0 }}>Aliados</h1>
        <Link href="/admin/register-partner">
          <button>Registrar Aliado</button>
        </Link>
      </div>

      {editForm && (
        <form
          onSubmit={submitUpdate}
          style={{
            display: "grid",
            gap: 8,
            border: "1px solid #ddd",
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
            overflow: "visible",
          }}
        >
          <h3 style={{ margin: 0 }}>Actualizar Aliados</h3>

          <div>
            <label style={{ display: "block", fontWeight: 600 }}>ID</label>
            <input name="id" value={editForm.id ?? ""} readOnly />
          </div>

          <div>
            <label style={{ display: "block", fontWeight: 600 }}>Nombre</label>
            <input
              name="name"
              value={editForm.name}
              onChange={handleEditChange}
              required
            />
          </div>
          <div style={{ position: "relative", zIndex: 9999, overflow: "visible" }}>
            <label htmlFor="address" style={{ display: "block", fontWeight: 600 }}>
              Ubicación (opcional si no cambias)
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
              Si no seleccionas una nueva ubicación, se conservarán las coordenadas actuales ({editForm.lat}, {editForm.lon}).
            </small>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              name="soat"
              checked={editForm.soat}
              onChange={handleEditChange}
            />
            SOAT
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              name="techno"
              checked={editForm.techno}
              onChange={handleEditChange}
            />
            Tecnomecánica
          </label>

          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" disabled={updating}>
              {updating ? "Guardando..." : "Guardar cambios"}
            </button>
            <button type="button" onClick={cancelEdit} disabled={updating}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {error && (
        <div
          style={{
            background: "#fee",
            border: "1px solid #fcc",
            padding: 8,
            borderRadius: 6,
            margin: "12px 0",
          }}
        >
          {error}
        </div>
      )}
      {loading && <p>Cargando partners…</p>}

      {!loading && (
        <>
          {partners.length ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ borderCollapse: "collapse", width: "100%" }}>
                <thead>
                  <tr>
                    <th style={th}>ID</th>
                    <th style={th}>Nombre</th>
                    <th style={th}>Lat</th>
                    <th style={th}>Lon</th>
                    <th style={th}>SOAT</th>
                    <th style={th}>Techno</th>
                    <th style={th}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {partners.map((p) => (
                    <tr key={p.id}>
                      <td style={td}>{p.id}</td>
                      <td style={td}>{p.name}</td>
                      <td style={td}>{p.lat}</td>
                      <td style={td}>{p.lon}</td>
                      <td style={td}>{p.soat ? "Sí" : "No"}</td>
                      <td style={td}>{p.techno ? "Sí" : "No"}</td>
                      <td style={td}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => startEdit(p)}>Editar</button>
                          <button onClick={() => handleDelete(p)}>Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No hay partners registrados.</p>
          )}
        </>
      )}
    </div>
  );
}

const th: React.CSSProperties = {
  borderBottom: "1px solid #ccc",
  textAlign: "left",
  padding: "8px",
};

const td: React.CSSProperties = {
  borderBottom: "1px solid #eee",
  padding: "8px",
};
