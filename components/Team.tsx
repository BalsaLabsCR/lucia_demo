import Image from "next/image";
import { TEAM } from "@/lib/clinic";

/**
 * Equipo con retratos generados con IA. Las personas no existen: cada tarjeta
 * lo dice explícitamente para que nadie confunda la demo con una clínica real.
 */
export function Team() {
  return (
    <section id="equipo" className="scroll-mt-[110px] px-5 py-16 dk:px-8 dk:py-[104px]">
      <div className="mx-auto max-w-[1160px]">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display text-[clamp(26px,4.5vw,38px)] font-bold tracking-[-0.01em]">
            Nuestro equipo
          </h2>
          <span className="rounded-full border border-ambar-bd bg-ambar-bg px-2.5 py-1 font-mono text-[10.5px] tracking-[0.08em] text-ambar-tx">
            EQUIPO FICTICIO · RETRATOS GENERADOS CON IA
          </span>
        </div>

        <div className="mt-[26px] grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5">
          {TEAM.map((member) => (
            <article
              key={member.name}
              className="overflow-hidden rounded-[14px] border border-arena-200 bg-blanco"
            >
              <div className="relative aspect-4/5 overflow-hidden bg-verde-50">
                <Image
                  src={member.photo}
                  alt={`Retrato generado con IA de ${member.name}, personaje ficticio`}
                  placeholder="blur"
                  sizes="(max-width: 900px) 100vw, 33vw"
                  className="h-full w-full object-cover"
                />
                <span className="absolute bottom-3 left-3.5 rounded-full bg-blanco/85 px-[9px] py-[3px] font-mono text-[10px] tracking-[0.06em] text-verde-950 backdrop-blur-[2px]">
                  IMAGEN GENERADA CON IA
                </span>
              </div>

              <div className="px-5 pt-[18px] pb-[22px]">
                <h3 className="font-display text-[21px] font-bold">{member.name}</h3>
                <p className="mt-0.5 text-[13px] font-semibold text-verde-800">
                  {member.role}
                </p>
                <p className="mt-2 text-sm text-tinta-600 text-pretty">{member.bio}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
