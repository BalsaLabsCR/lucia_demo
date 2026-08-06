import Image from "next/image";
import frontdesk from "@/public/frontdesk.png";
import { CLINIC, STATS } from "@/lib/clinic";
import { OpenChatButton } from "./OpenChatButton";

export function Hero() {
  return (
    <section
      id="inicio"
      className="scroll-mt-[110px] px-5 pt-12 pb-16 dk:px-8 dk:py-[104px]"
    >
      <div className="mx-auto grid max-w-[1160px] grid-cols-1 gap-10 dk:grid-cols-[1.05fr_0.95fr] dk:items-center">
        <div>
          <p className="font-mono text-xs tracking-[0.12em] text-verde-800 uppercase">
            {CLINIC.region}
          </p>

          <h1 className="mt-3.5 font-display text-[clamp(34px,7vw,58px)] leading-[1.08] font-bold tracking-[-0.015em] text-balance">
            {CLINIC.headline}{" "}
            <em className="text-verde-600 italic">{CLINIC.headlineAccent}</em>.
          </h1>

          <p className="mt-[18px] max-w-[52ch] text-[17px] text-tinta-600 text-pretty">
            {CLINIC.intro}
          </p>

          <div className="mt-[26px] flex flex-wrap gap-3">
            <OpenChatButton className="min-h-12 rounded-full bg-verde-600 px-[26px] py-[15px] text-base font-semibold text-blanco transition-colors hover:bg-verde-800">
              Agendar por el chat
            </OpenChatButton>
            <a
              href="#servicios"
              className="inline-flex min-h-12 items-center rounded-full border-[1.5px] border-arena-400 px-6 py-3.5 text-base font-semibold text-tinta-900 no-underline transition-colors hover:border-verde-600 hover:text-verde-800"
            >
              Ver precios
            </a>
          </div>

          <div className="mt-[34px] flex flex-wrap items-center gap-x-[26px] gap-y-2.5 border-t border-arena-200 pt-[22px]">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <strong className="font-display text-[22px]">{stat.value}</strong>
                <span className="block text-[12.5px] text-tinta-500">{stat.label}</span>
              </div>
            ))}
            <span className="rounded-full border border-ambar-bd bg-ambar-bg px-2.5 py-1 font-mono text-[10.5px] tracking-[0.08em] text-ambar-tx">
              CIFRAS FICTICIAS
            </span>
          </div>
        </div>

        {/* Recepción generada con IA: el local no existe, por eso va marcada. */}
        <div className="relative overflow-hidden rounded-2xl border border-arena-200">
          <Image
            src={frontdesk}
            alt="Recepción de la clínica generada con IA: mostrador de madera clara, sala de espera con luz natural y el logo en la pared"
            placeholder="blur"
            priority
            sizes="(max-width: 900px) 100vw, 48vw"
            className="h-auto w-full"
          />
          <span className="absolute bottom-3 left-3.5 rounded-full bg-blanco/85 px-[9px] py-[3px] font-mono text-[10px] tracking-[0.06em] text-verde-950 backdrop-blur-[2px]">
            IMAGEN GENERADA CON IA
          </span>
        </div>
      </div>
    </section>
  );
}
