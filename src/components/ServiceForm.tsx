/*
Developed by Tomás Vera & Luis Romero
Version 1.0
Service Create Form (Cliente)
*/
"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import "@/styles/globals.css";

type Vehicle = {
  id: number;
  type: string;
  plate: string;
  soatRateType: string;
  model: number;
  soatExpiration: string;
  technoExpiration: string;
};

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_URL,
  timeout: 10000,
});

export default function ServiceForm() {
  const router = useRouter();
  const [pass, setPass] = useState(true);
  const [plates, setPlates] = useState<string[]>([]);
  const [serviceType, setServiceType] = useState<string>("");

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data: jwt } = await axios.get("/api/auth/token");
        if (!jwt) throw new Error("No se obtuvo token");

        const resp = await api.get<Vehicle[] | Vehicle>("/vehicle/vehicles", {
          headers: { Authorization: `Bearer ${jwt}` },
        });

        const data = resp.data;
        const list = Array.isArray(data) ? data : [data];
        const onlyPlates = [
          ...new Set(list.map((v) => v.plate).filter(Boolean)),
        ];
        setPass(true);
        if (mounted) setPlates(onlyPlates);
      } catch (e: any) {
        if (e.response.status == 401) {
          axios
            .post("/api/auth/logout")
            .finally(() => (window.location.href = "/"));
          return;
        }

        // Cualquier otro error -> mensaje por defecto
        if (mounted) {
          setPass(false);
          setPlates([
            "No tienes vehiculos registrados, registra vehículos en el perfil",
          ]);
        }
        console.error("Error obteniendo vehículos:", e);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const plate = String(fd.get("plate") ?? "").trim();
    const serviceType = String(fd.get("serviceType") ?? "").trim();
    const courseType = String(fd.get("courseType") ?? "").trim();

    if (serviceType === "COURSE") {
      router.push(
        `/client/services/oficinas-tramites?serviceType=${serviceType}&courseType=${courseType}`
      );
    }else if( serviceType === "SOAT" || serviceType === "TECNO"){
      if (!pass) {
      alert("No puedes solicitar este servicio sin la placa del vehículo");
      return;
    }
      router.push(
        `/client/services/oficinas-tramites?serviceType=${serviceType}&plate=${plate}`
      );
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
      <label htmlFor="serviceType">Tipo de Servicio</label>
      <select
        id="serviceType"
        name="serviceType"
        value={serviceType}
        onChange={(e) => setServiceType(e.target.value)}
        required
      >
        <option value="" disabled>
          Selecciona…
        </option>
        <option value="COURSE">Curso de Conducción</option>
        <option value="SOAT">SOAT</option>
        <option value="TECNO">Tecnomecánica</option>
      </select>

      {serviceType != "COURSE" && (
        <>
          <label htmlFor="plate">Placa</label>
          <select id="plate" name="plate" required>
            {plates.map((y: any) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </>
      )}

      {serviceType == "COURSE" && (
        <>
          <label htmlFor="courseType">Tipo de Curso</label>
          <select id="courseType" name="courseType" required>
            <option value="" disabled>
              Selecciona…
            </option>
            <option value="A1">Curso de Conducción A1</option>
            <option value="A2">Curso de Conducción A2</option>
            <option value="B1">Curso de Conducción B1</option>
            <option value="B2">Curso de Conducción B2</option>
            <option value="B3">Curso de Conducción B3</option>
            <option value="C1">Curso de Conducción C1</option>
            <option value="C2">Curso de Conducción C2</option>
            <option value="C3">Curso de Conducción C3</option>
            <option value="COMPARENDO">Curso de Comparendo</option>
          </select>
        </>
      )}
      <button type="submit">Buscar Oficinas y tramitar servicio</button>
    </form>
  );
}
