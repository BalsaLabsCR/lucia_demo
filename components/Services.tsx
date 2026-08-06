import { SERVICES } from "@/lib/clinic";
import { OpenChatButton } from "./OpenChatButton";

/** Tarifario como lista con líneas punteadas (no cards): 1 columna → 2 en desktop. */
export function Services() {
  return (
    <section
      id="servicios"
      className="scroll-mt-[110px] px-5 py-16 dk:px-8 dk:py-[104px]"
    >
      <div className="mx-auto max-w-[1160px]">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="font-display text-[clamp(26px,4.5vw,38px)] font-bold tracking-[-0.01em]">
            Servicios y precios
          </h2>
          <p className="text-[13.5px] text-tinta-500">
            Presupuesto por escrito, siempre antes de empezar.
          </p>
        </div>

        <div className="mt-[22px] grid grid-cols-1 rounded-[14px] border border-arena-200 bg-blanco px-[22px] py-2.5 dk:grid-cols-2 dk:gap-x-16">
          {SERVICES.map((service, index) => (
            <div
              key={service.name}
              className={`py-4 ${
                index < SERVICES.length - 1 ? "border-b border-dotted border-arena-300" : ""
              }`}
            >
              <div className="flex items-baseline gap-2.5">
                <span className="text-base font-semibold">{service.name}</span>
                <span className="flex-1 border-b-2 border-dotted border-arena-300" />
                <span
                  className={`font-display font-semibold whitespace-nowrap ${
                    service.priceIsText ? "text-[15px] text-tinta-600" : "text-[17px]"
                  }`}
                >
                  {service.pricePrefix && (
                    <em className="text-xs not-italic text-tinta-500">
                      {service.pricePrefix}{" "}
                    </em>
                  )}
                  {service.price}
                </span>
              </div>
              <p className="mt-[3px] text-[13.5px] text-tinta-500">{service.description}</p>
            </div>
          ))}
        </div>

        <p className="mt-4 text-[13.5px] text-tinta-500">
          ¿Tiene dudas sobre un tratamiento?{" "}
          <OpenChatButton className="px-1 py-0.5 text-[13.5px] font-semibold text-verde-800 underline">
            Consulte a Lucía en el chat
          </OpenChatButton>{" "}
          — responde con esta misma información.
        </p>
      </div>
    </section>
  );
}
