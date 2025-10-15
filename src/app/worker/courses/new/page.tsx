// src/app/worker/courses/new/page.tsx
import "@/styles/globals.css";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import CourseCreateForm from "@/components/CourseCreateForm";

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

/** Acepta múltiples formatos de rol que he visto en backends */
function isWorkerOrAdmin(user: any): boolean {
  // posibles ubicaciones/campos
  const roleRaw =
    user?.role ?? user?.rol ?? user?.Role ??
    user?.roles?.[0]?.name ?? user?.authorities?.[0]?.authority ??
    user?.perfil ?? user?.tipo ?? user?.type ?? user?.userType ?? "";

  // numéricos comunes (ajusta si tu back usa otros)
  if (typeof roleRaw === "number") {
    // ej: 2=WORKER, 3=ADMIN (ajusta si aplica)
    return roleRaw === 2 || roleRaw === 3;
  }

  const role = String(roleRaw || "").toUpperCase().trim();

  // variantes comunes
  const allowed = new Set([
    "WORKER",
    "ADMIN",
    "EMPLOYEE",
    "TRABAJADOR",
    "ROLE_WORKER",
    "ROLE_ADMIN",
    "ROLE_EMPLOYEE",
  ]);

  return allowed.has(role);
}

export default async function NewCoursePage() {
  const { ok, status, user } = await fetchUser();

  // Sin sesión o prohibido -> login
  if (!ok && (status === 401 || status === 403)) {
    redirect("/login");
  }

  // Error raro del backend
  if (!ok) {
    return (
      <div className="space-y-4">
        <h2>Crear curso</h2>
        <p>No se pudo obtener la sesión del usuario (error {status}).</p>
        <Link href="/login"><button>Ir a iniciar sesión</button></Link>
      </div>
    );
  }

  // ✅ DEBUG TEMPORAL: muestra qué rol está llegando
  // Quita este bloque cuando validemos el rol correcto
  const debugRole =
    user?.role ?? user?.rol ?? user?.Role ??
    user?.roles?.[0]?.name ?? user?.authorities?.[0]?.authority ??
    user?.perfil ?? user?.tipo ?? user?.type ?? user?.userType ?? "(sin rol)";

  if (!isWorkerOrAdmin(user)) {
    return (
      <div className="space-y-4">
        <h2>Crear curso</h2>
        <p>No tienes permisos para acceder a esta página (se requiere rol Empleado o Admin).</p>
        <p style={{opacity:0.7, fontSize:12}}>
          Rol detectado: <code>{String(debugRole)}</code> (temporal para depurar)
        </p>
        <Link href="/"><button>Volver al inicio</button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2>Crear curso</h2>
        <Link href="/worker/courses"><button>Volver</button></Link>
      </div>
      <CourseCreateForm />
    </div>
  );
}
