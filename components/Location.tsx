import { CLINIC } from "@/lib/clinic";
import { PhotoPlaceholder } from "./PhotoPlaceholder";

export function Location() {
  return (
    <section
      id="ubicacion"
      className="scroll-mt-[110px] bg-arena-100 px-5 py-16 dk:px-8 dk:py-[104px]"
    >
      <div className="mx-auto grid max-w-[1160px] grid-cols-1 gap-6 dk:grid-cols-2">
        <div className="rounded-[14px] border border-arena-200 bg-blanco px-6 py-[26px]">
          <h2 className="font-display text-[clamp(26px,4.5vw,34px)] font-bold tracking-[-0.01em]">
            Ubicación y horarios
          </h2>

          <p className="mt-3.5 text-[15px] text-tinta-600 text-pretty">
            {CLINIC.addressLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
            <span className="text-[13.5px] text-tinta-500">{CLINIC.addressNote}</span>
          </p>

          <div className="mt-[18px] border-t border-dotted border-arena-300 pt-3.5 text-[14.5px]">
            {CLINIC.hours.map((entry) => (
              <div key={entry.days} className="flex justify-between gap-3 py-1.5">
                <span className="text-tinta-600">{entry.days}</span>
                <strong className={"closed" in entry && entry.closed ? "text-error-tx" : ""}>
                  {entry.time}
                </strong>
              </div>
            ))}
          </div>

          <div className="mt-[18px] flex flex-wrap gap-2.5">
            <a
              href={CLINIC.phoneHref}
              className="inline-flex min-h-11 items-center rounded-full border-[1.5px] border-verde-600 px-5 py-3 text-[15px] font-semibold text-verde-800 no-underline transition-colors hover:bg-verde-50"
            >
              Llamar · {CLINIC.phone}
            </a>
            <a
              href={CLINIC.whatsappHref}
              className="inline-flex min-h-11 items-center rounded-full border-[1.5px] border-verde-600 px-5 py-3 text-[15px] font-semibold text-verde-800 no-underline transition-colors hover:bg-verde-50"
            >
              WhatsApp
            </a>
          </div>

          <p className="mt-4 text-[12.5px] text-tinta-500">{CLINIC.policies}</p>
        </div>

        <PhotoPlaceholder
          tone="menta"
          label="MAPA · Plaza Vista, Escazú · 16:10"
          className="min-h-[280px] rounded-[14px]"
        />
      </div>
    </section>
  );
}
