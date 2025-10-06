/*
Developed by Tomás Vera & Luis Romero
Version 1.0
Header Admin Component
*/

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import s from "./Header.module.css";

const nav = [
  { href: "/admin", label: "Inicio" },
  { href: "/admin/courses", label: "Cursos" },
  { href: "/admin/register", label: "Usuarios" },
  { href: "/admin/profile", label: "Pefil" }
];

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const norm = (p: string) => p.replace(/\/$/, "") || "/";
  const isActive = (href: string) =>
    norm(href) === "/"
      ? norm(pathname) === "/"
      : norm(pathname).startsWith(norm(href));

  return (
    <header className={s.header}>
      <div className={`container ${s.row}`}>
        <Link href="/" className={s.logo}>
          SmartTraffic
        </Link>

        <nav className={s.desktopNav} aria-label="Principal">
          {nav.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? "page" : undefined}
              className={`${s.link} ${pathname === href ? s.active : ""}`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <button
          className={s.toggle}
          aria-label="Abrir menú"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen(v => !v)}
        >
          <span className={s.bar} />
          <span className={s.bar} />
          <span className={s.bar} />
        </button>
      </div>

      <nav
        id="mobile-nav"
        className={`${s.mobileNav} ${open ? s.mobileNavOpen : ""}`}
        aria-label="Menú móvil"
      >
        {nav.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`${s.mobileLink} ${isActive(href) ? s.active : ""}`}
          >
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
