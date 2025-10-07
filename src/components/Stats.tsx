/*
Developed by Tomás Vera & Luis Romero
Version 1.0
Register Vehicle Component
*/
"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_URL,
  timeout: 10000,
});

export default function Stats() {
  const [valorNeto, setValorNeto] = useState<string | null>(null);
  const [guardado, setGuardado] = useState<string | null>(null);
  const [graduados, setGraduados] = useState<string | null>(null);
  const [valorNegocio, setValorNegocio] = useState<string | null>(null);
  const [pagosFecha, setPagosFecha] = useState<string | null>(null);
  const [cat, setCat] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const tokenRes = await axios.get("/api/auth/token");
        const jwt = tokenRes.data;
        if (!jwt) throw new Error("No se obtuvo token");
        const valorN = await api
          .get("/statistics/netWorth", {
            headers: { Authorization: `Bearer ${jwt}` },
          })
          .then((res) => res.data)
          .catch((e: any) => {
            if (e.response.status == 401) {
              axios.post("/api/auth/logout").finally(() => {
                window.location.href = "/";
              });
            }
            setValorNeto(
              JSON.stringify(e?.response?.data ?? { error: e?.message })
            );
            return null;
          });
        const guardado = await api
          .get("/statistics/savedMoney", {
            headers: { Authorization: `Bearer ${jwt}` },
          })
          .then((res) => res.data)
          .catch((e: any) => {
            setGuardado(
              JSON.stringify(e?.response?.data ?? { error: e?.message })
            );
            return null;
          });
        const graduados = await api
          .get("/statistics/graduatedUsr", {
            headers: { Authorization: `Bearer ${jwt}` },
          })
          .then((res) => res.data)
          .catch((e: any) => {
            setGraduados(
              JSON.stringify(e?.response?.data ?? { error: e?.message })
            );
            return null;
          });
        const valorNegocio = await api
          .get("/statistics/businessWorth", {
            headers: { Authorization: `Bearer ${jwt}` },
          })
          .then((res) => res.data)
          .catch((e: any) => {
            setValorNegocio(
              JSON.stringify(e?.response?.data ?? { error: e?.message })
            );
            return null;
          });
        valorN && setValorNeto(JSON.stringify(valorN));
        guardado && setGuardado(JSON.stringify(guardado));
        graduados && setGraduados(JSON.stringify(graduados));
        valorNegocio && setValorNegocio(JSON.stringify(valorNegocio));
      } catch (e: any) {
        if (e.response.status == 401) {
          axios.post("/api/auth/logout").finally(() => {
            window.location.href = "/";
          });
        } else {
          alert(e?.message ?? "Error obteniendo las estadísticas");
        }
        console.error("Error obteniendo las estadísticas:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSubmitDate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const strDarte = String(fd.get("strtDate") ?? "").trim();
    const endDate = String(fd.get("endDate") ?? "").trim();

    (async () => {
      try {
        const tokenRes = await axios.get("/api/auth/token");
        const jwt = tokenRes.data;
        if (!jwt) throw new Error("No se obtuvo token");
        const valorN = await api
          .get(
            "/statistics/paymentNumber?strtDate=" +
              strDarte +
              "&endDate=" +
              endDate,
            {
              headers: { Authorization: `Bearer ${jwt}` },
            }
          )
          .then((res) => res.data)
          .catch((e: any) => {
            console.error(e.response);
            setPagosFecha(JSON.stringify(e.response.data));
            return null;
          });
        valorN && setPagosFecha(JSON.stringify(valorN));
      } catch (e: any) {
        if (e.response.status == 401) {
          axios.post("/api/auth/logout").finally(() => {
            window.location.href = "/";
          });
        } else {
          alert(e?.message ?? "Error obteniendo las estadísticas");
        }
        console.error("Error obteniendo las estadísticas:", e);
      }
    })();
  };

  const handleSubmitCat = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const type = String(fd.get("type") ?? "").trim();

    (async () => {
      try {
        const tokenRes = await axios.get("/api/auth/token");
        const jwt = tokenRes.data;
        if (!jwt) throw new Error("No se obtuvo token");
        const valorN = await api
          .get(
            "/statistics/earningsByCat?type=" +
              type,
            {
              headers: { Authorization: `Bearer ${jwt}` },
            }
          )
          .then((res) => res.data)
          .catch((e: any) => {
            console.error(e.response);
            setCat(JSON.stringify(e.response.data));
            return null;
          });
        valorN && setCat(JSON.stringify(valorN));
      } catch (e: any) {
        if (e.response.status == 401) {
          axios.post("/api/auth/logout").finally(() => {
            window.location.href = "/";
          });
        } else {
          alert(e?.message ?? "Error obteniendo las estadísticas");
        }
        console.error("Error obteniendo las estadísticas:", e);
      }
    })();
  };


  if (loading) return <p>Cargando perfil…</p>;

  return (
    <div style={{ margin: "0 auto", marginLeft: 10 }}>
      <section style={{ marginBottom: 16 }}>
        <p>
          <b>Ganancia del negocio:</b> {valorNeto}
        </p>
        <p>
          <b>Dinero total ahorrado por los usuarios:</b> {guardado}
        </p>
        <p>
          <b>Usuarios Graduados:</b> {graduados}
        </p>
        <p>
          <b>Comisión cobrada:</b> {valorNegocio}
        </p>

        <form onSubmit={handleSubmitDate}>
          <label htmlFor="strtDate">Fecha de Inicio</label>
          <input id="strtDate" name="strtDate" type="date" required />
          <label htmlFor="endDate">Fecha de Finalización</label>
          <input id="endDate" name="endDate" type="date" required />
          <button type="submit">Buscar</button>
          <p>
            <b>Pagos por fecha:</b> {pagosFecha}
          </p>
        </form>

        <form onSubmit={handleSubmitCat}>
          <label htmlFor="type">Categoría</label>
          <select id="type" name="type" defaultValue="SIMIT" required>
            <option value="SIMIT">SIMIT</option>
            <option value="COURSE">Curso de Conducción</option>
            <option value="TECNO">Tecnomecánica</option>
            <option value="SOAT">SOAT</option>
          </select>
          <button type="submit">Buscar</button>
          <p>
            <b>Pagos por Categoría:</b> {cat}
          </p>
        </form>
      </section>
    </div>
  );
}
