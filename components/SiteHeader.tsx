import Image from "next/image";
import logo from "@/public/logo-sonrisa-pura.png";
import { CLINIC, NAV_LINKS } from "@/lib/clinic";
import { MobileNav } from "./MobileNav";
import { OpenChatButton } from "./OpenChatButton";

/** Aviso de demo + navegación, pegados juntos arriba de todo. */
export function SiteHeader() {
  return (
    <div className="sticky top-0 z-50">
      <div className="bg-verde-950 px-4 py-[9px] text-center font-mono text-[11.5px] leading-normal tracking-[0.04em] text-[#dfeee7]">
        <span className="mr-[7px] inline-block h-[7px] w-[7px] translate-y-px rounded-full bg-verde-300" />
        SITIO DE DEMOSTRACIÓN — la clínica, el equipo y los testimonios son ficticios.{" "}
        <a href="#lucia" className="text-verde-200 underline">
          El chat con Lucía AI sí es real →
        </a>
      </div>

      <header className="border-b border-arena-200 bg-arena-50/95 backdrop-blur-[10px]">
        <div className="mx-auto flex max-w-[1160px] items-center gap-4 px-4 py-2.5">
          <a
            href="#inicio"
            className="flex min-h-11 items-center gap-2.5 text-tinta-900 no-underline"
          >
            <Image
              src={logo}
              alt=""
              sizes="36px"
              priority
              className="h-9 w-9 object-contain"
            />
            <span className="font-display text-[18px] font-bold tracking-[-0.01em]">
              {CLINIC.shortName}
            </span>
          </a>

          <nav
            aria-label="Principal"
            className="ml-auto hidden gap-[26px] text-[14.5px] font-medium dk:flex"
          >
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="text-tinta-600">
                {link.label}
              </a>
            ))}
          </nav>

          <OpenChatButton className="ml-2 hidden min-h-11 items-center gap-2 rounded-full bg-verde-600 px-5 py-[11px] text-[14.5px] font-semibold text-blanco transition-colors hover:bg-verde-800 dk:inline-flex">
            Hablar con Lucía
          </OpenChatButton>

          <MobileNav />
        </div>
      </header>
    </div>
  );
}
