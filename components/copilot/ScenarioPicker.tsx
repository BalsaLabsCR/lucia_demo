"use client";

import { useState } from "react";
import type { ScenarioState } from "@/lib/copilot";

/**
 * El selector de escenarios.
 *
 * Cada tarjeta explica QUÉ situación simula, no solo cómo se llama: quien está
 * mirando la charla tiene que entender qué va a pasar antes de que pase.
 *
 * Activar pide confirmación, y la confirmación dice exactamente lo que va a
 * ocurrir —se reemplazan los datos de demostración y se borra lo derivado—
 * porque es una operación destructiva aunque sea sobre datos ficticios.
 *
 * Cuando el backend tiene la demo apagada, no se esconde el botón: se explica
 * por qué no se puede. Esconderlo dejaría a alguien buscando durante una charla.
 */
export function ScenarioPicker({
  state,
  ocupado,
  onActivate,
  onCancel,
}: {
  state: ScenarioState;
  ocupado: boolean;
  onActivate: (scenarioId: string, analizar: boolean) => void;
  onCancel: () => void;
}) {
  const [confirmando, setConfirmando] = useState<string | null>(null);

  if (!state.enabled) {
    return (
      <section className="rounded-xl border border-ambar-bd bg-ambar-bg p-5">
        <h2 className="font-display text-[20px] text-tinta-900">
          Los escenarios están deshabilitados en este servidor
        </h2>
        <p className="mt-2 text-[14px] text-ambar-tx">
          {state.blockedReason
            ? `Motivo: ${state.blockedReason}.`
            : "El backend no permite operaciones de demostración."}{" "}
          Activar un escenario reemplaza datos, así que solo corre con la bandera de demostración
          encendida y fuera de producción.
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="mt-4 rounded-lg border-[1.5px] border-arena-300 bg-blanco px-4 py-2 text-[13.5px] font-semibold text-tinta-600"
        >
          Volver
        </button>
      </section>
    );
  }

  const elegido = state.scenarios.find((s) => s.id === confirmando);

  return (
    <section aria-label="Escenarios de demostración">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-[22px] text-tinta-900">Elegí un escenario</h2>
          <p className="text-[13.5px] text-tinta-500">
            Cada uno reemplaza los datos de demostración en el backend: citas, interesados y
            conversaciones ficticias. Nada de esto toca datos reales.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border-[1.5px] border-arena-300 bg-blanco px-4 py-2 text-[13.5px] font-semibold text-tinta-600 transition-colors hover:bg-arena-50"
        >
          Cancelar
        </button>
      </div>

      {elegido ? (
        <div className="rounded-xl border border-ambar-bd bg-ambar-bg p-5">
          <h3 className="font-display text-[20px] text-tinta-900">
            ¿Activar «{elegido.label}»?
          </h3>
          <p className="mt-2 text-[14px] text-ambar-tx">{elegido.description}</p>
          <ul className="mt-3 flex flex-col gap-1 text-[13.5px] text-ambar-tx">
            <li>· Se reemplazan las citas, los interesados y las conversaciones de demostración.</li>
            <li>· Se borran los análisis, las recomendaciones y las directivas del pase anterior.</li>
            <li>· No se toca ninguna conversación ni cita real de la clínica.</li>
          </ul>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={ocupado}
              onClick={() => onActivate(elegido.id, true)}
              className="rounded-lg bg-verde-800 px-4 py-2.5 text-[14px] font-semibold text-crema-100 shadow-suave transition-colors hover:bg-verde-950 disabled:opacity-50"
            >
              Activar y analizar
            </button>
            <button
              type="button"
              disabled={ocupado}
              onClick={() => onActivate(elegido.id, false)}
              className="rounded-lg border-[1.5px] border-menta-200 bg-blanco px-4 py-2.5 text-[14px] font-semibold text-verde-800 transition-colors hover:bg-verde-50 disabled:opacity-50"
            >
              Solo activar
            </button>
            <button
              type="button"
              disabled={ocupado}
              onClick={() => setConfirmando(null)}
              className="rounded-lg border-[1.5px] border-arena-300 bg-blanco px-4 py-2.5 text-[14px] font-semibold text-tinta-600 disabled:opacity-50"
            >
              Volver
            </button>
          </div>
        </div>
      ) : (
        <ul className="grid gap-3 dk:grid-cols-2">
          {state.scenarios.map((scenario) => {
            const activo = state.active?.scenarioId === scenario.id;
            return (
              <li key={scenario.id}>
                <button
                  type="button"
                  disabled={ocupado}
                  onClick={() => setConfirmando(scenario.id)}
                  className={`h-full w-full rounded-xl border p-4 text-left transition-colors disabled:opacity-50 ${
                    activo
                      ? "border-menta-300 bg-verde-50"
                      : "border-arena-200 bg-blanco hover:bg-arena-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display text-[18px] text-tinta-900">{scenario.label}</h3>
                    {activo && (
                      <span className="shrink-0 rounded-full border border-menta-300 bg-blanco px-2.5 py-0.5 font-mono text-[10px] tracking-[0.06em] text-verde-800">
                        ACTIVO
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-[13.5px] text-tinta-600">{scenario.description}</p>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
