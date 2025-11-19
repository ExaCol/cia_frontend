"use client";

import "@/styles/globals.css";
import axios from "axios";
import React from "react";
import s from "./WorkerCoursesPage.module.css";

const url = process.env.NEXT_PUBLIC_URL;
const COURSES_ENDPOINT = "/coursesData/getAllCourses";
const GET_USERS_BY_COURSE = "/coursesData/getUsrByCourse"; // + /:courseId
const UNROLL_ENDPOINT = "/coursesData/unroll"; // + /:userId/:courseId

// ===== Tipos =====
export type Course = {
  id?: number | string;
  capacity: number;
  name: string;
  parcialCapacity: number;
  price: number;
  type: string;
};

type Usr = {
  id: number | string;
  name: string;
  email?: string;
  raw?: any;
};

export default function Courses() {
  // Estado general
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  // Cursos siempre visibles
  const [courses, setCourses] = React.useState<Course[] | null>(null);
  const [loadingCourses, setLoadingCourses] = React.useState(false);

  // Inscripción (requiere buscar usuario)
  const [userId, setUserId] = React.useState<number | string | null>(null);
  const [findingUser, setFindingUser] = React.useState(false);
  const [enrollingId, setEnrollingId] = React.useState<string | number | null>(null);
  const [successEnrollMsg, setSuccessEnrollMsg] = React.useState<string | null>(null);

  // Ver inscritos / desinscribir
  const [expandedCourseId, setExpandedCourseId] = React.useState<number | string | null>(null);
  const [loadingUsersCourseId, setLoadingUsersCourseId] = React.useState<number | string | null>(
    null
  );
  const [usersByCourse, setUsersByCourse] = React.useState<Record<string | number, Usr[]>>({});
  const [unrollingKey, setUnrollingKey] = React.useState<string | null>(null); // `${courseId}:${userId}`

  const formatCOP = (n: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(n);

  async function getToken(): Promise<string> {
    const tokenResp = await axios.get("/api/auth/token");
    return tokenResp.data;
  }

  function mapUsr(raw: any): Usr {
    const id = raw?.id ?? raw?.userId ?? raw?.idusuario ?? raw?.usrId ?? raw?.idUsr;
    const fallbackParts = [raw?.firstName ?? raw?.nombre1, raw?.lastName ?? raw?.apellido1].filter(
      (v: any) => typeof v === "string" && v.trim() !== ""
    ) as string[];
    const nameCandidate =
      raw?.name ??
      raw?.nombre ??
      (fallbackParts.length ? fallbackParts.join(" ") : undefined);
    const email =
      raw?.email ?? raw?.correo ?? raw?.mail ?? raw?.emailAddress ?? undefined;

    return {
      id: id ?? "NA",
      name:
        typeof nameCandidate === "string" && nameCandidate.trim() !== ""
          ? nameCandidate
          : `Usuario ${id ?? ""}`,
      email,
      raw,
    };
  }

  // ===== Cargar cursos al montar (y botón refrescar) =====
  const loadCourses = React.useCallback(async () => {
    setError(null);
    setMessage(null);
    setLoadingCourses(true);
    try {
      const token = await getToken();
      const coursesResp = await axios.get(`${url}${COURSES_ENDPOINT}`, {
        headers: { authorization: `Bearer ${token}` },
      });
      const rows: Course[] = Array.isArray(coursesResp.data)
        ? coursesResp.data
        : coursesResp.data?.courses ?? coursesResp.data?.data ?? [];
      setCourses(rows ?? []);
    } catch (e: any) {
      if (axios.isAxiosError(e) && e.response?.status === 401) {
        try {
          await axios.post("/api/auth/logout");
        } finally {
          alert("Sesión expirada. Por favor, inicia sesión nuevamente.");
          window.location.href = "/login";
        }
        return;
      }
      setError("No se pudieron cargar los cursos.");
    } finally {
      setLoadingCourses(false);
    }
  }, []);

  React.useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  // ===== Buscar usuario por email (solo para inscribir) =====
  const handleFindUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSuccessEnrollMsg(null);

    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    if (!email) {
      setError("Ingresa un email válido.");
      return;
    }

    try {
      setFindingUser(true);
      const token = await getToken();

      const userResp = await axios.get(
        `${url}/usr/userbyemail/${encodeURIComponent(email)}`,
        {
          headers: { authorization: `Bearer ${token}` },
        }
      );

      if (userResp.status === 200) {
        const uid =
          userResp.data?.id ??
          userResp.data?.userId ??
          userResp.data?.idusuario;
        if (uid == null) {
          setError(
            "No se pudo determinar el ID del usuario en la respuesta."
          );
          return;
        }
        setUserId(uid);
        setMessage(`Usuario encontrado: ${email}`);
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
      setFindingUser(false);
    }
  };

  // ===== Inscripción =====
  const handleEnroll = async (
    courseId: number | string | undefined,
    courseName: string
  ) => {
    setSuccessEnrollMsg(null);
    setError(null);

    if (!userId) {
      setError("Primero busca el usuario por email.");
      return;
    }
    if (courseId == null) {
      setError("El curso no tiene ID. No es posible inscribir.");
      return;
    }

    try {
      setEnrollingId(courseId);
      const token = await getToken();

      const resp = await axios.post(
        `${url}/coursesData/enroll/${userId}/${courseId}`,
        null,
        {
          headers: {
            authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (resp.status >= 200 && resp.status < 300) {
        setSuccessEnrollMsg(`Inscripción exitosa en "${courseName}"`);
        // refrescar inscritos del curso abierto
        if (expandedCourseId === courseId) await fetchUsersByCourse(courseId);
        // actualizar cupo parcial en memoria (+1)
        setCourses(
          (prev) =>
            prev?.map((c) =>
              String(c.id) === String(courseId)
                ? {
                    ...c,
                    parcialCapacity: Number(c.parcialCapacity) + 1,
                  }
                : c
            ) ?? prev
        );
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
            : error.response.data?.message) ||
            `Error ${error.response.status}`
        );
      } else {
        setError("Error de red al inscribir. Intenta nuevamente.");
      }
    } finally {
      setEnrollingId(null);
    }
  };

  // ===== Inscritos por curso =====
  const fetchUsersByCourse = async (courseId: number | string) => {
    try {
      setLoadingUsersCourseId(courseId);
      const token = await getToken();

      const resp = await axios.get(
        `${url}${GET_USERS_BY_COURSE}/${courseId}`,
        {
          headers: { authorization: `Bearer ${token}` },
        }
      );

      const arr = Array.isArray(resp.data)
        ? resp.data
        : resp.data?.data ?? [];
      const mapped: Usr[] = arr.map(mapUsr);
      setUsersByCourse((prev) => ({ ...prev, [courseId]: mapped }));
    } catch (e: any) {
      if (axios.isAxiosError(e) && e.response) {
        if (e.response.status === 401) {
          try {
            await axios.post("/api/auth/logout");
          } finally {
            alert("Sesión expirada. Por favor, inicia sesión nuevamente.");
            window.location.href = "/login";
          }
          return;
        }
        if (e.response.status === 400) {
          setUsersByCourse((prev) => ({ ...prev, [courseId]: [] }));
          return;
        }
        setError(
          (typeof e.response.data === "string"
            ? e.response.data
            : e.response.data?.message) ||
            `Error ${e.response.status} al cargar inscritos`
        );
      } else {
        setError("Error de red al cargar inscritos.");
      }
    } finally {
      setLoadingUsersCourseId(null);
    }
  };

  const toggleCourseUsers = async (courseId: number | string) => {
    if (expandedCourseId === courseId) {
      setExpandedCourseId(null);
      return;
    }
    setExpandedCourseId(courseId);
    await fetchUsersByCourse(courseId);
  };

  // ===== Desinscribir =====
  const handleUnroll = async (courseId: number | string, usrId: number | string) => {
    if (!confirm(`¿Desinscribir al usuario #${usrId} del curso #${courseId}?`))
      return;

    try {
      const key = `${courseId}:${usrId}`;
      setUnrollingKey(key);
      const token = await getToken();

      await axios.delete(`${url}${UNROLL_ENDPOINT}/${usrId}/${courseId}`, {
        headers: { authorization: `Bearer ${token}` },
      });

      // quitar localmente y actualizar cupos
      setUsersByCourse((prev) => {
        const current = prev[courseId] ?? [];
        const next = current.filter((u) => String(u.id) !== String(usrId));
        return { ...prev, [courseId]: next };
      });

      setCourses(
        (prev) =>
          prev?.map((c) =>
            String(c.id) === String(courseId)
              ? {
                  ...c,
                  parcialCapacity: Math.max(
                    0,
                    Number(c.parcialCapacity) - 1
                  ),
                }
              : c
          ) ?? prev
      );
    } catch (e: any) {
      if (axios.isAxiosError(e) && e.response) {
        if (e.response.status === 401) {
          try {
            await axios.post("/api/auth/logout");
          } finally {
            alert("Sesión expirada. Por favor, inicia sesión nuevamente.");
            window.location.href = "/login";
          }
          return;
        }
        alert(
          (typeof e.response.data === "string"
            ? e.response.data
            : e.response.data?.message) ||
            `Error ${e.response.status} al desinscribir`
        );
      } else {
        alert("Error de red al desinscribir.");
      }
    } finally {
      setUnrollingKey(null);
    }
  };

  // Helpers de UI
  const seatsLeft = (c: Course) =>
    typeof c.capacity === "number" && typeof c.parcialCapacity === "number"
      ? Math.max(0, c.capacity - c.parcialCapacity)
      : undefined;

  // ⬇⬇⬇ AQUÍ EMPIEZA EL RETURN NUEVO ⬇⬇⬇
  return (
    <div className={s.page}>
      {/* Encabezado principal */}
      <div className={s.headerRow}>
        <h1 className={s.title}>Gestión de cursos</h1>
        <p className={s.description}>
          Los cursos se cargan automáticamente. Puedes ver inscritos y desinscribir sin
          buscar email. Para inscribir, primero busca el usuario por email.
        </p>
      </div>

      {/* Panel de búsqueda de usuario (solo para inscribir) */}
      <section className={s.card}>
        <h2 className="font-medium mb-2">Buscar usuario para inscribir</h2>
        <form onSubmit={handleFindUser} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Email</span>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="usuario@dominio.com"
              className="border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={findingUser}
              className="rounded-lg bg-blue-600 text-white px-4 py-2 disabled:opacity-60"
            >
              {findingUser ? "Buscando…" : "Buscar usuario"}
            </button>
            <button
              type="button"
              onClick={() => {
                setUserId(null);
                setMessage(null);
                setSuccessEnrollMsg(null);
                setError(null);
              }}
              className="text-sm text-gray-600 hover:underline"
            >
              Limpiar selección de usuario
            </button>
            <span className="text-sm text-gray-700">
              {userId
                ? `Usuario seleccionado (id=${userId})`
                : "Sin usuario seleccionado"}
            </span>
          </div>
        </form>

        {error && <div className="mt-3 text-red-600 text-sm">{error}</div>}
        {message && <div className="mt-3 text-green-700 text-sm">{message}</div>}
        {successEnrollMsg && (
          <div className="mt-3 text-green-700 text-sm">{successEnrollMsg}</div>
        )}
      </section>

      {/* Cursos siempre visibles */}
      <section className={s.card}>
        <div className={s.cardHeaderRow}>
          <h2 className="font-medium">Cursos</h2>
          <button
            type="button"
            onClick={loadCourses}
            disabled={loadingCourses}
            className="text-sm rounded bg-gray-800 text-white px-3 py-1.5 disabled:opacity-60"
          >
            {loadingCourses ? "Actualizando…" : "Refrescar"}
          </button>
        </div>

        <div className={s.tableWrapper}>
          <table className="min-w-full text-sm border-separate border-spacing-0">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium border-b border-gray-200">
                  Capacidad
                </th>
                <th className="px-3 py-2 text-left font-medium border-b border-gray-200">
                  Nombre
                </th>
                <th className="px-3 py-2 text-left font-medium border-b border-gray-200">
                  Capacidad parcial (Disponible)
                </th>
                <th className="px-3 py-2 text-left font-medium border-b border-gray-200">
                  Precio
                </th>
                <th className="px-3 py-2 text-left font-medium border-b border-gray-200">
                  Tipo
                </th>
                <th className="px-3 py-2 text-left font-medium border-b border-gray-200">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {!courses || courses.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-4 text-center text-gray-600"
                  >
                    {loadingCourses
                      ? "Cargando cursos…"
                      : "Sin cursos disponibles"}
                  </td>
                </tr>
              ) : (
                courses.map((c, i) => {
                  const left = seatsLeft(c);
                  const full =
                    typeof left === "number" ? left <= 0 : false;
                  const rowId = c.id ?? c.name ?? i;
                  const isOpen =
                    String(expandedCourseId) === String(rowId);
                  const users = usersByCourse[rowId as any];

                  return (
                    <React.Fragment key={rowId}>
                      <tr className="even:bg-gray-50/50">
                        <td className="px-3 py-2 border-b border-gray-100">
                          {c.capacity}
                        </td>
                        <td className="px-3 py-2 border-b border-gray-100">
                          {c.name}
                        </td>
                        <td className="px-3 py-2 border-b border-gray-100">
                          {c.parcialCapacity}
                          {typeof left === "number" &&
                            ` (${left} cupos)`}
                        </td>
                        <td className="px-3 py-2 border-b border-gray-100">
                          {formatCOP(Number(c.price))}
                        </td>
                        <td className="px-3 py-2 border-b border-gray-100">
                          {c.type}
                        </td>
                        <td className="px-3 py-2 border-b border-gray-100">
                          <div className="flex gap-2 flex-wrap">
                            <button
                              type="button"
                              disabled={
                                full ||
                                enrollingId === rowId ||
                                userId == null ||
                                c.id == null
                              }
                              onClick={() =>
                                handleEnroll(c.id!, c.name)
                              }
                              className="rounded bg-emerald-600 text-white px-3 py-1.5 disabled:opacity-50"
                              title={
                                userId == null
                                  ? "Selecciona un usuario para inscribir"
                                  : full
                                  ? "Curso sin cupos"
                                  : c.id == null
                                  ? "Este curso no tiene ID"
                                  : "Inscribir usuario"
                              }
                            >
                              {enrollingId === rowId
                                ? "Inscribiendo…"
                                : userId == null
                                ? "Inscribir (elige usuario)"
                                : full
                                ? "Sin cupos"
                                : "Inscribir"}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                toggleCourseUsers(rowId as any)
                              }
                              className="rounded bg-slate-600 text-white px-3 py-1.5"
                              title="Ver inscritos del curso"
                            >
                              {loadingUsersCourseId === rowId
                                ? "Cargando…"
                                : isOpen
                                ? "Ocultar inscritos"
                                : "Ver inscritos"}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {isOpen && (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-3 py-3 bg-slate-50 border-b border-gray-200"
                          >
                            {loadingUsersCourseId === rowId ? (
                              <div className="text-sm text-gray-600">
                                Cargando inscritos…
                              </div>
                            ) : users && users.length > 0 ? (
                              <div className={s.innerTableWrapper}>
                                <table className="min-w-full text-xs border-separate border-spacing-0">
                                  <thead>
                                    <tr className="bg-white">
                                      <th className="px-2 py-2 text-left font-medium border-b border-gray-200">
                                        Usuario
                                      </th>
                                      <th className="px-2 py-2 text-left font-medium border-b border-gray-200">
                                        Email
                                      </th>
                                      <th className="px-2 py-2 text-left font-medium border-b border-gray-200">
                                        Acciones
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {users.map((u) => {
                                      const key = `${rowId}:${u.id}`;
                                      const isUnrolling =
                                        unrollingKey === key;
                                      return (
                                        <tr
                                          key={key}
                                          className="even:bg-gray-50/60"
                                        >
                                          <td className="px-2 py-2 border-b border-gray-100">
                                            {u.name}
                                          </td>
                                          <td className="px-2 py-2 border-b border-gray-100">
                                            {u.email ?? "—"}
                                          </td>
                                          <td className="px-2 py-2 border-b border-gray-100">
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleUnroll(
                                                  rowId as any,
                                                  u.id
                                                )
                                              }
                                              disabled={isUnrolling}
                                              className="rounded bg-rose-600 text-white px-2.5 py-1.5 disabled:opacity-50"
                                            >
                                              {isUnrolling
                                                ? "Desinscribiendo…"
                                                : "Desinscribir"}
                                            </button>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="text-sm text-gray-600">
                                Este curso no tiene inscritos.
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
