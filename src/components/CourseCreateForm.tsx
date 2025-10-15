"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CourseCreateForm() {
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !capacity) {
      alert("Nombre y capacidad son obligatorios.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/courses/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // El backend espera estos campos:
        body: JSON.stringify({
          name: name.trim(),
          parcialCapacity: 0,
          capacity: Number(capacity),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.message || "No se pudo crear el curso.");
        return;
      }
      alert("Curso creado con éxito.");
      router.push("/worker/courses"); // ajusta si tu lista está en otra ruta
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-md">
      <div>
        <label className="block text-sm font-medium">Nombre del curso*</label>
        <input
          type="text"
          placeholder="Curso C1..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Capacidad*</label>
        <input
          type="number"
          min={1}
          placeholder="25"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value === "" ? "" : Number(e.target.value))}
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>

      <button
        disabled={loading}
        className="inline-flex items-center rounded px-4 py-2 text-sm border hover:opacity-90"
      >
        {loading ? "Creando..." : "Crear curso"}
      </button>
    </form>
  );
}
