import Image from "next/image";
import logo from "@/public/logo-sonrisa-pura.png";
import { CLINIC } from "@/lib/clinic";

const FOOTER_LINKS = [
  { href: "#servicios", label: "Servicios" },
  { href: "#equipo", label: "Equipo" },
  { href: "#lucia", label: "Lucía AI", highlight: true },
  { href: "#ubicacion", label: "Ubicación" },
];

export function SiteFooter() {
  return (
    <footer className="bg-verde-950 px-5 pt-13 pb-[calc(96px+env(safe-area-inset-bottom))] text-crema-300">
      <div className="mx-auto max-w-[1160px]">
        <div className="rounded-[14px] border border-verde-200/25 bg-blanco/[0.06] px-[22px] py-5">
          <p className="font-mono text-[11px] tracking-[0.1em] text-verde-200">AVISO LEGAL</p>
          <p className="mt-2 text-[13.5px] leading-[1.65] text-pretty">
            {CLINIC.name} no existe. La clínica, el equipo, las cifras y los testimonios de
            este sitio son ficticios, y las fotos del local y del equipo son imágenes
            generadas con IA: no corresponden a personas ni a lugares reales. Todo se creó
            únicamente para demostrar{" "}
            <strong className="text-crema-100">Lucía AI</strong>, una asistente virtual para
            negocios. El chat es real y sus respuestas las genera una inteligencia
            artificial: no envíe datos personales verdaderos.
          </p>
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-x-8 gap-y-4 text-[13.5px]">
          <span className="flex items-center gap-2.5">
            <Image src={logo} alt="" sizes="36px" className="h-9 w-9 object-contain" />
            <span className="font-display text-[18px] font-bold text-crema-100">
              {CLINIC.shortName}
            </span>
          </span>

          <nav aria-label="Footer" className="flex flex-wrap gap-[18px]">
            {FOOTER_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={link.highlight ? "text-verde-200" : "text-crema-300"}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <span className="text-[12.5px] text-crema-500">
            Demo creada para mostrar Lucía AI · 2026
          </span>
        </div>
      </div>
    </footer>
  );
}
