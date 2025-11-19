"use client";

import React, { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";

const url = process.env.NEXT_PUBLIC_URL as string;

function UpdateVehicleForm() {
  const router = useRouter();
  const sp = useSearchParams();

  const [technoExpiration, setTechnoExpiration] = React.useState<string>("");
  const [soatExpiration, setSoatExpiration] = React.useState<string>("");

  useEffect(() => {
    const fromQuerySoat = decodeURIComponent(sp.get("soatExpiration") ?? "");
    const fromQueryTechno = decodeURIComponent(sp.get("technoExpiration") ?? "");
    setSoatExpiration(fromQuerySoat);
    setTechnoExpiration(fromQueryTechno);
  }, [sp]);

  const id = decodeURIComponent(sp.get("id") ?? "");
  const plate = decodeURIComponent(sp.get("plate") ?? "");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {

      const { data: jwt } = await axios.get("/api/auth/token");

      await axios.patch(
        `${url}/vehicle/update-vehicle/${id}/${soatExpiration}/${technoExpiration}`,
        null,
        {
          headers: { Authorization: `Bearer ${jwt}` },
        }
      );

      alert("Vehículo editado exitosamente");
      router.push("/client/profile");
    } catch (err: any) {
      console.error("Error al editar el vehículo:", err);
      const msg = err?.response?.data ?? "Error desconocido";
      alert("Error al editar el vehículo: " + msg);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        width: "100%",
        maxWidth: 420,
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        gap: 10,
        textAlign: "left",
      }}
    >
      <h2 style={{ margin: 0, alignSelf: "center" }}>
        Actualización de Vehículo: {plate}
      </h2>

      <label htmlFor="soatExpiration">Vencimiento del SOAT</label>
      <input
        id="soatExpiration"
        name="soatExpiration"
        type="date"
        value={soatExpiration}
        onChange={(e) => setSoatExpiration(e.target.value)}
        required
      />

      <label htmlFor="technoExpiration">Vencimiento de Tecnomecánica</label>
      <input
        id="technoExpiration"
        name="technoExpiration"
        type="date"
        value={technoExpiration}
        onChange={(e) => setTechnoExpiration(e.target.value)}
        required
      />

      <button type="submit">Actualizar</button>
    </form>
  );
}

export default UpdateVehicleForm;
