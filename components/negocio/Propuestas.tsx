"use client";

import { useState } from "react";
import Link from "next/link";
import type { Propuesta } from "@/lib/negocio/types";
import { Rotulo } from "./ui";

/**
 * Lo que el sistema propone hacer, con aprobación humana obligatoria.
 *
 * **Aprobar y ejecutar son dos pasos distintos, y eso es el argumento entero.**
 * Un panel donde aprobar YA crea la campaña le está diciendo al gerente que la
 * IA decide y él firma. Acá decide él, dos veces: primero acepta el
 * diagnóstico, después elige qué acciones de las propuestas se hacen — cada una
 * con su botón y con una línea que dice qué va a pasar si lo aprieta.
 *
 * Nada de esto persiste: el estado vive en `useState` y recargar la página deja
 * la maqueta limpia. Es a propósito — entre una charla y la siguiente no hay
 * que acordarse de resetear nada.
 */
export function BloqueDePropuestas({
  propuestas,
  presentacion,
  titulo = "Qué conviene hacer",
}: {
  propuestas: Propuesta[];
  presentacion: boolean;
  titulo?: string;
}) {
  const [estado, setEstado] = useState<"pendiente" | "aprobado" | "rechazado">("pendiente");
  const [ejecutadas, setEjecutadas] = useState<string[]>([]);

  if (propuestas.length === 0) return null;

  return (
    <section className="rounded-xl border border-sala-tx/25 bg-sala-900 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Rotulo>
          {titulo} · {propuestas.length}
        </Rotulo>

        {estado === "pendiente" && (
          <p className="font-mono text-[10.5px] tracking-[0.1em] text-sala-alerta uppercase">
            Esperando tu revisión
          </p>
        )}
        {estado === "aprobado" && (
          <p className="font-mono text-[10.5px] tracking-[0.1em] text-sala-tx uppercase">
            Aprobado · elegí qué se ejecuta
          </p>
        )}
        {estado === "rechazado" && (
          <p className="font-mono text-[10.5px] tracking-[0.1em] text-sala-tx3 uppercase">
            Rechazado
          </p>
        )}
      </div>

      <ul className="mt-4 flex flex-col gap-3">
        {propuestas.map((propuesta) => (
          <li
            key={propuesta.id}
            className="rounded-lg border border-sala-bd bg-sala-800 px-4 py-3.5"
          >
            <h4
              className={`font-semibold text-sala-tx ${
                presentacion ? "text-[18px]" : "text-[14.5px]"
              }`}
            >
              {propuesta.titulo}
            </h4>
            <p
              className={`mt-1 leading-relaxed text-sala-tx2 ${
                presentacion ? "text-[16px]" : "text-[13px]"
              }`}
            >
              {propuesta.detalle}
            </p>

            {/*
              Qué hace la acción va ARRIBA del botón, siempre. Es lo que hay que
              haber leído antes de apretar, no una nota al pie de lo que ya pasó.
            */}
            <p className="mt-2.5 font-mono text-[11px] leading-relaxed text-sala-tx3">
              {propuesta.queHace}
            </p>

            {ejecutadas.includes(propuesta.id) ? (
              <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-sala-bd pt-3">
                <p
                  className={`font-semibold text-sala-tx ${
                    presentacion ? "text-[15px]" : "text-[13px]"
                  }`}
                >
                  ✓ {propuesta.alEjecutar}
                </p>
                {propuesta.irA && (
                  <Link
                    href={propuesta.irA.href}
                    className="rounded-lg border border-sala-tx/30 px-3 py-1.5 text-[12.5px] font-semibold text-sala-tx transition-colors hover:bg-sala-tx/10"
                  >
                    {propuesta.irA.texto} →
                  </Link>
                )}
              </div>
            ) : (
              estado === "aprobado" && (
                <button
                  type="button"
                  onClick={() => setEjecutadas((e) => [...e, propuesta.id])}
                  className="mt-3 rounded-lg bg-sala-tx px-4 py-2 text-[13px] font-semibold text-sala-1000 transition-colors hover:bg-sala-tx2"
                >
                  Ejecutar
                </button>
              )
            )}
          </li>
        ))}
      </ul>

      {estado === "pendiente" && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setEstado("aprobado")}
            className="rounded-lg bg-sala-tx px-5 py-2.5 text-[14px] font-semibold text-sala-1000 transition-colors hover:bg-sala-tx2"
          >
            Aprobar {propuestas.length > 1 ? `las ${propuestas.length}` : ""}
          </button>
          <button
            type="button"
            onClick={() => setEstado("rechazado")}
            className="rounded-lg border border-sala-bd px-5 py-2.5 text-[14px] font-semibold text-sala-tx2 transition-colors hover:border-sala-error hover:text-sala-error"
          >
            Rechazar
          </button>
          <p className="font-mono text-[11px] text-sala-tx3">
            Aprobar no ejecuta nada. Después elegís qué acciones se hacen.
          </p>
        </div>
      )}

      {estado === "rechazado" && (
        <button
          type="button"
          onClick={() => setEstado("pendiente")}
          className="mt-4 font-mono text-[11px] text-sala-tx3 underline transition-colors hover:text-sala-tx2"
        >
          volver a revisarlo
        </button>
      )}
    </section>
  );
}
