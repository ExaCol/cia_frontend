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

    // Recolectar datos
    const plate = String(fd.get("plate") ?? "").trim();
    const soatRateType = String(fd.get("soatRateType") ?? "").trim();
    const type = String(fd.get("type") ?? "").trim();
    const technoClassification = String(
      fd.get("technoClassification") ?? ""
    ).trim();
    const soatExpiration = String(fd.get("soatExpiration") ?? "").trim();
    const technoExpiration = String(fd.get("technoExpiration") ?? "").trim();

    const payload = {
      plate,
      soatRateType,
      type,
      technoClassification,
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
            alert("Error al registrar el vehículo: "  + err.response.data);
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
        <option value="Automovil">Automóvil</option>
        <option value="Bus">Bus</option>
        <option value="Buseta">Buseta</option>
        <option value="Camion">Camión</option>
        <option value="Camioneta">Camioneta</option>
        <option value="Campero">Campero</option>
        <option value="Microbus">Microbus</option>
        <option value="Tractocamion">Tractocamión</option>
        <option value="Motocicleta">Motocicleta</option>
        <option value="Motocarro">Motocarro</option>
        <option value="Mototriciclo">Mototriciclo</option>
        <option value="Cuatriomoto">Cuatriomoto</option>
        <option value="Volqueta">Volqueta</option>
      </select>

      <label htmlFor="technoClassification">Clasificación Tecnomecánica </label>
      <select id="technoClassification" name="technoClassification" defaultValue="Particular" required>
        <option value="Particular">Particular</option>
        <option value="Publico">Público</option>
        <option value="Comercial">Comercial</option>
      </select>

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
