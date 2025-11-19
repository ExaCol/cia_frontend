"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

function cx(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function PaymentsMenu() {
  const pathname = usePathname();
  const [counts, setCounts] = useState<{ total: number; pending: number }>({ total: 0, pending: 0 });

  useEffect(() => {
    let alive = true;
    fetch("/api/payments/counts", { cache: "no-store" })
      .then(r => r.json())
      .then((j) => { if (alive) setCounts({ total: j?.total ?? 0, pending: j?.pending ?? 0 }); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const isPayments = pathname?.startsWith("/client/payments");

  return (
    <div className="relative group">
      <button
        className={cx(
          "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition",
          isPayments ? "bg-indigo-600 text-white shadow-sm" : "text-slate-700 hover:bg-black/5"
        )}
      >
        Pagos
        {counts.pending > 0 && (
          <span className="ml-1 inline-flex items-center justify-center rounded-full bg-amber-500 text-white text-[10px] h-4 min-w-4 px-1">
            {counts.pending}
          </span>
        )}
        <svg className="ml-1 h-3.5 w-3.5 opacity-70" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.08 1.04l-4.25 4.25a.75.75 0 0 1-1.06 0L5.21 8.27a.75.75 0 0 1 .02-1.06z" />
        </svg>
      </button>

      {/* Dropdown */}
      <div className="invisible absolute right-0 z-50 mt-2 w-56 rounded-xl border bg-white p-1 shadow-lg opacity-0 transition group-hover:visible group-hover:opacity-100">
        <Link
          href="/client/payments"
          className={cx(
            "flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-black/5",
            pathname === "/client/payments" ? "bg-black/5" : ""
          )}
        >
          Historial
          <span className="text-[10px] rounded-full border bg-white px-1.5 py-0.5 text-slate-600">{counts.total}</span>
        </Link>
        <Link
          href="/client/payments/pending"
          className={cx(
            "flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-black/5",
            pathname?.startsWith("/client/payments/pending") ? "bg-black/5" : ""
          )}
        >
          Pagos pendientes
          {counts.pending > 0 ? (
            <span className="text-[10px] rounded-full bg-amber-500 text-white px-1.5 py-0.5">{counts.pending}</span>
          ) : (
            <span className="text-[10px] rounded-full border bg-white px-1.5 py-0.5 text-slate-600">0</span>
          )}
        </Link>
      </div>
    </div>
  );
}
