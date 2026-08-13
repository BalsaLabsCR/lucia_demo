import { SEVERITY_LABELS, dateTime, formatEvidence, type BusinessSignal } from "@/lib/copilot";

/**
 * Las alertas: qué detectaron las reglas, con su evidencia resumida.
 *
 * Cada una dice de qué métricas salió. Es la diferencia entre una alerta que se
 * puede verificar y una que hay que creer — y la segunda deja de leerse a la
 * tercera vez que aparece.
 */
export function SignalList({
  signals,
  presentacion,
}: {
  signals: BusinessSignal[];
  presentacion: boolean;
}) {
  if (signals.length === 0) {
    return (
      <p className="rounded-xl border border-menta-200 bg-verde-50 px-4 py-5 text-[14px] text-verde-800">
        Ninguna regla se disparó con los datos de este período. No quiere decir que todo esté
        perfecto: quiere decir que nada cruzó los umbrales configurados.
      </p>
    );
  }

  return (
    <ul aria-label="Alertas detectadas" className="flex flex-col gap-3">
      {signals.map((signal) => (
        <SignalCard key={signal.id} signal={signal} presentacion={presentacion} />
      ))}
    </ul>
  );
}

const SEVERITY_CLASSES: Record<string, string> = {
  critical: "border-error-bd bg-error-bg text-error-tx",
  warning: "border-ambar-bd bg-ambar-bg text-ambar-tx",
  info: "border-arena-300 bg-arena-100 text-tinta-600",
};

function SignalCard({
  signal,
  presentacion,
}: {
  signal: BusinessSignal;
  presentacion: boolean;
}) {
  return (
    <li className="rounded-xl border border-arena-200 bg-blanco p-4 shadow-suave">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full border px-2.5 py-0.5 font-mono text-[10.5px] tracking-[0.06em] ${
            SEVERITY_CLASSES[signal.severity] ?? SEVERITY_CLASSES.info
          }`}
        >
          {SEVERITY_LABELS[signal.severity] ?? signal.severity}
        </span>
        {!presentacion && (
          <span className="font-mono text-[10.5px] text-tinta-500">{dateTime(signal.detectedAt)}</span>
        )}
      </div>

      <h3
        className={`mt-2 font-display text-tinta-900 ${presentacion ? "text-[24px]" : "text-[17px]"}`}
      >
        {signal.title}
      </h3>
      <p className={`mt-1 text-tinta-600 ${presentacion ? "text-[17px]" : "text-[14px]"}`}>
        {signal.description}
      </p>

      {signal.evidence.length > 0 && (
        <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-arena-200 pt-3">
          {signal.evidence.map((item) => (
            <div key={item.metricKey}>
              <dt className="font-mono text-[10px] tracking-[0.06em] text-tinta-500 uppercase">
                {item.label}
              </dt>
              <dd className="text-[13.5px] font-semibold text-tinta-900">
                {formatEvidence(item.value, item.unit)}
                {item.previousValue !== null && (
                  <span className="ml-1 font-normal text-tinta-500">
                    (antes {formatEvidence(item.previousValue, item.unit)})
                  </span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </li>
  );
}
