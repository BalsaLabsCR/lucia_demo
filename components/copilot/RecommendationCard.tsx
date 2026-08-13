"use client";

import { useState } from "react";
import {
  ACTION_HINTS,
  ACTION_LABELS,
  CATEGORY_LABELS,
  STATUS_LABELS,
  confidenceLabel,
  formatEvidence,
  isExecutable,
  type BusinessInsight,
  type BusinessRecommendation,
  type ProposedAction,
} from "@/lib/copilot";

/**
 * Una recomendación, con todo lo que hace falta para juzgarla.
 *
 * El orden de la tarjeta es el orden en que una persona decide: QUÉ se
 * recomienda, POR QUÉ, con qué DATOS, con cuánta CONFIANZA, qué se ESPERA, y
 * recién al final qué SUPUESTOS y qué LÍMITES tiene. Los dos últimos no están
 * escondidos en un pie de página: van antes de los botones, porque son
 * justamente lo que alguien tiene que haber leído antes de aprobar.
 *
 * Aprobar y ejecutar son dos pasos separados también acá, no solo en el
 * backend. Después de aprobar aparecen las acciones, cada una con su botón y
 * con una línea que dice qué va a pasar si se aprieta.
 */
export function RecommendationCard({
  recommendation,
  insight,
  presentacion,
  ocupado,
  onApprove,
  onReject,
  onExecute,
}: {
  recommendation: BusinessRecommendation;
  insight: BusinessInsight | null;
  presentacion: boolean;
  ocupado: boolean;
  onApprove: () => void;
  onReject: () => void;
  onExecute: (action: ProposedAction) => void;
}) {
  const [abierta, setAbierta] = useState(false);
  const enRevision = recommendation.status === "pending_review";

  return (
    <li className="rounded-xl border border-arena-200 bg-blanco p-4 shadow-suave">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono text-[10.5px] tracking-[0.08em] text-verde-700 uppercase">
            {CATEGORY_LABELS[recommendation.category] ?? recommendation.category} ·{" "}
            {recommendation.priority === "high"
              ? "Prioridad alta"
              : recommendation.priority === "medium"
                ? "Prioridad media"
                : "Prioridad baja"}
          </p>
          <h3
            className={`mt-1 font-display text-tinta-900 ${
              presentacion ? "text-[26px]" : "text-[19px]"
            }`}
          >
            {recommendation.title}
          </h3>
        </div>
        <StatusChip status={recommendation.status} />
      </div>

      <p className={`mt-2 text-tinta-600 ${presentacion ? "text-[17px]" : "text-[14.5px]"}`}>
        {recommendation.description}
      </p>

      <Bloque titulo="Por qué" presentacion={presentacion}>
        {recommendation.rationale}
      </Bloque>

      <Bloque titulo="Qué se espera" presentacion={presentacion}>
        {recommendation.expectedImpact}
      </Bloque>

      {recommendation.evidence.length > 0 && (
        <div className="mt-3 rounded-lg border border-arena-200 bg-arena-50 p-3">
          <p className="font-mono text-[10px] tracking-[0.08em] text-tinta-500 uppercase">
            Datos que la sostienen
          </p>
          <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5">
            {recommendation.evidence.map((item) => (
              <div key={item.metricKey}>
                <dt className="text-[11.5px] text-tinta-500">{item.label}</dt>
                <dd className="text-[14px] font-semibold text-tinta-900">
                  {formatEvidence(item.value, item.unit)}
                  {item.changePercent !== null && (
                    <span
                      className={`ml-1 text-[12px] font-normal ${
                        item.changePercent < 0 ? "text-error-tx" : "text-verde-800"
                      }`}
                    >
                      {item.changePercent > 0 ? "+" : ""}
                      {item.changePercent}%
                    </span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <p className="mt-3 text-[13px] text-tinta-500">
        Confianza: <strong className="text-tinta-900">{confidenceLabel(recommendation.confidence)}</strong>
      </p>

      {/*
        Supuestos y límites. Van SIEMPRE visibles cuando la recomendación
        espera decisión: son lo que evita que alguien apruebe leyendo solo el
        título. Después de aprobada se pueden plegar.
      */}
      {insight && (enRevision || abierta) && (
        <div className="mt-3 grid gap-3 dk:grid-cols-2">
          <Lista titulo="Está suponiendo que" items={insight.assumptions} />
          <Lista titulo="No puede afirmar" items={insight.limitations} />
        </div>
      )}

      {insight && !enRevision && (
        <button
          type="button"
          onClick={() => setAbierta((v) => !v)}
          className="mt-3 text-[13px] font-semibold text-verde-800 underline"
        >
          {abierta ? "Ocultar supuestos y límites" : "Ver supuestos y límites"}
        </button>
      )}

      {enRevision ? (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-arena-200 pt-4">
          <button
            type="button"
            disabled={ocupado}
            onClick={onApprove}
            className="rounded-lg bg-verde-800 px-4 py-2.5 text-[14px] font-semibold text-crema-100 shadow-suave transition-colors hover:bg-verde-950 disabled:opacity-50"
          >
            Aprobar
          </button>
          <button
            type="button"
            disabled={ocupado}
            onClick={onReject}
            className="rounded-lg border-[1.5px] border-arena-300 bg-blanco px-4 py-2.5 text-[14px] font-semibold text-tinta-600 transition-colors hover:bg-arena-50 disabled:opacity-50"
          >
            Rechazar
          </button>
          <p className="w-full text-[12.5px] text-tinta-500">
            Aprobar no ejecuta nada todavía: después elegís cuáles de las acciones querés hacer.
          </p>
        </div>
      ) : (
        <Acciones
          recommendation={recommendation}
          ocupado={ocupado}
          onExecute={onExecute}
          presentacion={presentacion}
        />
      )}
    </li>
  );
}

function Acciones({
  recommendation,
  ocupado,
  onExecute,
  presentacion,
}: {
  recommendation: BusinessRecommendation;
  ocupado: boolean;
  onExecute: (action: ProposedAction) => void;
  presentacion: boolean;
}) {
  if (recommendation.status === "rejected" || recommendation.status === "superseded") {
    return null;
  }

  return (
    <div className="mt-4 border-t border-arena-200 pt-4">
      <p className="font-mono text-[10px] tracking-[0.08em] text-tinta-500 uppercase">
        Acciones propuestas
      </p>

      <ul className="mt-2 flex flex-col gap-2">
        {recommendation.proposedActions.map((action) => {
          const ejecutable = isExecutable(recommendation, action);
          const campaignId =
            action.linkedCampaignId ??
            (typeof action.result?.campaignId === "string" ? action.result.campaignId : null);

          return (
            <li
              key={action.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-arena-200 bg-arena-50 px-3 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-tinta-900">
                  {ACTION_LABELS[action.kind] ?? action.kind}
                </p>
                {!presentacion && (
                  <p className="text-[12.5px] text-tinta-500">{ACTION_HINTS[action.kind] ?? ""}</p>
                )}

                {action.status === "executed" && (
                  <p className="mt-1 text-[13px] text-verde-800">
                    Hecho
                    {typeof action.result?.summary === "string" ? ` · ${action.result.summary}` : ""}
                  </p>
                )}
                {action.status === "failed" && (
                  <p className="mt-1 text-[13px] text-error-tx">
                    No se pudo:{" "}
                    {typeof action.result?.error === "string" ? action.result.error : "error"}
                  </p>
                )}
              </div>

              {/*
                El enlace al brief creado. Es la traza que cierra el círculo:
                de la evidencia a la recomendación, y de ahí a la campaña.
              */}
              {campaignId ? (
                <a
                  href={`/lucia/marketing?campaign=${encodeURIComponent(campaignId)}`}
                  className="rounded-lg border-[1.5px] border-menta-200 bg-blanco px-3 py-2 text-[13px] font-semibold text-verde-800 no-underline transition-colors hover:bg-verde-50"
                >
                  Abrir en Marketing →
                </a>
              ) : ejecutable ? (
                <button
                  type="button"
                  disabled={ocupado}
                  onClick={() => onExecute(action)}
                  className="rounded-lg bg-verde-800 px-3 py-2 text-[13px] font-semibold text-crema-100 transition-colors hover:bg-verde-950 disabled:opacity-50"
                >
                  Ejecutar
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Bloque({
  titulo,
  children,
  presentacion,
}: {
  titulo: string;
  children: React.ReactNode;
  presentacion: boolean;
}) {
  return (
    <div className="mt-3">
      <p className="font-mono text-[10px] tracking-[0.08em] text-tinta-500 uppercase">{titulo}</p>
      <p className={`mt-0.5 text-tinta-600 ${presentacion ? "text-[16px]" : "text-[14px]"}`}>
        {children}
      </p>
    </div>
  );
}

function Lista({ titulo, items }: { titulo: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-lg border border-arena-200 bg-arena-50 p-3">
      <p className="font-mono text-[10px] tracking-[0.08em] text-tinta-500 uppercase">{titulo}</p>
      <ul className="mt-1.5 flex flex-col gap-1">
        {items.map((item) => (
          <li key={item} className="text-[13px] text-tinta-600">
            · {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function StatusChip({ status }: { status: string }) {
  // Ámbar = te está esperando. Verde = ya pasó por una persona.
  const espera = status === "pending_review";
  const listo = status === "approved" || status === "executed";

  const clases = espera
    ? "border-ambar-bd bg-ambar-bg text-ambar-tx"
    : listo
      ? "border-menta-200 bg-verde-50 text-verde-800"
      : "border-arena-300 bg-arena-100 text-tinta-600";

  return (
    <span
      className={`shrink-0 rounded-full border px-2.5 py-0.5 font-mono text-[10.5px] tracking-[0.06em] ${clases}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
