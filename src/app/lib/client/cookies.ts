/*
Developed by Tomás Vera & Luis Romero
Version 1.0
Cookies management (client side)
*/
"use client";

export function getCookieRaw(name: string): string | null {
  if (typeof document === "undefined") return null;
  const key = name.replace(/[-.+*]/g, "\\$&");
  const match = document.cookie.match(new RegExp('(?:^|; )' + key + '=([^;]*)'));
  return match ? match[1] : null;
}

export function readAuthCookie(): { token: string | null; role: string | null; email: string | null } | null {
  const raw = getCookieRaw("auth");
  if (!raw) return null;
  try {
    const decoded = decodeURIComponent(raw);
    const obj = JSON.parse(decoded);
    return {
      token: typeof obj?.token === "string" ? obj.token : null,
      role: typeof obj?.role === "string" ? obj.role : null,
      email: typeof obj?.email === "string" ? obj.email : null,
    };
  } catch (e) {
    console.warn("readAuthCookie parse error:", e);
    return null;
  }
}

export function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; Path=/; Max-Age=0;`;
}
