"use client";
import React, {useEffect, useState} from "react";
import axios from "axios";

type Course = {
  id: number;
  name: string;
  parcialCapacity: number;
  capacity: number;
};

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_URL,
  timeout: 10000,
});

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString();
  } catch {
    return iso;
  }
}

function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const tokenRes = await axios.get("/api/auth/token");
        const jwt = tokenRes.data;
        if (!jwt) throw new Error("No se obtuvo token");
        const res = await api.get<Course[]>("/coursesData/getAllCourses", {
          headers: { Authorization: `Bearer ${jwt}` },
        });

        if (mounted) setCourses(res.data);
      } catch (e: any) {
        if (e?.response?.status === 401) {
          setError("Expiró su sesión, cerrando sesión...");
          axios.post("/api/auth/logout").finally(() => {
            window.location.href = "/";
          });
        } else {
          setError(e?.message ?? "Error obteniendo los cursos");
        }
        console.error("Error obteniendo los cursos:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <p>Cargando cursos…</p>;
  if (error) return <p>Error: {error}</p>;
  if (!courses || courses.length === 0) return <p>Sin datos</p>;

  return (
    <div>
      {courses?.length ? (
        <ul>
          {courses.map((c) => (
            <li key={c.id} style={{ marginBottom: 8 }}>
              <div>
                <b>{c.name}</b>
              </div>
              <div>Capacidad parcial: {c.parcialCapacity}</div>
              <div>Capacidad total: {c.capacity}</div>
            </li>
          ))}
        </ul>
      ) : (
        <p>No hay cursos disponibles.</p>
      )}
    </div>
  );
}

export default Courses;