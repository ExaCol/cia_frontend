/*
Developed by Tomás Vera & Luis Romero
Version 1.1
Header Worker Component
*/

"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import s from "./Header.module.css";

const nav = [
  { href: "/worker", label: "Inicio" },
  { href: "/worker/courses", label: "Cursos" },
  { href: "/worker/register", label: "Usuarios" },
  { href: "/worker/profile", label: "Perfil" },
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
        {/* Logo igual que en client, pero apuntando a /worker */}
        <Link href="/worker" className={s.logo}>
          <Image
            src="/smarttraffic-logo.png"
            alt="SmartTraffic"
            width={72}
            height={72}
          />
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
          onClick={() => setOpen((v) => !v)}
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
