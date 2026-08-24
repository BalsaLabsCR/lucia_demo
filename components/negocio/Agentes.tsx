"use client";

import Link from "next/link";
import type { Agente, DominioId } from "@/lib/negocio/types";
import { COLOR_SEVERIDAD } from "@/lib/negocio/formato";
import { useReplay } from "./useReplay";
import { Punto, Rotulo } from "./ui";

/**
 * El roster: seis agentes mirando seis cosas distintas del mismo negocio.
 *
 * Es lo primero que se ve al abrir la pantalla y es lo que dice "acá hay un
 * equipo" antes de que nadie lea un número. Cuando se aprieta "Revisar ahora",
 * las seis tarjetas se completan a distinto ritmo — no juntas: seis barras que
 * arrancan y terminan al mismo tiempo se leen como UNA barra de progreso, y
 * seis que terminan escalonadas se leen como seis agentes.
 */
export function Roster({
  agentes,
  token,
  presentacion,
  onIr,
}: {
  agentes: Agente[];
  token: number;
  presentacion: boolean;
  onIr: (id: DominioId) => void;
}) {
  return (
    <ul className="grid gap-3 grid-cols-1 dk:grid-cols-3">
      {agentes.map((agente, i) => (
        <TarjetaAgente
          key={agente.nombre}
          agente={agente}
          token={token}
          // El escalonado: cada agente arranca un poco después que el anterior.
          retrasoMs={i * 260}
          presentacion={presentacion}
          onIr={onIr}
        />
      ))}
    </ul>
  );
}

function TarjetaAgente({
  agente,
  token,
  retrasoMs,
  presentacion,
  onIr,
}: {
  agente: Agente;
  token: number;
  retrasoMs: number;
  presentacion: boolean;
  onIr: (id: DominioId) => void;
}) {
  const { visibles, corriendo } = useReplay(agente.pasos, { token, retrasoMs, msPaso: 420 });
  const color = COLOR_SEVERIDAD[agente.estado];
  const progreso = Math.round((visibles / agente.pasos) * 100);

  const clases = `flex h-full w-full flex-col rounded-xl border bg-sala-900 p-4 text-left transition-colors hover:border-sala-tx/45 ${color.borde}`;

  // Un agente con `enlace` sale del panel (Marketing va a su propio módulo);
  // el resto cambia de pestaña. Es un `<Link>` y no un botón para que se pueda
  // abrir en otra pestaña del navegador: en vivo, tener el estudio de marketing
  // ya abierto en otra pestaña es la diferencia entre fluido y esperar a que
  // cargue con la sala mirando.
  const contenido = (
    <>
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2">
          <Punto severidad={agente.estado} activo={corriendo} />
          <span
            className={`font-semibold text-sala-tx ${presentacion ? "text-[17px]" : "text-[14px]"}`}
          >
            {agente.nombre}
          </span>
        </span>
        <span className="shrink-0 font-mono text-[10px] text-sala-tx3">
          {corriendo ? "revisando…" : `hace ${agente.revisadoHaceMin} min`}
        </span>
      </div>

      {/*
        Mientras revisa, en vez del titular va una línea gris del mismo alto.
        Un guion o un espacio vacío haría que la tarjeta cambie de tamaño al
        terminar, y seis tarjetas saltando a destiempo es exactamente el
        movimiento que uno NO quiere proyectado. La línea también dice algo que
        el guion no dice: que ahí va a aparecer texto.
      */}
      {corriendo ? (
        <p className={`mt-2 ${presentacion ? "py-[5px]" : "py-[3px]"}`} aria-hidden>
          <span className="block h-[1em] w-3/4 rounded bg-sala-800" />
        </p>
      ) : (
        <p
          className={`mt-2 leading-snug ${color.texto} ${
            presentacion ? "text-[16px]" : "text-[13px]"
          }`}
        >
          {agente.titular}
        </p>
      )}

      {/* La barra de progreso de la revisión. En reposo queda llena y quieta. */}
      <div className="mt-3 h-0.5 w-full rounded-full bg-sala-700">
        <div
          className="h-full rounded-full bg-sala-tx transition-[width] duration-300"
          style={{ width: `${progreso}%` }}
        />
      </div>

      {!presentacion && (
        <p className="mt-3 font-mono text-[10px] leading-relaxed text-sala-tx3">
          Lee: {agente.lee.join(" · ")}
          {agente.enlace && " · abre su propio módulo"}
        </p>
      )}
    </>
  );

  if (agente.enlace) {
    return (
      <li>
        <Link href={agente.enlace} className={clases}>
          {contenido}
        </Link>
      </li>
    );
  }

  return (
    <li>
      <button type="button" onClick={() => onIr(agente.id)} className={clases}>
        {contenido}
      </button>
    </li>
  );
}

/**
 * La identidad del agente que encabeza cada pestaña de área.
 *
 * Cuatro líneas: nombre, qué vigila, qué datos lee, y en qué estado está. La
 * línea "Lee:" es la que hace el trabajo pesado de la charla — enumera fuentes
 * que en una pyme viven en cuatro archivos distintos y que nadie cruza. Es lo
 * que separa "un asistente" de "una capa operativa", y se lee en dos segundos.
 */
export function IdentidadAgente({
  agente,
  hallazgos,
  propuestas,
  presentacion,
  corriendo,
  estado,
}: {
  agente: Agente;
  hallazgos: number;
  propuestas: number;
  presentacion: boolean;
  corriendo: boolean;
  /** Reemplaza el conteo de hallazgos. Lo usa Documentos, que no hace ninguno. */
  estado?: string;
}) {
  const color = COLOR_SEVERIDAD[agente.estado];

  return (
    <header className={`rounded-xl border bg-sala-900 px-5 py-4 ${color.borde}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          className={`flex items-center gap-2.5 font-display text-sala-tx ${
            presentacion ? "text-[30px]" : "text-[22px]"
          }`}
        >
          <Punto severidad={agente.estado} activo={corriendo} />
          {agente.nombre}
        </h2>
        <p className="font-mono text-[10.5px] tracking-[0.1em] text-sala-tx3 uppercase">
          {corriendo ? "revisando…" : `revisó hace ${agente.revisadoHaceMin} min`}
        </p>
      </div>

      <dl className="mt-3 grid gap-x-8 gap-y-2 dk:grid-cols-[1fr_1fr_auto]">
        <div>
          <Rotulo>Vigila</Rotulo>
          <dd className={`text-sala-tx2 ${presentacion ? "text-[16px]" : "text-[13px]"}`}>
            {agente.vigila}
          </dd>
        </div>
        <div>
          <Rotulo>Lee</Rotulo>
          <dd className={`text-sala-tx2 ${presentacion ? "text-[16px]" : "text-[13px]"}`}>
            {agente.lee.join(" · ")}
          </dd>
        </div>
        <div>
          <Rotulo>Estado</Rotulo>
          <dd className={`font-semibold ${color.texto} ${presentacion ? "text-[16px]" : "text-[13px]"}`}>
            {estado ??
              `${hallazgos} hallazgo${hallazgos === 1 ? "" : "s"}${
                propuestas > 0 ? ` · ${propuestas} propuesta${propuestas === 1 ? "" : "s"}` : ""
              }`}
          </dd>
        </div>
      </dl>
    </header>
  );
}
