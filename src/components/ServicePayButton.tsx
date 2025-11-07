"use client";

import { useState } from "react";

type Props = {
  serviceId: number | string;
  className?: string;   // personalizar desde fuera si quieres
  label?: string;       // cambiar el texto del botón
};

export default function ServicePayButton({
  serviceId,
  className = "",
  label = "Pagar",
}: Props) {
  const [loading, setLoading] = useState(false);

  const MP_BASE =
    process.env.NEXT_PUBLIC_MP_MARKET_URL || "https://www.mercadopago.com.co";

  const handlePay = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.message || "No fue posible iniciar el pago");
        return;
      }

      // Mercado Pago directo
      const mpDirect =
        data?.init_point ||
        data?.sandbox_init_point ||
        data?.preference?.init_point ||
        data?.preference?.sandbox_init_point;

      // Mercado Pago: construir con pref_id
      const prefId =
        data?.id ||
        data?.preferenceId ||
        data?.preference_id ||
        data?.preference?.id;

      const fromPrefId = prefId
        ? `${MP_BASE}/checkout/v1/redirect?pref_id=${encodeURIComponent(
            prefId
          )}`
        : null;

      // Otros nombres comunes
      const candidates = [
        mpDirect,
        fromPrefId,
        data?.url,
        data?.checkoutUrl,
        data?.webUrl,
        data?.paymentUrl,
        data?.redirectUrl,
        data?.data?.url,
        data?.redirect?.url,
        data?.processUrl,
        data?.data?.processUrl,
        data?.links?.approval_url,
        data?.approvalUrl,
        data?.checkout?.url,
        data?.payment_link,
        data?.hosted_url,
        data?.sessionUrl,
      ].filter(Boolean) as string[];

      if (
        !candidates.length &&
        typeof data?.message === "string" &&
        /^https?:\/\//.test(data.message)
      ) {
        candidates.push(data.message);
      }

      const url = candidates.find((u) => /^https?:\/\//.test(u));
      if (url) {
        window.location.assign(url);
        return;
      }

      console.warn("Checkout payload sin URL reconocible:", data);
      alert("No se recibió una URL válida de checkout.");
    } catch (e: any) {
      alert("Error iniciando el pago: " + String(e));
    } finally {
      setLoading(false);
    }
  };

  if (!serviceId && serviceId !== 0) return null;

  return (
    <button
      onClick={handlePay}
      disabled={loading}
      aria-label={label}
      title={label}
      className={[
        // estilo primario por defecto
        "inline-flex items-center justify-center gap-2",
        "rounded-xl px-4 py-2 text-sm font-semibold",
        "bg-indigo-600 text-white hover:bg-indigo-500",
        "border border-indigo-600 shadow-sm",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        // permitir personalización externa
        className,
      ].join(" ")}
    >
      {loading ? "Redirigiendo..." : label}
    </button>
  );
}
