import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  // Placeholder: todavía no hay endpoint de backend para cancelar servicios.
  return NextResponse.json(
    {
      ok: false,
      message:
        "La cancelación no está disponible porque el backend no expone un endpoint para cancelar servicios.",
      serviceId: id,
    },
    { status: 501 }
  );
}
