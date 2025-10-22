import "@/styles/globals.css";
import Link from "next/link";
import { cookies } from "next/headers";

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
  if (!r.ok) return null;
  const data = await r.json().catch(() => ({}));
  return extractJWT(data);
}

async function fetchUser() {
  const jwt = await getBackendJWT();
  if (!jwt) return { ok: false, status: 401, user: null };

  const base = process.env.NEXT_PUBLIC_URL?.replace(/\/+$/,"") || "http://localhost:8080";
  const r = await fetch(`${base}/usr/user`, {
    headers: { Authorization: `Bearer ${jwt}` },
    cache: "no-store",
  });

  if (!r.ok) return { ok: false, status: r.status, user: null };
  try { return { ok: true, status: 200, user: await r.json() }; }
  catch { return { ok: false, status: 500, user: null }; }
}

function normalizeRole(user: any): string {
  const roleRaw =
    user?.role ?? user?.rol ?? user?.Role ??
    user?.roles?.[0]?.name ?? user?.authorities?.[0]?.authority ??
    user?.perfil ?? user?.tipo ?? user?.type ?? user?.userType ?? "";

  if (typeof roleRaw === "number") {
    // ajusta si tu back usa otros IDs
    if (roleRaw === 3) return "ADMIN";
    if (roleRaw === 2) return "EMPLEADO";
  }
  return String(roleRaw || "").toUpperCase().trim();
}

const IS_ADMIN = (r: string) =>
  ["ADMIN", "ROLE_ADMIN", "ADMINISTRADOR", "ROLE_ADMINISTRADOR"].includes(r);
const IS_WORKER = (r: string) =>
  ["WORKER", "EMPLOYEE", "TRABAJADOR", "EMPLEADO", "ROLE_WORKER", "ROLE_EMPLOYEE", "ROLE_EMPLEADO"].includes(r);

async function listCourses(jwt: string, role: string) {
  const base = process.env.NEXT_PUBLIC_URL?.replace(/\/+$/,"") || "http://localhost:8080";

  // Admin: usa coursesData (panel interno)
  if (IS_ADMIN(role)) {
    const r = await fetch(`${base}/coursesData/getAllCourses`, {
      headers: { Authorization: `Bearer ${jwt}` },
      cache: "no-store",
    });
    const text = await r.text().catch(() => "");
    if (!r.ok) return { ok: false, status: r.status, message: text || `Error ${r.status}`, courses: [] };
    try { return { ok: true, status: 200, courses: JSON.parse(text) }; }
    catch { return { ok: true, status: 200, courses: [] }; }
  }

  // Empleado: usa usr/getAllCourses (visible para usuarios)
  if (IS_WORKER(role)) {
    const r = await fetch(`${base}/usr/getAllCourses`, {
      headers: { Authorization: `Bearer ${jwt}` },
      cache: "no-store",
    });
    const text = await r.text().catch(() => "");
    if (!r.ok) return { ok: false, status: r.status, message: text || `Error ${r.status}`, courses: [] };
    try { return { ok: true, status: 200, courses: JSON.parse(text) }; }
    catch { return { ok: true, status: 200, courses: [] }; }
  }

  return { ok: false, status: 403, message: "Rol no permitido", courses: [] };
}

export default async function WorkerCoursesPage() {
  const auth = await fetchUser();

  if (!auth.ok) {
    return (
      <div className="space-y-4">
        <h2>Cursos</h2>
        <p>{auth.status === 401 ? "Sesión expirada. Inicia sesión." : `No se pudo obtener el usuario (error ${auth.status}).`}</p>
        <Link href="/login"><button>Ir a iniciar sesión</button></Link>
      </div>
    );
  }

  const role = normalizeRole(auth.user);
  const isAdmin = IS_ADMIN(role);
  const isWorker = IS_WORKER(role);

  if (!isAdmin && !isWorker) {
    return (
      <div className="space-y-4">
        <h2>Cursos</h2>
        <p>Acceso denegado: requiere rol válido.</p>
        <Link href="/"><button>Volver</button></Link>
      </div>
    );
  }

  const jwt = await getBackendJWT();
  let courses: any[] = [];
  let error: string | null = null;

  if (!jwt) {
    error = "Sesión inválida. Vuelve a iniciar sesión.";
  } else {
    const res = await listCourses(jwt, role);
    if (!res.ok) {
      error = res.status === 403
        ? (isWorker ? "No tienes permisos para ver cursos (empleado)." : "No tienes permisos para ver cursos (admin).")
        : res.message || "No se pudieron cargar los cursos";
    } else {
      courses = Array.isArray(res.courses) ? res.courses : [];
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2>Cursos</h2>
        <div className="flex gap-2">
          {isAdmin && (
            <Link href="/worker/courses/new">
              <button className="inline-flex items-center rounded-lg px-4 py-2 text-sm border hover:bg-black/5 transition">
                Crear curso
              </button>
            </Link>
          )}
          <Link href="/worker">
            <button className="inline-flex items-center rounded-lg px-4 py-2 text-sm border hover:bg-black/5 transition">
              Volver
            </button>
          </Link>
        </div>
      </div>

      {error ? (
        <p>{error}</p>
      ) : !courses || courses.length === 0 ? (
        <p>No hay cursos disponibles.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full border-separate border-spacing-0 rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-black/5 text-left">
                <th className="py-3 pl-4 pr-3 text-sm font-semibold">ID</th>
                <th className="py-3 px-3 text-sm font-semibold">Nombre</th>
                <th className="py-3 px-3 text-sm font-semibold">Cupos usados</th>
                <th className="py-3 px-3 text-sm font-semibold">Capacidad</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c:any, idx:number) => (
                <tr key={c.id} className={idx % 2 ? "bg-white" : "bg-slate-50/60"}>
                  <td className="py-3 pl-4 pr-3 text-sm">{c.id}</td>
                  <td className="py-3 px-3 text-sm">{c.name}</td>
                  <td className="py-3 px-3 text-sm">{c.parcialCapacity ?? 0}</td>
                  <td className="py-3 px-3 text-sm">{c.capacity ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
