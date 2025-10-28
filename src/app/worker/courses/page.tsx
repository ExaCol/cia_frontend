"use client";

import "@/styles/globals.css";
import axios from "axios";
import React from "react";

const url = process.env.NEXT_PUBLIC_URL;
const COURSES_ENDPOINT = "/coursesData/getAllCourses"; // SIN email

// ===== Tipos =====
export type Course = {
  id?: number | string; // se requiere para inscribir
  capacity: number;
  name: string;
  parcialCapacity: number;
  price: number;
  type: string;
};

export default function Courses() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [courses, setCourses] = React.useState<Course[] | null>(null);
  const [userId, setUserId] = React.useState<number | string | null>(null);
  const [enrollingId, setEnrollingId] = React.useState<string | number | null>(null);
  const [successEnrollMsg, setSuccessEnrollMsg] = React.useState<string | null>(null);

  const formatCOP = (n: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setCourses(null);
    setUserId(null);
    setSuccessEnrollMsg(null);

    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    if (!email) {
      setError("Ingresa un email válido.");
      return;
    }

    try {
      setLoading(true);

      // 1) Token
      const tokenResp = await axios.get("/api/auth/token");
      const token = tokenResp.data;

      // 2) Verificar usuario por email -> guardar SOLO el ID
      const userResp = await axios.get(`${url}/usr/userbyemail/${encodeURIComponent(email)}`, {
        headers: { authorization: `Bearer ${token}` },
      });

      if (userResp.status === 200) {
        // 👇 Ajusta si el id del usuario viene con otra clave (p. ej., userId, idusuario, etc.)
        const uid = userResp.data?.id ?? userResp.data?.userId ?? userResp.data?.idusuario;
        if (uid == null) {
          setError("No se pudo determinar el ID del usuario en la respuesta.");
          return;
        }
        setUserId(uid);
        setMessage(`Usuario encontrado: ${email}`);

        // 3) Obtener cursos disponibles (SIN email)
        const coursesResp = await axios.get(`${url}${COURSES_ENDPOINT}`, {
          headers: { authorization: `Bearer ${token}` },
        });

        const rows: Course[] = Array.isArray(coursesResp.data)
          ? coursesResp.data
          : (coursesResp.data?.courses ?? coursesResp.data?.data ?? []);

        setCourses(rows ?? []);
      }
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 404) {
          setError("No existe el usuario con ese email.");
          return;
        }
        if (error.response.status === 401) {
          try {
            await axios.post("/api/auth/logout");
          } finally {
            alert("Sesión expirada. Por favor, inicia sesión nuevamente.");
            window.location.href = "/login";
          }
          return;
        }
        setError(error.response.data || `Error ${error.response.status}`);
      } else {
        setError("Error de red. Intenta nuevamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ===== Inscripción =====
  const handleEnroll = async (courseId: number | string | undefined, courseName: string) => {
    setSuccessEnrollMsg(null);
    setError(null);

    if (!userId) {
      setError("Primero valida el usuario.");
      return;
    }
    if (courseId == null) {
      setError("El curso no tiene ID. No es posible inscribir.");
      return;
    }

    try {
      setEnrollingId(courseId);

      // Token
      const tokenResp = await axios.get("/api/auth/token");
      const token = tokenResp.data;

      // Payload mínimo: userId + courseId
      const payload = {
        userId,       // ajusta el nombre si tu backend espera 'usrId' o similar
        courseId,     // ajusta si espera 'idCourse', etc.
      };

      const resp = await axios.post(`${url}/coursesData/enroll/${payload.userId}/${payload.courseId}`, null, {
        headers: {
          authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (resp.status >= 200 && resp.status < 300) {
        setSuccessEnrollMsg(`Inscripción exitosa en "${courseName}"`);
      } else {
        setError(`No se pudo inscribir (status ${resp.status}).`);
      }
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 401) {
          try {
            await axios.post("/api/auth/logout");
          } finally {
            alert("Sesión expirada. Por favor, inicia sesión nuevamente.");
            window.location.href = "/login";
          }
          return;
        }
        setError(
          (typeof error.response.data === "string"
            ? error.response.data
            : error.response.data?.message) || `Error ${error.response.status}`
        );
      } else {
        setError("Error de red al inscribir. Intenta nuevamente.");
      }
    } finally {
      setEnrollingId(null);
    }
  };

  // Helpers de UI
  const seatsLeft = (c: Course) =>
    typeof c.capacity === "number" && typeof c.parcialCapacity === "number"
      ? Math.max(0, c.capacity - c.parcialCapacity)
      : undefined;

  return (
    <main className="max-w-4xl mx-auto p-4">
      <h1 className="text-xl font-semibold">Consulta de usuario y cursos disponibles</h1>
      <p className="text-gray-600 text-sm mt-1">
        Ingresa el email. Si el usuario existe (HTTP 200), podrás inscribirlo en un curso.
      </p>

      <form onSubmit={handleSubmit} method="get" className="mt-4 flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Email</span>
          <input
            type="email"
            id="email"
            name="email"
            required
            placeholder="usuario@dominio.com"
            className="border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>

        <div className="flex items-center gap-2">
          <button type="submit" disabled={loading} className="rounded-lg bg-blue-600 text-white px-4 py-2 disabled:opacity-60">
            {loading ? "Consultando…" : "Obtener Usuario"}
          </button>
          {(error || message || courses) && (
            <button
              type="button"
              onClick={() => {
                setError(null);
                setMessage(null);
                setCourses(null);
                setUserId(null);
                setSuccessEnrollMsg(null);
              }}
              className="text-sm text-gray-600 hover:underline"
            >
              Limpiar
            </button>
          )}
        </div>
      </form>

      {error && <div className="mt-3 text-red-600 text-sm">{error}</div>}
      {message && <div className="mt-3 text-green-700 text-sm">{message}</div>}
      {successEnrollMsg && <div className="mt-3 text-green-700 text-sm">{successEnrollMsg}</div>}

      {courses && (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-3 py-2 text-left font-medium border-b border-gray-200">capacity</th>
                <th className="px-3 py-2 text-left font-medium border-b border-gray-200">name</th>
                <th className="px-3 py-2 text-left font-medium border-b border-gray-200">parcial capacity</th>
                <th className="px-3 py-2 text-left font-medium border-b border-gray-200">price</th>
                <th className="px-3 py-2 text-left font-medium border-b border-gray-200">type</th>
                <th className="px-3 py-2 text-left font-medium border-b border-gray-200">acciones</th>
              </tr>
            </thead>
            <tbody>
              {courses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-center text-gray-600">Sin cursos disponibles</td>
                </tr>
              ) : (
                courses.map((c, i) => {
                  const left = seatsLeft(c);
                  const full = typeof left === "number" ? left <= 0 : false;
                  const rowId = c.id ?? c.name ?? i;
                  return (
                    <tr key={rowId} className="even:bg-gray-50/50">
                      <td className="px-3 py-2 border-b border-gray-100">{c.capacity}</td>
                      <td className="px-3 py-2 border-b border-gray-100">{c.name}</td>
                      <td className="px-3 py-2 border-b border-gray-100">
                        {c.parcialCapacity}
                        {typeof left === "number" && ` (${left} cupos)`}
                      </td>
                      <td className="px-3 py-2 border-b border-gray-100">{formatCOP(Number(c.price))}</td>
                      <td className="px-3 py-2 border-b border-gray-100">{c.type}</td>
                      <td className="px-3 py-2 border-b border-gray-100">
                        <button
                          type="button"
                          disabled={full || enrollingId === rowId || userId == null || c.id == null}
                          onClick={() => handleEnroll(c.id, c.name)}
                          className="rounded bg-emerald-600 text-white px-3 py-1.5 disabled:opacity-50"
                          title={
                            full
                              ? "Curso sin cupos"
                              : userId == null
                              ? "Valida el usuario primero"
                              : c.id == null
                              ? "Este curso no tiene ID"
                              : "Inscribir usuario"
                          }
                        >
                          {enrollingId === rowId ? "Inscribiendo…" : full ? "Sin cupos" : "Inscribir"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
