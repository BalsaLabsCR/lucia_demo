import type { ConversationDirective } from "@/lib/copilot";

/**
 * Las directivas vigentes: lo único del copiloto que cambia lo que un cliente
 * escucha.
 *
 * Por eso esta lista dice tres cosas que ninguna otra parte del panel dice:
 * hasta CUÁNDO vive, CUÁNDO se usa, y que NO se usa siempre. La última es la que
 * más importa: sin ella, quien la aprueba se imagina a Lucía vendiendo el
 * servicio en cada conversación, que es exactamente lo que no pasa.
 */
export function DirectiveList({
  directives,
  ocupado,
  onDeactivate,
  presentacion,
}: {
  directives: ConversationDirective[];
  ocupado: boolean;
  onDeactivate: (directive: ConversationDirective) => void;
  presentacion: boolean;
}) {
  if (directives.length === 0) {
    return (
      <p className="rounded-xl border border-arena-200 bg-blanco px-4 py-5 text-[14px] text-tinta-500">
        No hay ninguna directiva activa. Lucía está conversando con sus reglas de siempre.
      </p>
    );
  }

  return (
    <ul aria-label="Directivas activas" className="flex flex-col gap-3">
      {directives.map((directive) => (
        <li
          key={directive.id}
          className="rounded-xl border border-menta-200 bg-verde-50 p-4 shadow-suave"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3
              className={`font-display text-tinta-900 ${
                presentacion ? "text-[22px]" : "text-[17px]"
              }`}
            >
              {directive.title}
            </h3>
            <span className="shrink-0 rounded-full border border-menta-300 bg-blanco px-2.5 py-0.5 font-mono text-[10.5px] tracking-[0.06em] text-verde-800">
              {directive.daysRemaining === 0
                ? "Vence hoy"
                : `Vence en ${directive.daysRemaining} día${directive.daysRemaining === 1 ? "" : "s"}`}
            </span>
          </div>

          <p className={`mt-1.5 text-tinta-600 ${presentacion ? "text-[16px]" : "text-[14px]"}`}>
            {directive.goal}
          </p>

          <div className="mt-3 rounded-lg border border-menta-200 bg-blanco p-3">
            <p className="font-mono text-[10px] tracking-[0.08em] text-tinta-500 uppercase">
              Solo se usa cuando
            </p>
            <ul className="mt-1 flex flex-col gap-0.5">
              {directive.triggerConditions.map((condition) => (
                <li key={condition} className="text-[13.5px] text-tinta-600">
                  · {condition}
                </li>
              ))}
            </ul>
            <p className="mt-2 border-t border-arena-200 pt-2 text-[12.5px] text-tinta-500">
              No se aplica en todas las conversaciones. Si la persona pregunta otra cosa, Lucía
              responde eso; si no muestra interés, no insiste.
            </p>
          </div>

          {directive.prohibitedClaims.length > 0 && !presentacion && (
            <p className="mt-2 text-[12.5px] text-tinta-500">
              No puede afirmar: {directive.prohibitedClaims.join(" · ")}
            </p>
          )}

          <button
            type="button"
            disabled={ocupado}
            onClick={() => onDeactivate(directive)}
            className="mt-3 rounded-lg border-[1.5px] border-arena-300 bg-blanco px-3.5 py-2 text-[13px] font-semibold text-tinta-600 transition-colors hover:bg-arena-50 disabled:opacity-50"
          >
            Desactivar ahora
          </button>
        </li>
      ))}
    </ul>
  );
}
