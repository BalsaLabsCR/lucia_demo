import type { Barras, Rango, Tabla } from "@/lib/negocio/types";
import { miles } from "@/lib/negocio/formato";
import { Panel, Rotulo } from "./ui";

/**
 * Las tres visuales de la Sala: barras, tabla y rango de precios.
 *
 * Todas hacen lo mismo: convertir un número en una imagen. "57% de uso de
 * agenda" es un dato que se olvida antes de terminar la frase; siete barras
 * donde una está claramente más corta que las otras es una conclusión que ya
 * se sacó antes de que el orador la diga.
 */

// ---------------------------------------------------------------------------

export function BarrasHorizontales({
  barras,
  presentacion,
}: {
  barras: Barras;
  presentacion: boolean;
}) {
  // La escala la marca el valor más alto, no el total: con proporciones (7 de
  // 24) la barra llena es el cupo, y sin ellas la más larga tiene que llegar al
  // borde o la comparación se aplasta contra la izquierda.
  const tope = Math.max(...barras.filas.map((f) => f.total ?? f.valor), 1);

  return (
    <Panel as="section" className="p-5">
      <Rotulo>{barras.titulo}</Rotulo>

      <ul className="mt-4 flex flex-col gap-3">
        {barras.filas.map((fila) => {
          const proporcion = fila.total ? fila.valor / fila.total : fila.valor / tope;
          const anchoFondo = fila.total ? (fila.total / tope) * 100 : 100;

          return (
            <li key={fila.etiqueta}>
              <div className="flex items-baseline justify-between gap-4">
                <p
                  className={`${
                    fila.destacada ? "font-semibold text-sala-tx" : "text-sala-tx2"
                  } ${presentacion ? "text-[16px]" : "text-[13.5px]"}`}
                >
                  {fila.etiqueta}
                </p>
                <p
                  className={`shrink-0 font-mono tabular-nums ${
                    fila.destacada ? "text-sala-tx" : "text-sala-tx2"
                  } ${presentacion ? "text-[15px]" : "text-[12.5px]"}`}
                >
                  {fila.total
                    ? `${fila.valor}/${fila.total} · ${Math.round(proporcion * 100)}%`
                    : miles(fila.valor)}
                </p>
              </div>

              <div className="mt-1.5 flex items-center gap-3">
                <div
                  className="h-2.5 rounded-full bg-sala-700"
                  style={{ width: `${anchoFondo}%` }}
                >
                  <div
                    className={`h-full rounded-full transition-[width] duration-700 ${
                      fila.destacada ? "bg-sala-tx" : "bg-sala-tx3"
                    }`}
                    style={{ width: `${Math.max(proporcion * 100, 1.5)}%` }}
                  />
                </div>
                {fila.nota && (
                  <span className="shrink-0 font-mono text-[11px] text-sala-tx">
                    {fila.nota}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {barras.pie && !presentacion && (
        <p className="mt-4 border-t border-sala-bd pt-3 font-mono text-[10.5px] leading-relaxed text-sala-tx3">
          {barras.pie}
        </p>
      )}
    </Panel>
  );
}

// ---------------------------------------------------------------------------

export function TablaSimple({ tabla, presentacion }: { tabla: Tabla; presentacion: boolean }) {
  return (
    <Panel as="section" className="p-5">
      <Rotulo>{tabla.titulo}</Rotulo>

      <table className="mt-4 w-full border-collapse">
        <thead>
          <tr>
            {tabla.columnas.map((columna, i) => (
              <th
                key={columna}
                scope="col"
                className={`border-b border-sala-bd pb-2 font-mono text-[10px] tracking-[0.12em] text-sala-tx3 uppercase ${
                  i === 0 ? "text-left" : "text-right"
                }`}
              >
                {columna}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tabla.filas.map((fila) => (
            <tr
              key={fila.celdas[0]}
              className={fila.destacada ? "border-t border-sala-bd" : ""}
            >
              {fila.celdas.map((celda, i) => (
                <td
                  key={i}
                  className={`py-2.5 ${i === 0 ? "text-left" : "text-right font-mono tabular-nums"} ${
                    fila.destacada ? "font-semibold text-sala-tx" : "text-sala-tx2"
                  } ${presentacion ? "text-[16px]" : "text-[13.5px]"}`}
                >
                  {celda}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {tabla.pie && (
        <p
          className={`mt-3 border-t border-sala-bd pt-3 text-sala-tx2 ${
            presentacion ? "text-[15px]" : "text-[12.5px]"
          }`}
        >
          {tabla.pie}
        </p>
      )}
    </Panel>
  );
}

// ---------------------------------------------------------------------------

/**
 * Dónde está el precio propio dentro de lo que cobra la zona.
 *
 * Cada observación lleva **fecha y fuente**. Es inventado como todo lo demás,
 * pero esa forma es exactamente lo que hace que se lea como investigación y no
 * como opinión: un dato de competencia sin fecha no se puede juzgar, y quien lo
 * mira no tiene forma de saber si ve el precio de hoy o el del año pasado.
 */
export function RangoDePrecios({
  rango,
  presentacion,
}: {
  rango: Rango;
  presentacion: boolean;
}) {
  const valores = [rango.nuestroValor, ...rango.observaciones.map((o) => o.valor)];
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const posicion = (valor: number) => ((valor - min) / (max - min)) * 100;

  return (
    <Panel as="section" className="p-5">
      <Rotulo>{rango.titulo}</Rotulo>

      {/* La regla: el propio arriba, los observados abajo. */}
      <div className="mt-8 mb-2">
        <div className="relative h-px bg-sala-bd">
          {rango.observaciones.map((o) => (
            <span
              key={o.nombre}
              className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sala-tx3"
              style={{ left: `${posicion(o.valor)}%` }}
              aria-hidden
            />
          ))}
          <span
            className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-sala-900 bg-sala-tx"
            style={{ left: `${posicion(rango.nuestroValor)}%` }}
            aria-hidden
          />
          <span
            className="absolute -top-7 -translate-x-1/2 font-mono text-[11px] whitespace-nowrap text-sala-tx"
            style={{ left: `${posicion(rango.nuestroValor)}%` }}
          >
            {rango.nuestraEtiqueta} ₡{miles(rango.nuestroValor)}
          </span>
        </div>
        <div className="mt-2 flex justify-between font-mono text-[10.5px] text-sala-tx3">
          <span>₡{miles(min)}</span>
          <span>₡{miles(max)}</span>
        </div>
      </div>

      <ul className="mt-5 flex flex-col divide-y divide-sala-bd">
        {rango.observaciones.map((o) => (
          <li key={o.nombre} className="flex items-baseline justify-between gap-4 py-2.5">
            <span className={`text-sala-tx2 ${presentacion ? "text-[15px]" : "text-[13px]"}`}>
              {o.nombre}
            </span>
            <span className="flex shrink-0 items-baseline gap-4">
              {!presentacion && (
                <span className="font-mono text-[10.5px] text-sala-tx3">
                  observado el {o.fecha} · {o.fuente}
                </span>
              )}
              <span
                className={`font-mono tabular-nums text-sala-tx ${
                  presentacion ? "text-[15px]" : "text-[13px]"
                }`}
              >
                ₡{miles(o.valor)}
              </span>
            </span>
          </li>
        ))}
      </ul>

      <p
        className={`mt-4 border-t border-sala-bd pt-3 text-sala-tx2 ${
          presentacion ? "text-[15px]" : "text-[12.5px]"
        }`}
      >
        {rango.nota}
      </p>
    </Panel>
  );
}
