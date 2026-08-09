"use client";

import { useState } from "react";
import {
  ASSET_STATUS_LABELS,
  assetSrc,
  marketingApi,
  type Asset,
  type CampaignDetail,
  type ProductionPackage,
} from "@/lib/marketing";

/**
 * La revisión del material y el cierre.
 *
 * El estado de cada pieza está escrito con palabras y no solo con color: "Sin
 * revisar" es distinto de "Aprobada", y esa diferencia es la que sostiene todo el
 * plugin. Una pieza generada existe; que sirva lo dice una persona.
 */
export function AssetsReview({
  campaign,
  trabajando,
  onApproveAsset,
  onRejectAsset,
  onRegenerate,
  onApproveCampaign,
}: {
  campaign: CampaignDetail;
  trabajando: string | null;
  onApproveAsset: (assetId: string) => void;
  onRejectAsset: (assetId: string, note: string) => void;
  onRegenerate: () => void;
  onApproveCampaign: () => void;
}) {
  const pendientes = campaign.assets.filter(
    (a) => a.status !== "approved" && a.status !== "rejected"
  );
  const rechazadas = campaign.assets.filter((a) => a.status === "rejected");

  return (
    <>
      <section className="mb-8">
        <div className="mb-3 flex flex-wrap items-baseline gap-3">
          <h2 className="font-display text-[21px] text-tinta-900">Material</h2>
          <span className="text-[12.5px] text-tinta-500">
            {campaign.assetCounts.approved} de {campaign.assetCounts.total} aprobadas
          </span>

          {campaign.status === "creative_review" && rechazadas.length > 0 && (
            <button
              type="button"
              onClick={onRegenerate}
              disabled={trabajando !== null}
              className="ml-auto rounded-lg border border-verde-800 px-3.5 py-2 text-[13.5px] font-semibold text-verde-800 disabled:opacity-60"
            >
              {trabajando === "regenerar" ? "Generando…" : "Regenerar lo rechazado"}
            </button>
          )}
        </div>

        <div className="grid gap-4 dk:grid-cols-3">
          {campaign.assets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              revisable={campaign.status === "creative_review"}
              trabajando={trabajando}
              onApprove={() => onApproveAsset(asset.id)}
              onReject={(note) => onRejectAsset(asset.id, note)}
            />
          ))}
        </div>

        {campaign.status === "creative_review" && (
          <div className="mt-4">
            <button
              type="button"
              onClick={onApproveCampaign}
              disabled={trabajando !== null || pendientes.length > 0}
              title={
                pendientes.length > 0
                  ? `Quedan ${pendientes.length} pieza(s) sin revisar`
                  : undefined
              }
              className="rounded-lg bg-verde-800 px-4 py-2.5 text-[14px] font-semibold text-crema-100 disabled:opacity-50"
            >
              {trabajando === "aprobar-campaña" ? "Aprobando…" : "Aprobar la campaña"}
            </button>
            {pendientes.length > 0 && (
              <p className="mt-2 text-[13px] text-tinta-500">
                Faltan {pendientes.length} pieza(s) por revisar. Una campaña aprobada con material
                sin revisar es justo lo que esto viene a evitar.
              </p>
            )}
          </div>
        )}
      </section>

      {campaign.channelContent && (
        <section className="mb-8">
          <h2 className="mb-3 font-display text-[21px] text-tinta-900">
            Texto para {campaign.channelLabel}
          </h2>

          <div className="rounded-xl border border-arena-200 bg-blanco p-5 shadow-suave">
            {campaign.channelContent.headline && (
              <p className="mb-2 text-[16px] font-semibold text-tinta-900">
                {campaign.channelContent.headline}
              </p>
            )}
            <p className="text-[14px] leading-relaxed whitespace-pre-wrap text-tinta-900">
              {campaign.channelContent.caption}
            </p>

            <p className="mt-3 text-[13.5px] text-verde-800">
              {campaign.channelContent.hashtags.join(" ")}
            </p>

            <p className="mt-3 rounded-lg bg-verde-50 px-3 py-2 text-[13.5px] font-semibold text-verde-950">
              {campaign.channelContent.cta}
            </p>

            <button
              type="button"
              onClick={() => {
                const c = campaign.channelContent;
                if (!c) return;
                void navigator.clipboard.writeText(
                  [c.caption, "", c.hashtags.join(" "), "", c.cta].join("\n")
                );
              }}
              className="mt-3 text-[13px] font-semibold text-verde-800 hover:underline"
            >
              Copiar el texto
            </button>
          </div>
        </section>
      )}

      {(campaign.status === "approved" || campaign.status === "creative_review") && (
        <ProductionSection campaign={campaign} />
      )}
    </>
  );
}

function AssetCard({
  asset,
  revisable,
  trabajando,
  onApprove,
  onReject,
}: {
  asset: Asset;
  revisable: boolean;
  trabajando: string | null;
  onApprove: () => void;
  onReject: (note: string) => void;
}) {
  const [motivo, setMotivo] = useState("");
  const [rechazando, setRechazando] = useState(false);

  const aprobada = asset.status === "approved";
  const rechazada = asset.status === "rejected";
  // El archivo se pide por el proxy autenticado de este sitio; nunca hay una URL
  // pública del material.
  const src = assetSrc(asset);

  return (
    <article
      className={`overflow-hidden rounded-xl border bg-blanco shadow-suave ${
        aprobada ? "border-verde-800" : rechazada ? "border-error-bd" : "border-arena-200"
      }`}
    >
      <div className="grid aspect-[4/5] place-items-center bg-arena-100">
        {asset.status === "generating" ? (
          <span className="text-[13px] text-tinta-500">Generando…</span>
        ) : asset.kind === "audio" && src ? (
          <div className="w-full px-4">
            <audio controls src={src} className="w-full" />
          </div>
        ) : asset.kind === "video" && src ? (
          <video controls src={src} className="h-full w-full object-cover" />
        ) : src ? (
          // El material es privado y se sirve por una ruta autenticada de este
          // sitio: el optimizador de Next no puede cachearlo ni tiene sentido que
          // lo intente.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={asset.label ?? "Material de la campaña"}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="px-4 text-center text-[12.5px] text-tinta-500">
            {asset.reviewNote ?? "Sin archivo"}
          </span>
        )}
      </div>

      <div className="p-3.5">
        <div className="mb-1.5 flex flex-wrap items-baseline gap-2">
          <span
            className={`rounded-full border px-2 py-0.5 font-mono text-[10px] ${
              aprobada
                ? "border-menta-200 bg-verde-50 text-verde-800"
                : rechazada
                  ? "border-error-bd bg-error-bg text-error-tx"
                  : "border-ambar-bd bg-ambar-bg text-ambar-tx"
            }`}
          >
            {ASSET_STATUS_LABELS[asset.status] ?? asset.status}
          </span>
          <span className="font-mono text-[10px] text-tinta-500">
            {asset.origin === "uploaded" ? "de la clínica" : "generado"}
            {asset.sceneIndex !== null ? ` · escena ${asset.sceneIndex + 1}` : ""}
          </span>
        </div>

        <p className="text-[13.5px] font-semibold text-tinta-900">{asset.label ?? asset.kind}</p>

        {asset.reviewNote && (
          <p className="mt-1 text-[12.5px] text-tinta-600">{asset.reviewNote}</p>
        )}

        {asset.prompt && (
          <details className="mt-2">
            <summary className="text-[12px] font-semibold text-tinta-500">
              Con qué se generó
            </summary>
            <p className="mt-1 text-[12px] leading-snug text-tinta-600">{asset.prompt}</p>
          </details>
        )}

        {revisable && asset.status !== "generating" && (
          <div className="mt-3">
            {rechazando ? (
              <div className="flex flex-col gap-1.5">
                <input
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Qué está mal (obligatorio)"
                  className="rounded-lg border border-arena-300 bg-arena-50 px-2.5 py-1.5 text-[12.5px]"
                />
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (!motivo.trim()) return;
                      onReject(motivo.trim());
                      setRechazando(false);
                      setMotivo("");
                    }}
                    disabled={trabajando !== null}
                    className="rounded-lg border border-error-bd bg-error-bg px-2.5 py-1.5 text-[12.5px] font-semibold text-error-tx disabled:opacity-50"
                  >
                    Rechazar
                  </button>
                  <button
                    type="button"
                    onClick={() => setRechazando(false)}
                    className="rounded-lg border border-arena-300 px-2.5 py-1.5 text-[12.5px] text-tinta-600"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-1.5">
                {!aprobada && (
                  <button
                    type="button"
                    onClick={onApprove}
                    disabled={trabajando !== null}
                    className="flex-1 rounded-lg border border-verde-800 px-2.5 py-1.5 text-[12.5px] font-semibold text-verde-800 disabled:opacity-50"
                  >
                    Aprobar
                  </button>
                )}
                {!rechazada && (
                  <button
                    type="button"
                    onClick={() => setRechazando(true)}
                    className="flex-1 rounded-lg border border-arena-300 px-2.5 py-1.5 text-[12.5px] font-semibold text-tinta-600"
                  >
                    Rechazar
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

/**
 * El paquete de producción: lo que se lleva a CapCut, Premiere o donde sea.
 *
 * Se pide bajo demanda porque es una lectura, no un estado: se arma con lo que
 * está aprobado en ese momento.
 */
function ProductionSection({ campaign }: { campaign: CampaignDetail }) {
  const [paquete, setPaquete] = useState<ProductionPackage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function cargar() {
    setCargando(true);
    setError(null);
    try {
      setPaquete(await marketingApi<ProductionPackage>(`campaigns/${campaign.id}/production`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo armar el paquete");
    } finally {
      setCargando(false);
    }
  }

  return (
    <section className="mb-8">
      <div className="mb-3 flex flex-wrap items-baseline gap-3">
        <h2 className="font-display text-[21px] text-tinta-900">Paquete de producción</h2>
        <button
          type="button"
          onClick={cargar}
          disabled={cargando}
          className="ml-auto rounded-lg border border-verde-800 px-3.5 py-2 text-[13.5px] font-semibold text-verde-800 disabled:opacity-60"
        >
          {cargando ? "Armando…" : paquete ? "Actualizar" : "Armar el paquete"}
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-error-bd bg-error-bg px-4 py-3 text-[13.5px] text-error-tx">
          {error}
        </p>
      )}

      {paquete && (
        <div className="rounded-xl border border-arena-200 bg-blanco p-5 shadow-suave">
          <p className="text-[13.5px] text-tinta-600">
            {paquete.campaign.channelLabel} · {paquete.campaign.aspectRatio}
            {paquete.campaign.durationSeconds ? ` · ${paquete.campaign.durationSeconds}s` : ""}
          </p>

          {paquete.warnings.length > 0 && (
            <ul className="mt-3 space-y-1.5 rounded-lg border border-ambar-bd bg-ambar-bg px-4 py-3 text-[13px] text-ambar-tx">
              {paquete.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}

          <table className="mt-4 w-full border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b border-arena-200 font-mono text-[10px] tracking-[0.08em] text-tinta-500 uppercase">
                <th className="py-2 font-normal">Tiempo</th>
                <th className="py-2 font-normal">Escena</th>
                <th className="py-2 font-normal">En pantalla</th>
                <th className="py-2 font-normal">Material</th>
              </tr>
            </thead>
            <tbody>
              {paquete.timeline.map((t) => (
                <tr key={t.sceneIndex} className="border-b border-arena-200 last:border-0">
                  <td className="py-2 font-mono text-[12px] text-tinta-500">
                    {t.start}s – {t.end}s
                  </td>
                  <td className="py-2 text-tinta-900">{t.purpose}</td>
                  <td className="py-2 text-tinta-600">{t.overlayText || "—"}</td>
                  <td className="py-2">
                    {t.assetUrl ? (
                      <a
                        href={t.assetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-verde-800 hover:underline"
                      >
                        {t.assetOrigin === "uploaded" ? "foto de la clínica" : "imagen generada"}
                      </a>
                    ) : (
                      <span className="text-ambar-tx">a resolver a mano</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {paquete.voiceoverUrl && (
            <div className="mt-4">
              <p className="mb-1 font-mono text-[10px] tracking-[0.08em] text-tinta-500 uppercase">
                Voz en off aprobada
              </p>
              <audio controls src={paquete.voiceoverUrl} className="w-full" />
            </div>
          )}

          {paquete.firstCut?.url && (
            <div className="mt-4">
              <p className="mb-1 font-mono text-[10px] tracking-[0.08em] text-tinta-500 uppercase">
                Primer corte
              </p>
              <video controls src={paquete.firstCut.url} className="w-full rounded-lg" />
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              const blob = new Blob([JSON.stringify(paquete, null, 2)], {
                type: "application/json",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `campaña-${paquete.campaign.id}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="mt-4 text-[13px] font-semibold text-verde-800 hover:underline"
          >
            Descargar el paquete (JSON con guion, tiempos, textos y enlaces)
          </button>
        </div>
      )}
    </section>
  );
}
