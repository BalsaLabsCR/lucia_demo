import { CLINIC, TRUST_CHIPS } from "@/lib/clinic";

/** Franja de señales de confianza: scroll horizontal en móvil, centrada en desktop. */
export function TrustStrip() {
  return (
    <section className="border-y border-arena-200 bg-blanco py-[18px]">
      <div className="flex gap-2.5 overflow-x-auto px-5 text-[13.5px] whitespace-nowrap text-tinta-600 dk:justify-center">
        {TRUST_CHIPS.map((chip) => (
          <span
            key={chip.text}
            className="rounded-full border border-arena-200 px-4 py-[9px]"
          >
            {chip.text}
            {"fictionalNote" in chip && chip.fictionalNote && (
              <em className="ml-1 font-mono text-[10px] not-italic text-ambar-tx">
                {chip.fictionalNote}
              </em>
            )}
          </span>
        ))}
        <a
          href={CLINIC.whatsappHref}
          className="rounded-full border border-menta-200 bg-verde-50 px-4 py-[9px] font-semibold text-verde-800 no-underline"
        >
          WhatsApp directo →
        </a>
      </div>
    </section>
  );
}
