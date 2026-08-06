import { TESTIMONIALS } from "@/lib/clinic";

export function Testimonials() {
  return (
    <section className="bg-blanco px-5 py-16 dk:px-8 dk:py-[104px]">
      <div className="mx-auto max-w-[1160px]">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display text-[clamp(26px,4.5vw,38px)] font-bold tracking-[-0.01em]">
            Lo que dicen los pacientes
          </h2>
          <span className="rounded-full border border-ambar-bd bg-ambar-bg px-2.5 py-1 font-mono text-[10.5px] tracking-[0.08em] text-ambar-tx">
            TESTIMONIOS FICTICIOS
          </span>
        </div>

        <div className="mt-[26px] grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5">
          {TESTIMONIALS.map((item) => (
            <figure
              key={item.quote}
              className="rounded-[14px] border border-arena-200 bg-arena-50 p-6"
            >
              <span
                aria-hidden="true"
                className="block font-display text-[44px] leading-[0.6] text-verde-600"
              >
                &ldquo;
              </span>
              <blockquote className="mt-2.5 font-display text-[17px] leading-[1.5] text-pretty">
                {item.quote}
              </blockquote>
              <figcaption className="mt-3.5 font-mono text-[12.5px] text-tinta-500">
                {item.author}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
