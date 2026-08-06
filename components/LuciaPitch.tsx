import { CLINIC, LUCIA_CAPABILITIES } from "@/lib/clinic";
import { OpenChatButton } from "./OpenChatButton";

/** La única sección oscura del sitio: acá vive el producto real. */
export function LuciaPitch() {
  return (
    <section
      id="lucia"
      className="scroll-mt-[110px] bg-verde-950 px-5 py-[72px] text-crema-100 dk:px-8 dk:py-[104px]"
    >
      <div className="mx-auto grid max-w-[1160px] grid-cols-1 gap-10 dk:grid-cols-2 dk:items-start">
        <div>
          <p className="font-mono text-xs tracking-[0.12em] text-verde-200 uppercase">
            El producto real de esta demo
          </p>

          <h2 className="mt-3.5 font-display text-[clamp(28px,5.5vw,44px)] leading-[1.12] font-bold tracking-[-0.015em] text-balance">
            Todo lo de arriba es una fachada.{" "}
            <em className="text-verde-200 italic">Lucía no.</em>
          </h2>

          <p className="mt-4 max-w-[50ch] text-base text-crema-300 text-pretty">
            Lucía es una asistente con IA que atiende a los clientes de su negocio por
            WhatsApp y por chat web. En este sitio está conectada de verdad: abra el chat y
            consúltele lo que necesite sobre la clínica.
          </p>

          <div className="mt-[26px] flex flex-wrap gap-3">
            <OpenChatButton className="min-h-12 rounded-full bg-blanco px-[26px] py-[15px] text-base font-bold text-verde-950 transition-colors hover:bg-verde-100">
              Probar el chat ahora
            </OpenChatButton>
            <a
              href={CLINIC.whatsappHref}
              className="inline-flex min-h-12 items-center rounded-full border-[1.5px] border-verde-700 px-6 py-3.5 text-base font-semibold text-crema-100 no-underline transition-colors hover:border-verde-200 hover:text-crema-100"
            >
              Verla en WhatsApp
            </a>
          </div>
        </div>

        <ul className="flex list-none flex-col rounded-[14px] border border-verde-200/20 bg-blanco/5 px-[22px] py-2">
          {LUCIA_CAPABILITIES.map((capability, index) => (
            <li
              key={capability}
              className={`flex gap-3 py-3.5 ${
                index < LUCIA_CAPABILITIES.length - 1
                  ? "border-b border-verde-200/15"
                  : ""
              }`}
            >
              <span className="font-bold text-verde-200" aria-hidden="true">
                ✓
              </span>
              <span className="text-[15px] text-crema-200">{capability}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
