import type { GraficaColumnas, GraficaSerie, MapaCalor, Unidad } from "@/lib/negocio/types";
import { formatear, miles } from "@/lib/negocio/formato";
import { Panel, Rotulo } from "./ui";

/**
 * Las gráficas de la Sala: la capa de BI.
 *
 * Están dibujadas a mano en SVG y no con una librería, por tres razones que
 * pesan las tres:
 *
 *   1. son cuatro formas y ninguna es exótica — una línea, unas columnas, una
 *      línea chiquita y una grilla— así que la librería traería cien opciones
 *      para usar dos;
 *   2. la paleta y la tipografía son las de la Sala, con dos temas que se
 *      invierten enteros: peleárselas a los estilos de una librería cuesta más
 *      que dibujar los ejes;
 *   3. este repo es el front de una demostración, y una dependencia de 200 kB
 *      para una charla es una dependencia que alguien mantiene después.
 *
 * Todas usan `currentColor` o los tokens `sala-*`, así que el cambio de tema no
 * las toca.
 */

/** Márgenes del área de dibujo, en unidades del viewBox. */
const IZQ = 46;
const DER = 10;
const ARRIBA = 12;
const ABAJO = 26;

function escalaY(valores: number[]): { min: number; max: number } {
  const max = Math.max(...valores, 0);
  const min = Math.min(...valores, 0);
  // El eje arranca en cero salvo que los datos estén todos muy arriba: una
  // línea que arranca en el mínimo exagera cualquier variación, y exagerar es
  // justo lo que un panel de negocio no puede hacer.
  const piso = min > 0 && min / max > 0.55 ? min * 0.9 : 0;
  const techo = max * 1.06 || 1;
  return { min: piso, max: techo };
}

/** Un eje con tres marcas. Más ya es ruido a este tamaño. */
function marcasY(min: number, max: number): number[] {
  return [min, min + (max - min) / 2, max];
}

function etiquetaEje(valor: number, unidad: Unidad): string {
  if (unidad === "colones") {
    return valor >= 1_000_000
      ? `₡${(valor / 1_000_000).toFixed(1).replace(".", ",").replace(",0", "")}M`
      : `₡${miles(valor)}`;
  }
  if (unidad === "porcentaje") return `${Math.round(valor)}%`;
  return miles(valor);
}

// ---------------------------------------------------------------------------

/**
 * La línea chiquita de una tarjeta de métrica.
 *
 * Sin ejes ni etiquetas a propósito: no está para leer valores, está para
 * contestar en medio segundo si lo que muestra el número grande viene pasando o
 * es de este mes. El último punto va marcado porque es el que corresponde al
 * número de arriba.
 */
export function Sparkline({ puntos }: { puntos: number[] }) {
  if (puntos.length < 2) return null;

  const max = Math.max(...puntos);
  const min = Math.min(...puntos);
  const rango = max - min || 1;
  const x = (i: number) => (i / (puntos.length - 1)) * 100;
  const y = (v: number) => 26 - ((v - min) / rango) * 22;

  const linea = puntos.map((v, i) => `${x(i).toFixed(2)},${y(v).toFixed(2)}`).join(" ");
  const ultimo = puntos.length - 1;

  return (
    <svg
      viewBox="0 0 100 28"
      preserveAspectRatio="none"
      className="h-7 w-full text-sala-tx3"
      aria-hidden
    >
      <polyline
        points={linea}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
      />
      <circle cx={x(ultimo)} cy={y(puntos[ultimo])} r="1.8" className="fill-sala-tx" />
    </svg>
  );
}

// ---------------------------------------------------------------------------

/**
 * Una o dos series en el tiempo, con ejes.
 *
 * La primera serie lleva relleno debajo y la segunda solo trazo: con dos áreas
 * superpuestas no se entiende ninguna. Las series marcadas como `referencia`
 * —metas, umbrales— van punteadas y apagadas, para que no se lean como algo que
 * pasó.
 */
export function SerieTemporal({
  grafica,
  presentacion,
}: {
  grafica: GraficaSerie;
  presentacion: boolean;
}) {
  const ANCHO = 720;
  const ALTO = presentacion ? 240 : 200;

  const todos = grafica.series.flatMap((s) => s.puntos);
  const { min, max } = escalaY(todos);
  const n = grafica.etiquetas.length;

  const x = (i: number) => IZQ + (i / Math.max(n - 1, 1)) * (ANCHO - IZQ - DER);
  const y = (v: number) => ALTO - ABAJO - ((v - min) / (max - min || 1)) * (ALTO - ARRIBA - ABAJO);

  // Con muchos meses no entran todas las etiquetas: se muestran de a una sí y
  // una no, pero la ÚLTIMA siempre, porque es el mes del que habla la pantalla.
  const saltar = n > 8 ? 2 : 1;

  // Y las que caerían pegadas a esa última se saltan, aunque les tocara: dos
  // etiquetas encimadas en el eje son peores que una etiqueta de menos, y la
  // que sobrevive tiene que ser el mes actual.
  const mostrarEtiqueta = (i: number) =>
    i === n - 1 || (i % saltar === 0 && i <= n - 1 - saltar);

  return (
    <Panel as="section" className="p-5">
      <Encabezado titulo={grafica.titulo} series={grafica.series} />

      <svg
        viewBox={`0 0 ${ANCHO} ${ALTO}`}
        className="mt-4 w-full"
        role="img"
        aria-label={grafica.titulo}
      >
        {/* Grilla y eje de valores. */}
        {marcasY(min, max).map((valor) => (
          <g key={valor}>
            <line
              x1={IZQ}
              x2={ANCHO - DER}
              y1={y(valor)}
              y2={y(valor)}
              className="stroke-sala-bd"
              strokeWidth="1"
            />
            <text
              x={IZQ - 8}
              y={y(valor) + 3.5}
              textAnchor="end"
              className="fill-sala-tx3 font-mono text-[10px]"
            >
              {etiquetaEje(valor, grafica.unidad)}
            </text>
          </g>
        ))}

        {/* La marca vertical: "acá cambió algo". */}
        {grafica.marca && (
          <g>
            <line
              x1={x(grafica.marca.indice)}
              x2={x(grafica.marca.indice)}
              y1={ARRIBA}
              y2={ALTO - ABAJO}
              className="stroke-sala-tx2"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <text
              x={x(grafica.marca.indice) - 6}
              y={ARRIBA + 10}
              textAnchor="end"
              className="fill-sala-tx2 font-mono text-[10px]"
            >
              {grafica.marca.texto}
            </text>
          </g>
        )}

        {grafica.series.map((serie, indice) => {
          const linea = serie.puntos.map((v, i) => `${x(i)},${y(v)}`).join(" ");
          const area = `${IZQ},${ALTO - ABAJO} ${linea} ${x(serie.puntos.length - 1)},${ALTO - ABAJO}`;

          if (serie.referencia) {
            return (
              <polyline
                key={serie.nombre}
                points={linea}
                fill="none"
                className="stroke-sala-tx3"
                strokeWidth="1.5"
                strokeDasharray="5 4"
              />
            );
          }

          return (
            <g key={serie.nombre}>
              {indice === 0 && <polygon points={area} className="fill-sala-tx/[0.07]" />}
              <polyline
                points={linea}
                fill="none"
                className={indice === 0 ? "stroke-sala-tx" : "stroke-sala-tx2"}
                strokeWidth={indice === 0 ? 2.2 : 1.6}
                strokeDasharray={indice === 0 ? undefined : "6 3"}
                strokeLinejoin="round"
              />
              {/* Solo el último punto lleva marca: el resto ensucia la línea. */}
              <circle
                cx={x(serie.puntos.length - 1)}
                cy={y(serie.puntos[serie.puntos.length - 1])}
                r="3.5"
                className={indice === 0 ? "fill-sala-tx" : "fill-sala-tx2"}
              />
            </g>
          );
        })}

        {/* Eje de tiempo. */}
        {grafica.etiquetas.map((etiqueta, i) => {
          if (!mostrarEtiqueta(i)) return null;
          return (
            <text
              key={etiqueta}
              x={x(i)}
              y={ALTO - 8}
              textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
              className={`font-mono text-[10px] ${i === n - 1 ? "fill-sala-tx" : "fill-sala-tx3"}`}
            >
              {etiqueta}
            </text>
          );
        })}
      </svg>

      {grafica.pie && <Pie texto={grafica.pie} presentacion={presentacion} />}
    </Panel>
  );
}

// ---------------------------------------------------------------------------

/** Columnas verticales con su valor encima. Para comparar categorías, no tiempo. */
export function Columnas({
  grafica,
  presentacion,
}: {
  grafica: GraficaColumnas;
  presentacion: boolean;
}) {
  const max = Math.max(...grafica.columnas.map((c) => c.valor), 1);

  return (
    <Panel as="section" className="p-5">
      <Rotulo>{grafica.titulo}</Rotulo>

      <ul className="mt-5 flex items-end gap-2" style={{ height: presentacion ? 190 : 160 }}>
        {grafica.columnas.map((columna) => (
          <li key={columna.etiqueta} className="flex h-full flex-1 flex-col justify-end gap-1.5">
            <p
              className={`text-center font-mono tabular-nums ${
                columna.destacada ? "text-sala-tx" : "text-sala-tx2"
              } ${presentacion ? "text-[13px]" : "text-[11px]"}`}
            >
              {formatear(columna.valor, grafica.unidad)}
            </p>
            <div
              className={`w-full rounded-t-sm ${columna.destacada ? "bg-sala-tx" : "bg-sala-tx3"}`}
              style={{ height: `${Math.max((columna.valor / max) * 100, 2)}%` }}
            />
          </li>
        ))}
      </ul>

      <ul className="mt-2 flex gap-2 border-t border-sala-bd pt-2">
        {grafica.columnas.map((columna) => (
          <li
            key={columna.etiqueta}
            className={`flex-1 text-center leading-tight ${
              columna.destacada ? "text-sala-tx" : "text-sala-tx3"
            } ${presentacion ? "text-[12px]" : "text-[10.5px]"}`}
          >
            {columna.etiqueta}
          </li>
        ))}
      </ul>

      {grafica.pie && <Pie texto={grafica.pie} presentacion={presentacion} />}
    </Panel>
  );
}

// ---------------------------------------------------------------------------

/**
 * La agenda por día y franja.
 *
 * La intensidad es la ocupación. Un `null` es cerrado y va con trama, no con
 * el tono más claro: "cerrado" y "vacío" son cosas distintas y pintarlas igual
 * haría que el sábado a las cuatro de la tarde parezca un problema.
 */
export function MapaDeCalor({
  mapa,
  presentacion,
}: {
  mapa: MapaCalor;
  presentacion: boolean;
}) {
  return (
    <Panel as="section" className="p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <Rotulo>{mapa.titulo}</Rotulo>
        <Escala />
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-separate border-spacing-1">
          <thead>
            <tr>
              <th className="w-16" />
              {mapa.dias.map((dia) => (
                <th
                  key={dia}
                  scope="col"
                  className={`pb-1 font-mono text-sala-tx3 uppercase ${
                    presentacion ? "text-[12px]" : "text-[10px]"
                  }`}
                >
                  {dia}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mapa.franjas.map((franja, f) => (
              <tr key={franja}>
                <th
                  scope="row"
                  className={`pr-2 text-right font-mono whitespace-nowrap text-sala-tx3 ${
                    presentacion ? "text-[12px]" : "text-[10px]"
                  }`}
                >
                  {franja}
                </th>
                {mapa.dias.map((dia, d) => {
                  const valor = mapa.valores[f]?.[d] ?? null;
                  if (valor === null) {
                    return (
                      <td key={dia} className="h-9 rounded-sm border border-dashed border-sala-bd">
                        <span className="sr-only">Cerrado</span>
                      </td>
                    );
                  }
                  return (
                    <td
                      key={dia}
                      title={`${dia} ${franja} · ${Math.round(valor * 100)}%`}
                      className="h-9 rounded-sm text-center align-middle"
                      // El 0,08 de piso hace que una celda muy vacía siga
                      // leyéndose como celda y no como un hueco en la grilla.
                      style={{ backgroundColor: `color-mix(in srgb, var(--color-sala-tx) ${Math.round(valor * 88 + 8)}%, transparent)` }}
                    >
                      <span
                        className={`font-mono ${presentacion ? "text-[12px]" : "text-[10px]"} ${
                          valor > 0.55 ? "text-sala-1000" : "text-sala-tx2"
                        }`}
                      >
                        {Math.round(valor * 100)}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {mapa.pie && <Pie texto={mapa.pie} presentacion={presentacion} />}
    </Panel>
  );
}

function Escala() {
  return (
    <span className="flex items-center gap-1.5 font-mono text-[10px] text-sala-tx3">
      vacío
      {[0.12, 0.34, 0.56, 0.78, 0.96].map((v) => (
        <span
          key={v}
          className="size-3 rounded-[2px]"
          style={{ backgroundColor: `color-mix(in srgb, var(--color-sala-tx) ${v * 100}%, transparent)` }}
        />
      ))}
      lleno
    </span>
  );
}

// ---------------------------------------------------------------------------

function Encabezado({ titulo, series }: { titulo: string; series: GraficaSerie["series"] }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-3">
      <Rotulo>{titulo}</Rotulo>
      {series.length > 1 && (
        <ul className="flex flex-wrap gap-4">
          {series.map((serie, i) => (
            <li
              key={serie.nombre}
              className="flex items-center gap-2 font-mono text-[10.5px] text-sala-tx2"
            >
              <span
                aria-hidden
                className={`inline-block h-0.5 w-5 ${
                  serie.referencia
                    ? "bg-sala-tx3 [mask-image:repeating-linear-gradient(90deg,#000_0_4px,transparent_4px_8px)]"
                    : i === 0
                      ? "bg-sala-tx"
                      : "bg-sala-tx2 [mask-image:repeating-linear-gradient(90deg,#000_0_5px,transparent_5px_8px)]"
                }`}
              />
              {serie.nombre}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Pie({ texto, presentacion }: { texto: string; presentacion: boolean }) {
  return (
    <p
      className={`mt-3 border-t border-sala-bd pt-3 leading-relaxed text-sala-tx2 ${
        presentacion ? "text-[14px]" : "text-[12px]"
      }`}
    >
      {texto}
    </p>
  );
}
