import {
  formatMetric,
  RESUMEN_KEYS,
  trendArrow,
  trendOf,
  type BusinessMetric,
} from "@/lib/copilot";

/**
 * El resumen ejecutivo: entre cuatro y seis números, grandes.
 *
 * Cada uno lleva su comparación contra el período anterior y de dónde salió. Lo
 * segundo parece un detalle y es lo que separa un panel de un adorno: quien lo
 * mira tiene que poder preguntar "¿de dónde sacaste eso?" y encontrar la
 * respuesta en la misma tarjeta.
 *
 * El color de la variación no sigue el signo sino el SIGNIFICADO: que suba el
 * gasto no se pinta de verde (ver `trendOf`).
 */
export function MetricGrid({
  metrics,
  presentacion,
}: {
  metrics: BusinessMetric[];
  presentacion: boolean;
}) {
  const destacadas = RESUMEN_KEYS.map((key) => metrics.find((m) => m.key === key)).filter(
    (m): m is BusinessMetric => m !== undefined
  );

  if (destacadas.length === 0) {
    return (
      <p className="rounded-xl border border-arena-200 bg-blanco px-4 py-6 text-center text-[14px] text-tinta-500">
        Todavía no hay métricas. Corré un análisis para calcularlas.
      </p>
    );
  }

  return (
    <section
      aria-label="Resumen del negocio"
      className={`grid gap-3 ${
        presentacion ? "grid-cols-1 dk:grid-cols-3" : "grid-cols-2 dk:grid-cols-3"
      }`}
    >
      {destacadas.map((metric) => (
        <MetricCard key={metric.key} metric={metric} presentacion={presentacion} />
      ))}
    </section>
  );
}

function MetricCard({
  metric,
  presentacion,
}: {
  metric: BusinessMetric;
  presentacion: boolean;
}) {
  const trend = trendOf(metric);
  const bueno = trend === "up-good" || trend === "down-good";
  const malo = trend === "up-bad" || trend === "down-bad";

  const color = bueno ? "text-verde-800" : malo ? "text-error-tx" : "text-tinta-500";

  return (
    <article className="rounded-xl border border-arena-200 bg-blanco p-4 shadow-suave">
      <p
        className={`font-mono tracking-[0.08em] text-tinta-500 uppercase ${
          presentacion ? "text-[12px]" : "text-[10.5px]"
        }`}
      >
        {metric.label}
      </p>

      <p
        className={`mt-1 font-display leading-none text-tinta-900 ${
          presentacion ? "text-[44px]" : "text-[26px]"
        }`}
      >
        {formatMetric(metric)}
      </p>

      <p className={`mt-2 font-semibold ${color} ${presentacion ? "text-[16px]" : "text-[13px]"}`}>
        {metric.changePercent === null ? (
          <span className="text-tinta-500">Sin comparación</span>
        ) : (
          <>
            {trendArrow(trend)} {Math.abs(metric.changePercent)}%{" "}
            <span className="font-normal text-tinta-500">vs. período anterior</span>
          </>
        )}
      </p>

      {/*
        La fuente del número. En modo presentación se esconde: es información
        técnica y en una proyección solo agrega ruido.
      */}
      {!presentacion && (
        <p className="mt-2 border-t border-arena-200 pt-2 font-mono text-[10px] text-tinta-500">
          {metric.period.label} · {metric.source}
        </p>
      )}
    </article>
  );
}
