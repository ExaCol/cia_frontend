import "@/styles/globals.css";
import Link from "next/link";
import { cookies } from "next/headers";
import CourseEnrollButton, { Course } from "@/components/CourseEnrollButton";

function extractJWT(anyVal: any): string | null {
  if (typeof anyVal === "string" && anyVal.split(".").length === 3) return anyVal;
  if (anyVal?.token && typeof anyVal.token === "string" && anyVal.token.split(".").length === 3) return anyVal.token;
  if (anyVal?.data?.token && typeof anyVal.data.token === "string" && anyVal.data.token.split(".").length === 3) return anyVal.data.token;
  if (anyVal?.backendToken && typeof anyVal.backendToken === "string" && anyVal.backendToken.split(".").length === 3) return anyVal.backendToken;
  return null;
}

async function getBackendJWT() {
  const cookieHeader = (await cookies()).getAll().map(c => `${c.name}=${c.value}`).join("; ");
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/,"") || "http://localhost:3000";
  const r = await fetch(`${site}/api/auth/token`, { headers: { Cookie: cookieHeader }, cache: "no-store" });
  if (!r.ok) throw new Error("Sesión expirada");
  const data = await r.json().catch(() => ({}));
  const jwt = extractJWT(data);
  if (!jwt) throw new Error("Token inválido");
  return jwt;
}

async function getJSON<T=any>(path: string): Promise<T> {
  const jwt = await getBackendJWT();
  const base = process.env.NEXT_PUBLIC_URL?.replace(/\/+$/,"") || "http://localhost:8080";
  const r = await fetch(`${base}${path}`, { headers: { Authorization: `Bearer ${jwt}` }, cache: "no-store" });
  if (!r.ok) {
    const text = await r.text().catch(()=>"");
    try { const j = JSON.parse(text); throw new Error(j?.message || j?.error || text || `Error ${r.status}`); }
    catch { throw new Error(text || `Error ${r.status}`); }
  }
  try { return await r.json(); } catch { return [] as any; }
}

export default async function ClientCoursesPage() {
  let allCourses: Course[] = [];
  let myCourses: Course[] = [];
  let error: string | null = null;

  try {
    // Endpoints USR (Postman):
    // - GET /usr/getAllCourses
    // - GET /usr/courseByUser
    allCourses = await getJSON<Course[]>("/usr/getAllCourses");
    myCourses = await getJSON<Course[]>("/usr/courseByUser");
  } catch (e:any) {
    error = e?.message || "No se pudo cargar cursos";
  }

  // para no mostrar "inscribirme" en cursos ya inscritos
  const myIds = new Set((myCourses || []).map(c => c.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2>Mis cursos</h2>
        <Link href="/client">
          <button>Volver</button>
        </Link>
      </div>

      {error && <p>{error}</p>}

      <section className="space-y-2">
        <h3 className="text-lg font-semibold">Inscritos</h3>
        {(!myCourses || myCourses.length === 0) ? (
          <p>No estás inscrito en ningún curso.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Curso</th>
                <th>Cupos usados</th>
                <th>Cupos totales</th>
              </tr>
            </thead>
            <tbody>
              {myCourses.map(c => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td>{c.name}</td>
                  <td>{c.parcialCapacity ?? "-"}</td>
                  <td>{c.capacity ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold">Cursos disponibles</h3>
        {(!allCourses || allCourses.length === 0) ? (
          <p>No hay cursos disponibles.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Curso</th>
                <th>Cupos usados</th>
                <th>Cupos totales</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {allCourses.map(c => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td>{c.name}</td>
                  <td>{c.parcialCapacity ?? "-"}</td>
                  <td>{c.capacity ?? "-"}</td>
                  <td>
                    {myIds.has(c.id) ? (
                      <span className="opacity-60 text-sm">Ya inscrito</span>
                    ) : (
                      <CourseEnrollButton course={c} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
