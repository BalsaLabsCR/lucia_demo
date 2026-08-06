import { FAQS } from "@/lib/clinic";

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-[110px] px-5 py-16 dk:px-8 dk:py-[104px]">
      <div className="mx-auto max-w-[760px]">
        <h2 className="font-display text-[clamp(26px,4.5vw,38px)] font-bold tracking-[-0.01em]">
          Preguntas frecuentes
        </h2>

        <div className="mt-[22px] flex flex-col gap-2.5">
          {FAQS.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-[14px] border border-arena-200 bg-blanco px-5"
            >
              <summary className="flex min-h-11 items-center justify-between gap-3 py-[17px] text-base font-semibold">
                {faq.question}
                <span
                  aria-hidden="true"
                  className="text-xl font-normal text-verde-600 transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="pb-[18px] text-[14.5px] text-tinta-600 text-pretty">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
