"use client";

import { useState } from "react";
import type { Coordinacion as TipoCoordinacion } from "@/lib/negocio/types";
import { useReplay } from "./useReplay";
import { BloqueDePropuestas } from "./Propuestas";
import { Rotulo } from "./ui";

/**
 * La conclusión cruzada. Es la razón de ser de toda la pantalla.
 *
 * Muestra algo a lo que NINGÚN agente llega solo, y por eso se presenta como
 * una cadena con el nombre de quién aportó cada eslabón. Sin los nombres es un
 * párrafo bien escrito; con los nombres es la prueba de que las áreas se
 * hablan — que es exactamente lo que una pila de herramientas de IA sueltas no
 * puede hacer, y todo el argumento de la charla.
 *
 * Los eslabones aparecen de a uno cuando se revisa. Cuatro agentes que se
 * suman uno tras otro cuentan la historia solos: el orador no tiene que
 * explicar que se coordinaron, se ve.
 */
export function TarjetaCoordinacion({
  coordinacion,
  presentacion,
  token,
}: {
  coordinacion: TipoCoordinacion;
  presentacion: boolean;
  token: number;
}) {
  const { visibles } = useReplay(coordinacion.eslabones.length, {
    token,
    msPaso: 750,
    // Arranca después del roster: primero se ve trabajar a los agentes, después
    // aparece lo que sale de cruzarlos. El orden es el relato.
    retrasoMs: 1400,
  });
  const [verLimites, setVerLimites] = useState(false);
  const completa = visibles >= coordinacion.eslabones.length;

  return (
    <section className="overflow-hidden rounded-xl border border-sala-tx/30 bg-gradient-to-br from-sala-800 to-sala-900">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-sala-tx/20 px-5 py-3">
        <p className="font-mono text-[10.5px] tracking-[0.18em] text-sala-tx uppercase">
          Conclusión cruzada · {coordinacion.eslabones.length} agentes
        </p>
        <p className="font-mono text-[10px] tracking-[0.1em] text-sala-tx3 uppercase">
          Ninguno llega a esto solo
        </p>
      </header>

      <div className="px-5 py-5 dk:px-7 dk:py-6">
        <h2
          className={`font-display leading-tight text-sala-tx ${
            presentacion ? "text-[40px]" : "text-[27px]"
          }`}
        >
          {coordinacion.titulo}
        </h2>
        <p
          className={`mt-2 leading-relaxed text-sala-tx2 ${
            presentacion ? "text-[18px]" : "text-[14.5px]"
          }`}
        >
          {coordinacion.bajada}
        </p>

        {/*
          Los eslabones que todavía no aparecieron ocupan su lugar en blanco.
          Sin eso, cada uno que entra empuja al resto hacia abajo y la tarjeta
          crece a los saltos delante de la sala — el efecto que se buscaba
          (cuatro áreas sumándose) se pierde detrás del movimiento.
        */}
        <ol className="mt-6 flex flex-col gap-4">
          {coordinacion.eslabones.map((eslabon, i) => (
            <li
              key={eslabon.agente}
              className={`flex gap-4 transition-opacity duration-300 ${
                i < visibles ? "opacity-100" : "opacity-0"
              }`}
              aria-hidden={i >= visibles}
            >
              <span
                aria-hidden
                className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-sala-tx/30 font-mono text-[12px] text-sala-tx"
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <Rotulo className="!text-sala-tx">{eslabon.agente}</Rotulo>
                <p
                  className={`mt-1 leading-relaxed text-sala-tx ${
                    presentacion ? "text-[18px]" : "text-[14.5px]"
                  }`}
                >
                  {eslabon.texto}
                </p>
              </div>
            </li>
          ))}
        </ol>

        {/*
          El cierre y la propuesta sí esperan a que la cadena esté completa: son
          la conclusión, y mostrarlos antes que los cuatro eslabones desarmaría
          el argumento — que es precisamente que la conclusión SALE de cruzarlos.
        */}
        {completa && (
          <div className="animate-[aparecer_400ms_ease-out]">
            <p
              className={`mt-6 border-l-2 border-sala-tx pl-4 leading-relaxed font-semibold text-sala-tx ${
                presentacion ? "text-[19px]" : "text-[15px]"
              }`}
            >
              {coordinacion.cierre}
            </p>

            {/*
              Los supuestos y los límites van ANTES de los botones de la
              propuesta, no después. Son lo que hay que haber leído para poder
              aprobar; ponerlos abajo sería ponerlos donde nadie los lee.
            */}
            <div className="mt-5">
              <button
                type="button"
                onClick={() => setVerLimites((v) => !v)}
                aria-expanded={verLimites}
                className="rounded-lg border border-sala-bd bg-sala-900 px-3 py-1.5 font-mono text-[11px] text-sala-tx2 transition-colors hover:border-sala-tx hover:text-sala-tx"
              >
                {verLimites ? "▾" : "▸"} supuestos y límites ·{" "}
                {coordinacion.supuestos.length + coordinacion.limitaciones.length}
              </button>

              {verLimites && (
                <div className="mt-3 flex flex-col gap-4 rounded-lg border border-sala-bd bg-sala-1000 px-4 py-3.5">
                  <Lista titulo="Estoy dando por cierto" items={coordinacion.supuestos} />
                  <Lista titulo="Esto NO me permite afirmar" items={coordinacion.limitaciones} />
                </div>
              )}
            </div>

            <div className="mt-5">
              <BloqueDePropuestas
                propuestas={coordinacion.propuestas}
                presentacion={presentacion}
              />
            </div>
          </div>
        )}
      </div>
    </section>
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
