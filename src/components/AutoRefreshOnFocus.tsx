"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AutoRefreshOnFocus() {
  const router = useRouter();

  useEffect(() => {
    const refresh = () => router.refresh();

    // Al volver el foco a la pestaña o al cambiar visibilidad -> refrescar
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) refresh();
    });

    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh as any);
    };
  }, [router]);

  return null;
}
