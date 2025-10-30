/*
Developed by Tomás Vera & Luis Romero
Version 1.0
Register Vehicle Form
*/
"use client";

import React from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import "@/styles/globals.css";

const url = process.env.NEXT_PUBLIC_URL;

function RegisterVehicle() {
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const soatRateType = String(fd.get("soatRateType") ?? "").trim();

    const validSoatRates = [
      "100",
      "110",
      "120",
      "130",
      "140",
      "150",
      "211",
      "212",
      "221",
      "222",
      "231",
      "232",
      "310",
      "320",
      "330",
      "410",
      "420",
      "430",
      "511",
      "512",
      "521",
      "522",
      "531",
      "532",
      "611",
      "612",
      "621",
      "622",
      "711",
      "712",
      "721",
      "722",
      "731",
      "732",
      "810",
      "910",
      "920",
    ];

    if (!validSoatRates.includes(soatRateType)) {
      alert(
        `El tipo de tarifa SOAT "${soatRateType}" no es válido. Debe ser uno de: ${validSoatRates.join(
          ", "
        )}`
      );
      return;
    }

    // Recolectar datos
    const plate = String(fd.get("plate") ?? "").trim();
    const type = String(fd.get("type") ?? "").trim();
    const model = String(fd.get("model") ?? "").trim();
    const soatExpiration = String(fd.get("soatExpiration") ?? "").trim();
    const technoExpiration = String(fd.get("technoExpiration") ?? "").trim();

    const payload = {
      plate,
      soatRateType,
      type,
      model,
      soatExpiration,
      technoExpiration,
    };

    //Obtener jwt y registrar vehículo
    axios
      .get("/api/auth/token")
      .then((res) => {
        const jwt = res.data;
        axios
          .post(url + "/vehicle/save", payload, {
            headers: {
              Authorization: `Bearer ${jwt}`,
            },
          })
          .then((res) => {
            alert("Vehículo registrado exitosamente");
            router.push("/");
          })
          .catch((err) => {
            console.error("Error al registrar el vehículo:", err);
            alert("Error al registrar el vehículo: " + err.response.data);
          });
      })
      .catch((err) => {
        console.error("Error al obtener el token JWT:", err);
        alert("Error al obtener el token JWT");
        return;
      });
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
      <h2 style={{ margin: 0, alignSelf: "center" }}>Registro de Vehículo</h2>

      <label htmlFor="plate">Placa</label>
      <input
        id="plate"
        name="plate"
        type="text"
        placeholder="Ej: ABC123"
        required
      />

      <label htmlFor="soatRateType">Tarifa de SOAT</label>
      <input
        id="soatRateType"
        name="soatRateType"
        type="number"
        placeholder="Ej: 110"
        required
      />

      <label htmlFor="type">Tipo</label>
      <select id="type" name="type" defaultValue="Automovil" required>
        <option value="Motos">Moto</option>
        <option value="Liviano Particular">Liviano Particular</option>
        <option value="Liviano Privado">Liviano Privado</option>
        <option value="Pesado Particular">Pesado Particular</option>
        <option value="Pesado Privado">Pesado Privado</option>
      </select>

      <label htmlFor="model">Modelo (año)</label>
      <input
        id="model"
        name="model"
        type="number"
        inputMode="numeric"
        placeholder="Ej: 2011"
        min={2008}
        max={new Date().getFullYear()}
        step={1}
        required
        pattern="\d{4}"
      />

      <label htmlFor="soatExpiration">Vencimiento del SOAT</label>
      <input id="soatExpiration" name="soatExpiration" type="date" required />

      <label htmlFor="technoExpiration">Vencimiento de Tecnomecánica</label>
      <input
        id="technoExpiration"
        name="technoExpiration"
        type="date"
        required
      />

      <button type="submit">Registrar</button>
    </form>
  );
}

export default RegisterVehicle;
