import { CLINIC, DIFFERENTIATORS } from "@/lib/clinic";

export function Differentiators() {
  return (
    <section className="bg-arena-100 px-5 py-16 dk:px-8 dk:py-[104px]">
      <div className="mx-auto max-w-[1160px]">
        <h2 className="max-w-[20ch] font-display text-[clamp(26px,4.5vw,38px)] font-bold tracking-[-0.01em] text-balance">
          ¿Por qué elegir {CLINIC.shortName}?
        </h2>

        <div className="mt-[30px] grid grid-cols-1 gap-[22px] dk:grid-cols-4">
          {DIFFERENTIATORS.map((item) => (
            <div key={item.number} className="border-t-2 border-verde-600 pt-3.5">
              <span className="font-display text-[30px] text-verde-600">{item.number}</span>
              <h3 className="mt-1.5 text-[17px] font-bold">{item.title}</h3>
              <p className="mt-[5px] text-sm text-tinta-600 text-pretty">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
