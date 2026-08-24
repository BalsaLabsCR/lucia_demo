"use client";

import { useState } from "react";
import type { Hallazgo } from "@/lib/negocio/types";
import { COLOR_SEVERIDAD, confianzaEnPalabras } from "@/lib/negocio/formato";
import { useReplay } from "./useReplay";
import { ChipSeveridad, Rotulo } from "./ui";

/**
 * Un hallazgo. Es la unidad de contenido de toda la pantalla y la pieza que
 * decide si esto se lee como un informe hecho por una IA o como una tabla con
 * mejor tipografía.
 *
 * El orden de arriba a abajo no es estético, es el orden en que alguien evalúa
 * una afirmación que no pidió:
 *
 *   1. quién lo dice y qué tan seguro está;
 *   2. QUÉ dice, en una línea que se pueda repetir;
 *   3. por qué, con el número y la comparación adentro de la prosa;
 *   4. qué consideró y descartó — un agente que solo concluye parece un
 *      generador de frases; uno que descarta parece que pensó;
 *   5. de dónde salió cada número;
 *   6. y recién al final, plegados, la traza y los límites.
 *
 * Los supuestos y las limitaciones van ANTES de cualquier botón de acción, no
 * en un pie de página: son justamente lo que hay que haber leído para poder
 * decidir. Que estén plegados es una concesión al espacio, no a la importancia
 * — el resumen de una línea del disparador dice cuántos hay.
 */
export function HallazgoCard({
  hallazgo,
  presentacion,
  token,
  retrasoMs = 0,
}: {
  hallazgo: Hallazgo;
  presentacion: boolean;
  /** Cambia cuando se aprieta "Revisar ahora". 0 = en reposo. */
  token: number;
  retrasoMs?: number;
}) {
  const { visibles, corriendo } = useReplay(hallazgo.traza.length, { token, retrasoMs });
  const color = COLOR_SEVERIDAD[hallazgo.severidad];

  return (
    <article
      className={`overflow-hidden rounded-xl border bg-sala-900 ${color.borde} ${
        corriendo ? "" : "shadow-[var(--sala-sombra)]"
      }`}
    >
      {/* Rótulo del agente que lo firma + severidad + confianza. */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-sala-bd px-5 py-3">
        <div className="flex items-center gap-3">
          <Rotulo>{hallazgo.agente}</Rotulo>
          <ChipSeveridad severidad={hallazgo.severidad} />
        </div>
        <p className="font-mono text-[10.5px] tracking-[0.1em] text-sala-tx3 uppercase">
          Confianza {confianzaEnPalabras(hallazgo.confianza)} ·{" "}
          {Math.round(hallazgo.confianza * 100)}%
        </p>
      </header>

      {corriendo ? (
        <Revisando traza={hallazgo.traza} visibles={visibles} />
      ) : (
        <div className="px-5 py-5">
          <h3
            className={`font-display leading-snug text-sala-tx ${
              presentacion ? "text-[30px]" : "text-[21px]"
            }`}
          >
            {hallazgo.titulo}
          </h3>

          <p
            className={`mt-3 leading-relaxed text-sala-tx2 ${
              presentacion ? "text-[18px]" : "text-[14.5px]"
            }`}
          >
            {hallazgo.cuerpo}
          </p>

          {hallazgo.descarte && (
            <div className="mt-4 border-l-2 border-sala-bd pl-4">
              <Rotulo>Lo que descarté</Rotulo>
              <p
                className={`mt-1 leading-relaxed text-sala-tx3 ${
                  presentacion ? "text-[16px]" : "text-[13.5px]"
                }`}
              >
                {hallazgo.descarte}
              </p>
            </div>
          )}

          <Evidencia hallazgo={hallazgo} presentacion={presentacion} />

          <div className="mt-4 flex flex-wrap gap-2 border-t border-sala-bd pt-4">
            {/*
              La traza se esconde en modo presentación solo si el orador lo
              decide: acá NO se esconde, porque es justamente lo que hay que
              mostrar. Lo que sí se esconde en presentación es el detalle
              técnico de las fuentes (ver `Evidencia`).
            */}
            <Desplegable
              etiqueta={`cómo llegué acá · ${hallazgo.traza.length} pasos`}
              presentacion={presentacion}
            >
              <ListaTraza traza={hallazgo.traza} visibles={hallazgo.traza.length} />
            </Desplegable>

            <Desplegable
              etiqueta={`supuestos y límites · ${
                hallazgo.supuestos.length + hallazgo.limitaciones.length
              }`}
              presentacion={presentacion}
            >
              <div className="flex flex-col gap-4">
                <Lista titulo="Estoy dando por cierto" items={hallazgo.supuestos} />
                <Lista titulo="Esto NO me permite afirmar" items={hallazgo.limitaciones} />
              </div>
            </Desplegable>
          </div>
        </div>
      )}
    </article>
  );
}

/**
 * El estado "revisando": los pasos aparecen de a uno y el hallazgo todavía no.
 *
 * Es el único momento en que la tarjeta esconde su contenido, y dura cuatro
 * segundos. Vale la pena porque es lo que convierte una afirmación en algo que
 * ACABA de producirse: sin esto, la misma frase se lee como un texto que
 * siempre estuvo en la página.
 */
function Revisando({
  traza,
  visibles,
}: {
  traza: Hallazgo["traza"];
  visibles: number;
}) {
  return (
    <div className="px-5 py-5" role="status" aria-live="polite">
      <p className="flex items-center gap-2 font-mono text-[11px] tracking-[0.14em] text-sala-tx uppercase">
        <span className="typing-dot">·</span>
        <span className="typing-dot" style={{ animationDelay: "0.15s" }}>
          ·
        </span>
        <span className="typing-dot" style={{ animationDelay: "0.3s" }}>
          ·
        </span>
        Revisando
      </p>
      <div className="mt-3 min-h-[132px]">
        <ListaTraza traza={traza} visibles={visibles} />
      </div>
    </div>
  );
}

/** Los pasos, numerados. `visibles` corta la lista para la animación. */
function ListaTraza({ traza, visibles }: { traza: Hallazgo["traza"]; visibles: number }) {
  return (
    <ol className="flex flex-col gap-1.5">
      {traza.slice(0, visibles).map((paso, i) => (
        <li
          key={paso.paso}
          className="flex items-baseline gap-3 font-mono text-[12px] text-sala-tx2"
        >
          <span className="w-4 shrink-0 text-right text-sala-tx3">{i + 1}</span>
          <span className="flex-1">{paso.paso}</span>
          <span className="hidden shrink-0 text-sala-tx dk:inline">{paso.detalle}</span>
        </li>
      ))}
    </ol>
  );
}

/**
 * La evidencia: cada número con su origen.
 *
 * En modo presentación se esconde de dónde salió y se deja el número: proyectado
 * a diez metros, "conversaciones · agosto" no se lee y le quita aire a lo que
 * sí. Fuera de presentación se muestra, porque es la respuesta a la única
 * pregunta que un gerente escéptico va a hacer.
 */
function Evidencia({ hallazgo, presentacion }: { hallazgo: Hallazgo; presentacion: boolean }) {
  return (
    <div className="mt-5">
      <Rotulo>Evidencia</Rotulo>
      <ul className="mt-2 flex flex-col divide-y divide-sala-bd border-y border-sala-bd">
        {hallazgo.evidencia.map((e) => (
          <li key={e.etiqueta} className="flex flex-wrap items-baseline justify-between gap-2 py-2">
            <span className={`text-sala-tx2 ${presentacion ? "text-[16px]" : "text-[13px]"}`}>
              {e.etiqueta}
            </span>
            <span className="flex items-baseline gap-4">
              {!presentacion && (
                <span className="font-mono text-[10.5px] text-sala-tx3">{e.fuente}</span>
              )}
              <span
                className={`font-mono tabular-nums text-sala-tx ${
                  presentacion ? "text-[16px]" : "text-[13px]"
                }`}
              >
                {e.valor}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Un desplegable con estado propio.
 *
 * Se usa `useState` y no `<details>` nativo porque los dos disparadores tienen
 * que verse como botones hermanos en la misma fila, y `<details>` obliga a que
 * el contenido viva adentro del mismo bloque que el resumen.
 */
function Desplegable({
  etiqueta,
  presentacion,
  children,
}: {
  etiqueta: string;
  presentacion: boolean;
  children: React.ReactNode;
}) {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className={abierto ? "w-full" : ""}>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        className={`rounded-lg border border-sala-bd bg-sala-800 px-3 py-1.5 font-mono tracking-[0.06em] text-sala-tx2 transition-colors hover:border-sala-tx hover:text-sala-tx ${
          presentacion ? "text-[12px]" : "text-[11px]"
        }`}
      >
        {abierto ? "▾" : "▸"} {etiqueta}
      </button>

      {abierto && (
        <div className="mt-3 rounded-lg border border-sala-bd bg-sala-1000 px-4 py-3.5">
          {children}
        </div>
      )}
    </div>
  );
}

function Lista({ titulo, items }: { titulo: string; items: string[] }) {
  return (
    <div>
      <Rotulo>{titulo}</Rotulo>
      <ul className="mt-1.5 flex flex-col gap-1.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5 text-[13px] leading-relaxed text-sala-tx2">
            <span aria-hidden className="text-sala-tx3">
              —
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
