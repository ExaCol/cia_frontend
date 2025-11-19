export function formatCOP(value: number | string | null | undefined) {
  const n = typeof value === "string" ? Number(value) : value ?? 0;
  if (!Number.isFinite(n as number)) return "-";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n as number);
}
