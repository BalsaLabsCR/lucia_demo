"use client";

import { useState } from "react";
import { REVISION_LABELS, type CampaignDetail, type Concept } from "@/lib/marketing";

/**
 * Las propuestas creativas, para comparar y elegir.
 *
 * Se muestran en columnas con los mismos campos alineados, no como tres párrafos:
 * así se ve de un vistazo que dos comparten el ángulo y que solo una le habla al
 * público del brief. Elegir "la que está mejor escrita" es lo que pasa cuando las
 * propuestas llegan como prosa suelta.
 */
export function ConceptCards({
  campaign,
  trabajando,
  onGenerate,
  onSelect,
  onRevise,
  onApprove,
  onReject,
}: {
  campaign: CampaignDetail;
  trabajando: string | null;
  onGenerate: () => void;
  onSelect: (conceptId: string) => void;
  onRevise: (conceptId: string, kind: string, note: string) => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const { concepts, status } = campaign;
  const puedeGenerar = status === "draft" || status === "strategy_review";
  const puedeElegir = puedeGenerar || status === "strategy_approved";

  return (
    <section className="mb-8">
      <div className="mb-3 flex flex-wrap items-baseline gap-3">
        <h2 className="font-display text-[21px] text-tinta-900">Estrategia creativa</h2>
        {concepts.length > 0 && (
          <span className="text-[12.5px] text-tinta-500">{concepts.length} propuestas</span>
        )}

        {puedeGenerar && (
          <button
            type="button"
            onClick={onGenerate}
            disabled={trabajando !== null}
            className="ml-auto rounded-lg bg-verde-800 px-3.5 py-2 text-[13.5px] font-semibold text-crema-100 disabled:opacity-60"
          >
            {trabajando === "conceptos"
              ? "Pensando…"
              : concepts.length === 0
                ? "Generar 3 propuestas"
                : "Generar otras 3"}
          </button>
        )}
      </div>

      {concepts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-arena-300 bg-arena-50 px-4 py-8 text-center text-[14px] text-tinta-500">
          Todavía no hay propuestas. Lucía va a leer el brief y los datos de la clínica, y va a
          proponer tres ángulos distintos.
        </p>
      ) : (
        <div className="grid gap-4 dk:grid-cols-3">
          {concepts.map((c) => (
            <ConceptCard
              key={c.id}
              concept={c}
              puedeElegir={puedeElegir}
              trabajando={trabajando}
              onSelect={() => onSelect(c.id)}
              onRevise={(kind, note) => onRevise(c.id, kind, note)}
            />
          ))}
        </div>
      )}

      {status === "strategy_review" && (
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onApprove}
            disabled={trabajando !== null || campaign.selectedConceptId === null}
            title={
              campaign.selectedConceptId === null
                ? "Primero elegí una de las propuestas"
                : undefined
            }
            className="rounded-lg bg-verde-800 px-4 py-2.5 text-[14px] font-semibold text-crema-100 disabled:opacity-50"
          >
            {trabajando === "aprobar-estrategia" ? "Aprobando…" : "Aprobar la estrategia elegida"}
          </button>
          <button
            type="button"
            onClick={onReject}
            disabled={trabajando !== null}
            className="rounded-lg border border-arena-300 px-4 py-2.5 text-[14px] font-semibold text-tinta-600"
          >
            Ninguna sirve — corregir el brief
          </button>
        </div>
      )}
    </section>
  );
}

const REVISIONES = ["rewrite_hook", "variant", "shorten", "more_direct", "more_emotional"] as const;

function ConceptCard({
  concept,
  puedeElegir,
  trabajando,
  onSelect,
  onRevise,
}: {
  concept: Concept;
  puedeElegir: boolean;
  trabajando: string | null;
  onSelect: () => void;
  onRevise: (kind: string, note: string) => void;
}) {
  const [tono, setTono] = useState("");

  return (
    <article
      className={`flex flex-col rounded-xl border bg-blanco p-4 shadow-suave ${
        concept.selected ? "border-verde-800 ring-1 ring-verde-800" : "border-arena-200"
      }`}
    >
      <div className="mb-2 flex items-baseline gap-2">
        <h3 className="text-[15px] font-semibold text-tinta-900">{concept.title}</h3>
        {concept.selected && (
          <span className="rounded-full border border-menta-200 bg-verde-50 px-2 py-0.5 font-mono text-[10px] text-verde-800">
            elegida
          </span>
        )}
      </div>

      {concept.derivedFrom && (
        <p className="mb-2 font-mono text-[10.5px] text-tinta-500">
          revisión: {concept.revisionNote}
        </p>
      )}

      <p className="mb-3 text-[15px] leading-snug font-medium text-verde-800">“{concept.hook}”</p>

      <dl className="space-y-2 text-[13px]">
        <Fila titulo="Ángulo" valor={concept.angle} />
        <Fila titulo="Mensaje" valor={concept.keyMessage} />
        <Fila titulo="Insight" valor={concept.audienceInsight} />
        <Fila titulo="Propuesta de valor" valor={concept.valueProposition} />
        <Fila titulo="CTA" valor={concept.cta} />
      </dl>

      <details className="mt-3 rounded-lg bg-arena-50 px-3 py-2">
        <summary className="text-[12.5px] font-semibold text-verde-800">Por qué esta idea</summary>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-tinta-600">{concept.rationale}</p>
      </details>

      {puedeElegir && (
        <div className="mt-auto pt-4">
          {!concept.selected && (
            <button
              type="button"
              onClick={onSelect}
              disabled={trabajando !== null}
              className="w-full rounded-lg border border-verde-800 px-3 py-2 text-[13.5px] font-semibold text-verde-800 disabled:opacity-50"
            >
              Elegir esta
            </button>
          )}

          <details className="mt-2">
            <summary className="text-[12.5px] font-semibold text-tinta-600">Pedir un cambio</summary>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {REVISIONES.map((kind) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => onRevise(kind, "")}
                  disabled={trabajando !== null}
                  className="rounded-full border border-arena-300 px-2.5 py-1 text-[12px] text-tinta-600 hover:border-verde-700 hover:text-verde-800 disabled:opacity-50"
                >
                  {REVISION_LABELS[kind]}
                </button>
              ))}
            </div>

            {/* Cambiar el tono necesita saber a cuál: el backend lo exige. */}
            <div className="mt-2 flex gap-1.5">
              <input
                value={tono}
                onChange={(e) => setTono(e.target.value)}
                placeholder="más cercano, más sobrio…"
                className="min-w-0 flex-1 rounded-lg border border-arena-300 bg-arena-50 px-2.5 py-1.5 text-[12.5px]"
              />
              <button
                type="button"
                onClick={() => {
                  if (!tono.trim()) return;
                  onRevise("change_tone", tono.trim());
                  setTono("");
                }}
                disabled={trabajando !== null}
                className="rounded-lg border border-arena-300 px-2.5 py-1.5 text-[12.5px] font-semibold text-tinta-600 disabled:opacity-50"
              >
                Cambiar tono
              </button>
            </div>
          </details>
        </div>
      )}
    </article>
  );
}

function Fila({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] tracking-[0.08em] text-tinta-500 uppercase">{titulo}</dt>
      <dd className="text-tinta-900">{valor}</dd>
    </div>
  );
}
