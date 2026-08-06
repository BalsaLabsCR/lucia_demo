"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import logo from "@/public/logo-sonrisa-pura.png";
import { openLuciaChat } from "@/lib/chatEvents";
import { CLINIC, NAV_LINKS } from "@/lib/clinic";

/**
 * Navegación móvil: botón hamburguesa + overlay a pantalla completa.
 * En desktop (≥900px) no se muestra; ahí van los links inline del header.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);

  // Esc cierra, y mientras está abierto no se scrollea el fondo.
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
        aria-expanded={open}
        className="ml-auto grid h-[46px] w-[46px] place-items-center rounded-xl border border-arena-200 bg-blanco text-tinta-900 dk:hidden"
      >
        <span className="block h-0.5 w-[18px] rounded-sm bg-tinta-900 shadow-[0_-6px_0_var(--color-tinta-900),0_6px_0_var(--color-tinta-900)]" />
      </button>

      {/*
        Portal a <body>: el header usa backdrop-filter, que crea un bloque
        contenedor y dejaría este overlay `fixed` atrapado dentro del header.
      */}
      {open &&
        createPortal(
          <div
            role="dialog"
            aria-label="Menú"
            aria-modal="true"
            className="fixed inset-0 z-90 flex flex-col bg-arena-50 px-5 pt-4 pb-[calc(24px+env(safe-area-inset-bottom))] dk:hidden"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2.5">
                <Image src={logo} alt="" sizes="36px" className="h-9 w-9 object-contain" />
                <span className="font-display text-[18px] font-bold">
                  {CLINIC.shortName}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú"
                className="h-[46px] w-[46px] rounded-xl border border-arena-200 bg-blanco text-xl leading-none text-tinta-900"
              >
                ×
              </button>
            </div>

            <nav
              aria-label="Menú móvil"
              className="mt-7 flex flex-col border-t border-arena-200"
            >
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`border-b border-arena-200 px-1 py-4 font-display text-[27px] font-semibold ${
                    link.highlight ? "text-verde-800" : "text-tinta-900"
                  }`}
                >
                  {link.label}
                  {link.highlight && (
                    <span className="ml-1.5 rounded-full bg-verde-100 px-[9px] py-1 align-[4px] font-mono text-[10.5px] tracking-[0.08em] text-verde-800">
                      REAL
                    </span>
                  )}
                </a>
              ))}
            </nav>

            <div className="mt-auto flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  openLuciaChat();
                }}
                className="rounded-full bg-verde-600 p-4 text-base font-semibold text-blanco"
              >
                Hablar con Lucía ahora
              </button>
              <a
                href={CLINIC.phoneHref}
                className="rounded-full border-[1.5px] border-verde-600 p-3.5 text-center text-base font-semibold text-verde-800 no-underline"
              >
                Llamar · {CLINIC.phone}
              </a>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
