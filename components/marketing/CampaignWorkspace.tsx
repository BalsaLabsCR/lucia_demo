"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  marketingApi,
  STATUS_HINTS,
  STATUS_LABELS,
  STEP_ORDER,
  type CampaignDetail,
} from "@/lib/marketing";
import { StatusChip } from "./MarketingExplorer";
import { ConceptCards } from "./ConceptCards";
import { StoryboardBoard } from "./StoryboardBoard";
import { AssetsReview } from "./AssetsReview";

/** Cada cuánto se relee mientras hay generación en curso (ms). */
const POLL_MS = 3_000;

/** Fetcher puro: devuelve la campaña o lanza. Sin estado de React adentro. */
async function fetchCampaign(id: string): Promise<CampaignDetail> {
  return marketingApi<CampaignDetail>(`campaigns/${id}`);
}

/**
 * El taller de una campaña: el recorrido completo en una sola página.
 *
 * No es un asistente que esconde los pasos anteriores. Una persona que aprueba
 * material necesita poder mirar el brief y el concepto que eligió sin perder
 * dónde estaba, así que todo lo que ya existe se muestra y lo que falta se
 * señala.
 */
export function CampaignWorkspace({ id, onChange }: { id: string; onChange: () => void }) {
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [trabajando, setTrabajando] = useState<string | null>(null);
  /** Se incrementa para volver a leer: la carga inicial y cada vuelta del poll. */
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void fetchCampaign(id).then(
      (datos) => {
        if (cancelled) return;
        setCampaign(datos);
        setError(null);
      },
      (err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "No se pudo cargar la campaña");
      }
    );
    return () => {
      cancelled = true;
    };
  }, [id, version]);

  // Mientras se genera material, el estado vive en el backend: se consulta. Es lo
  // que permite cerrar la pestaña y volver más tarde sin perder nada.
  useEffect(() => {
    if (campaign?.status !== "assets_generating") return;
    const timer = setInterval(() => setVersion((v) => v + 1), POLL_MS);
    return () => clearInterval(timer);
  }, [campaign?.status]);

  /**
   * Corre una acción del panel y refresca.
   *
   * Los errores del backend se muestran tal cual: están escritos para que una
   * persona sepa qué hacer antes ("elegí un concepto", "quedan 2 piezas sin
   * aprobar"), y reemplazarlos por "algo salió mal" sería tirar esa información.
   */
  const accion = useCallback(
    async (etiqueta: string, work: () => Promise<unknown>) => {
      setTrabajando(etiqueta);
      setError(null);
      try {
        await work();
        // Se relee acá y no por el efecto: esto es un manejador de eventos, así
        // que la campaña nueva y el fin del "trabajando" entran juntos y el panel
        // no parpadea con datos viejos.
        setCampaign(await fetchCampaign(id));
        onChange();
      } catch (err) {
        setError(err instanceof Error ? err.message : "La acción falló");
      } finally {
        setTrabajando(null);
      }
    },
    [id, onChange]
  );

  if (!campaign) {
    return (
      <main className="mx-auto max-w-[1100px] px-4 py-8">
        {error ? (
          <p className="rounded-lg border border-error-bd bg-error-bg px-4 py-3 text-[13.5px] text-error-tx">
            {error}
          </p>
        ) : (
          <p className="text-[14px] text-tinta-500">Cargando campaña…</p>
        )}
      </main>
    );
  }

  const paso = STEP_ORDER.indexOf(campaign.status);

  return (
    <main className="mx-auto max-w-[1100px] px-4 py-8 dk:px-8">
      <Link
        href="/lucia/marketing"
        className="text-[13px] font-semibold text-verde-800 hover:underline"
      >
        ← Todas las campañas
      </Link>

      <header className="mt-3 mb-6">
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="font-display text-[28px] leading-tight text-tinta-900">{campaign.name}</h1>
          <StatusChip status={campaign.status} label={campaign.statusLabel} />
          <span className="text-[13px] text-tinta-500">{campaign.channelLabel}</span>
        </div>
        <p className="mt-2 text-[14px] text-tinta-600">{STATUS_HINTS[campaign.status]}</p>
      </header>

      {/* El recorrido, para que se vea qué falta. */}
      <ol className="mb-7 flex flex-wrap gap-1.5">
        {STEP_ORDER.map((estado, i) => (
          <li
            key={estado}
            className={`rounded-full border px-2.5 py-1 font-mono text-[10.5px] tracking-[0.06em] ${
              i < paso
                ? "border-menta-200 bg-verde-50 text-verde-800"
                : i === paso
                  ? "border-verde-800 bg-verde-800 text-crema-100"
                  : "border-arena-200 bg-arena-50 text-tinta-500"
            }`}
          >
            {i + 1}. {STATUS_LABELS[estado] ?? estado}
          </li>
        ))}
      </ol>

      {error && (
        <p className="mb-5 rounded-lg border border-error-bd bg-error-bg px-4 py-3 text-[13.5px] text-error-tx">
          {error}
        </p>
      )}

      <Brief campaign={campaign} />

      <ConceptCards
        campaign={campaign}
        trabajando={trabajando}
        onGenerate={() =>
          accion("conceptos", () =>
            marketingApi(`campaigns/${campaign.id}/concepts`, { method: "POST", body: {} })
          )
        }
        onSelect={(conceptId) =>
          accion(`select-${conceptId}`, () =>
            marketingApi(`campaigns/${campaign.id}/concepts/${conceptId}/select`, {
              method: "POST",
              body: {},
            })
          )
        }
        onRevise={(conceptId, kind, note) =>
          accion(`revise-${conceptId}`, () =>
            marketingApi(`campaigns/${campaign.id}/concepts/${conceptId}/revise`, {
              method: "POST",
              body: { kind, note },
            })
          )
        }
        onApprove={() =>
          accion("aprobar-estrategia", () =>
            marketingApi(`campaigns/${campaign.id}/status`, {
              method: "POST",
              body: { to: "strategy_approved" },
            })
          )
        }
        onReject={() =>
          accion("rechazar-estrategia", () =>
            marketingApi(`campaigns/${campaign.id}/status`, {
              method: "POST",
              body: { to: "draft", note: "Ninguna propuesta sirve; se corrige el brief." },
            })
          )
        }
      />

      {(campaign.status === "strategy_approved" ||
        campaign.storyboard !== null) && (
        <StoryboardBoard
          campaign={campaign}
          trabajando={trabajando}
          onGenerate={() =>
            accion("guion", () =>
              marketingApi(`campaigns/${campaign.id}/storyboard`, { method: "POST", body: {} })
            )
          }
          onSave={(storyboard) =>
            accion("guardar-guion", () =>
              marketingApi(`campaigns/${campaign.id}/storyboard`, {
                method: "PUT",
                body: { storyboard },
              })
            )
          }
          onGenerateAssets={() =>
            accion("material", () =>
              marketingApi(`campaigns/${campaign.id}/assets/generate`, {
                method: "POST",
                body: {},
              })
            )
          }
        />
      )}

      {(campaign.assets.length > 0 || campaign.channelContent !== null) && (
        <AssetsReview
          campaign={campaign}
          trabajando={trabajando}
          onApproveAsset={(assetId) =>
            accion(`aprobar-${assetId}`, () =>
              marketingApi(`campaigns/${campaign.id}/assets/${assetId}/approve`, {
                method: "POST",
                body: {},
              })
            )
          }
          onRejectAsset={(assetId, note) =>
            accion(`rechazar-${assetId}`, () =>
              marketingApi(`campaigns/${campaign.id}/assets/${assetId}/reject`, {
                method: "POST",
                body: { note },
              })
            )
          }
          onRegenerate={() =>
            accion("regenerar", () =>
              marketingApi(`campaigns/${campaign.id}/assets/generate`, {
                method: "POST",
                body: {},
              })
            )
          }
          onApproveCampaign={() =>
            accion("aprobar-campaña", () =>
              marketingApi(`campaigns/${campaign.id}/status`, {
                method: "POST",
                body: { to: "approved" },
              })
            )
          }
        />
      )}

      <History campaign={campaign} />
    </main>
  );
}

/** El brief, para poder mirarlo mientras se revisa lo generado. */
function Brief({ campaign }: { campaign: CampaignDetail }) {
  const { brief } = campaign;

  return (
    <details className="mb-6 rounded-xl border border-arena-200 bg-blanco p-5 shadow-suave">
      <summary className="font-display text-[19px] text-tinta-900">
        El brief{" "}
        <span className="ml-1 font-sans text-[12.5px] font-normal text-tinta-500">
          lo que le pediste
        </span>
      </summary>

      <dl className="mt-4 grid gap-3 dk:grid-cols-2">
        {(
          [
            ["Contexto", brief.context],
            ["Qué pieza", brief.instruction],
            ["Público", brief.audience],
            ["Objetivo", brief.objective],
            ["Mensaje clave", brief.keyMessage],
            ["Estilo y tono", brief.styleAndTone],
            ["CTA", brief.cta],
            [
              "Promociones que anuncia",
              brief.promotionIds.length > 0 ? brief.promotionIds.join(", ") : "Ninguna",
            ],
          ] as const
        ).map(([titulo, valor]) => (
          <div key={titulo}>
            <dt className="font-mono text-[10.5px] tracking-[0.08em] text-tinta-500 uppercase">
              {titulo}
            </dt>
            <dd className="mt-0.5 text-[13.5px] text-tinta-900">{valor}</dd>
          </div>
        ))}
      </dl>

      {brief.constraints.length > 0 && (
        <div className="mt-4">
          <p className="font-mono text-[10.5px] tracking-[0.08em] text-tinta-500 uppercase">
            Restricciones
          </p>
          <ul className="mt-1 list-disc pl-5 text-[13.5px] text-tinta-900">
            {brief.constraints.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      )}
    </details>
  );
}

/**
 * El registro de quién aprobó qué.
 *
 * Es la parte del panel que hace visible el requisito: si mañana alguien pregunta
 * quién autorizó este anuncio, la respuesta está acá.
 */
function History({ campaign }: { campaign: CampaignDetail }) {
  if (campaign.reviews.length === 0) return null;

  return (
    <details className="mt-8 rounded-xl border border-arena-200 bg-blanco p-5 shadow-suave">
      <summary className="font-display text-[19px] text-tinta-900">
        Historial de revisiones{" "}
        <span className="ml-1 font-sans text-[12.5px] font-normal text-tinta-500">
          {campaign.reviews.length} movimientos
        </span>
      </summary>

      <ul className="mt-4 space-y-2">
        {campaign.reviews.map((r) => (
          <li key={r.id} className="flex flex-wrap gap-x-2 text-[13px] text-tinta-600">
            <span className="font-mono text-[11px] text-tinta-500">
              {new Date(r.createdAt).toLocaleString("es-CR")}
            </span>
            <span className="font-semibold text-tinta-900">{r.actor ?? "sin identificar"}</span>
            <span>
              {r.action} · {r.subject}
              {r.toStatus ? ` → ${r.toStatus}` : ""}
            </span>
            {r.note && <span className="text-tinta-500">— {r.note}</span>}
          </li>
        ))}
      </ul>
    </details>
  );
}
