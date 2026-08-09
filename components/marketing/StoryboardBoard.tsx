"use client";

import { useState } from "react";
import { sceneTime, type CampaignDetail, type Storyboard } from "@/lib/marketing";

/**
 * El guion, escena por escena, en el orden en que se va a ver.
 *
 * Los textos se editan acá mismo: la IA hace de directora creativa y quien
 * aprueba corrige lo que suena raro. Al guardar, el backend revalida contra el
 * formato —que un Reel de 15 segundos siga durando 15— así que una edición a mano
 * no puede dejar un guion que no se pueda montar.
 */
export function StoryboardBoard({
  campaign,
  trabajando,
  onGenerate,
  onSave,
  onGenerateAssets,
}: {
  campaign: CampaignDetail;
  trabajando: string | null;
  onGenerate: () => void;
  onSave: (storyboard: Storyboard) => void;
  onGenerateAssets: () => void;
}) {
  /**
   * Los cambios locales, o null si no se está editando.
   *
   * El guion que se muestra es `edicion ?? campaign.storyboard`: no se copian las
   * props a estado, se derivan al renderizar. Copiarlas obliga a sincronizarlas
   * con un efecto, y ese efecto es el que después pisa lo que alguien estaba
   * escribiendo cuando llega una respuesta del backend.
   */
  const [edicion, setEdicion] = useState<Storyboard | null>(null);

  const editando = edicion !== null;
  const guion = edicion ?? campaign.storyboard;
  const generando = campaign.status === "assets_generating";

  return (
    <section className="mb-8">
      <div className="mb-3 flex flex-wrap items-baseline gap-3">
        <h2 className="font-display text-[21px] text-tinta-900">Guion</h2>
        {guion && (
          <span className="text-[12.5px] text-tinta-500">
            {guion.durationSeconds}s · {guion.aspectRatio} · {guion.scenes.length} escenas
          </span>
        )}

        <div className="ml-auto flex gap-2">
          {campaign.status === "strategy_approved" && (
            <button
              type="button"
              onClick={onGenerate}
              disabled={trabajando !== null}
              className="rounded-lg border border-verde-800 px-3.5 py-2 text-[13.5px] font-semibold text-verde-800 disabled:opacity-60"
            >
              {trabajando === "guion"
                ? "Escribiendo…"
                : campaign.storyboard
                  ? "Regenerar guion"
                  : "Escribir el guion"}
            </button>
          )}

          {campaign.storyboard && campaign.status === "strategy_approved" && (
            <button
              type="button"
              onClick={onGenerateAssets}
              disabled={trabajando !== null}
              className="rounded-lg bg-verde-800 px-3.5 py-2 text-[13.5px] font-semibold text-crema-100 disabled:opacity-60"
            >
              {trabajando === "material" ? "Arrancando…" : "Aprobar guion y generar material"}
            </button>
          )}
        </div>
      </div>

      {generando && (
        <p className="mb-3 rounded-lg border border-ambar-bd bg-ambar-bg px-4 py-2.5 text-[13.5px] text-ambar-tx">
          Generando imágenes y voz en off. Podés cerrar esta página y volver: el progreso no se
          pierde.
        </p>
      )}

      {!guion ? (
        <p className="rounded-xl border border-dashed border-arena-300 bg-arena-50 px-4 py-8 text-center text-[14px] text-tinta-500">
          Con la estrategia aprobada, Lucía escribe el guion: qué se ve en cada segundo, qué dice la
          voz y qué texto va en pantalla.
        </p>
      ) : (
        <>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {guion.scenes.map((scene, i) => (
              <article
                key={i}
                className="min-w-[230px] flex-1 rounded-xl border border-arena-200 bg-blanco p-3.5 shadow-suave"
              >
                <header className="mb-2 flex items-baseline justify-between gap-2">
                  <span className="font-mono text-[10.5px] tracking-[0.06em] text-verde-700 uppercase">
                    Escena {i + 1}
                  </span>
                  <span className="font-mono text-[10.5px] text-tinta-500">
                    {sceneTime(scene.start, scene.end)}
                  </span>
                </header>

                <p className="mb-2 text-[12px] font-semibold text-tinta-600">{scene.purpose}</p>
                <p className="mb-3 text-[12.5px] leading-snug text-tinta-600">
                  {scene.visualDescription}
                </p>

                <Editable
                  label="Texto en pantalla"
                  value={scene.overlayText}
                  editando={editando}
                  onChange={(v) => actualizarEscena(i, { overlayText: v })}
                />
                <Editable
                  label="Voz en off"
                  value={scene.voiceover}
                  editando={editando}
                  onChange={(v) => actualizarEscena(i, { voiceover: v })}
                />

                <p className="mt-2 font-mono text-[10px] text-tinta-500">
                  {scene.source === "existing_asset"
                    ? "material de la clínica"
                    : scene.source === "generated"
                      ? "imagen generada"
                      : "solo texto"}
                  {" · "}
                  {scene.transition}
                </p>
              </article>
            ))}

            {/* El CTA cierra el recorrido: se muestra como el último bloque. */}
            <article className="min-w-[150px] rounded-xl border border-verde-800 bg-verde-50 p-3.5">
              <span className="font-mono text-[10.5px] tracking-[0.06em] text-verde-800 uppercase">
                Cierre
              </span>
              <p className="mt-2 text-[13.5px] font-semibold text-verde-950">
                {campaign.channelContent?.cta ??
                  campaign.concepts.find((c) => c.selected)?.cta ??
                  "CTA"}
              </p>
            </article>
          </div>

          <details className="mt-3 rounded-lg border border-arena-200 bg-blanco px-4 py-3">
            <summary className="text-[13px] font-semibold text-verde-800">
              Guion completo de la voz
            </summary>
            <p className="mt-2 text-[13.5px] leading-relaxed whitespace-pre-wrap text-tinta-900">
              {guion.voiceoverScript || "—"}
            </p>
            {guion.musicMood && (
              <p className="mt-2 text-[12.5px] text-tinta-500">
                Música sugerida: {guion.musicMood}{" "}
                <span className="text-tinta-500">(sugerencia de Lucía, no un dato de la clínica)</span>
              </p>
            )}
          </details>

          {campaign.status === "strategy_approved" && (
            <div className="mt-3 flex gap-2">
              {editando ? (
                <>
                  <button
                    type="button"
                    onClick={() => edicion && onSave(edicion)}
                    disabled={trabajando !== null}
                    className="rounded-lg bg-verde-800 px-3.5 py-2 text-[13.5px] font-semibold text-crema-100 disabled:opacity-60"
                  >
                    {trabajando === "guardar-guion" ? "Guardando…" : "Guardar cambios"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEdicion(null)}
                    className="rounded-lg border border-arena-300 px-3.5 py-2 text-[13.5px] font-semibold text-tinta-600"
                  >
                    Descartar
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setEdicion(structuredClone(campaign.storyboard))}
                  className="rounded-lg border border-arena-300 px-3.5 py-2 text-[13.5px] font-semibold text-tinta-600"
                >
                  Editar los textos
                </button>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );

  function actualizarEscena(index: number, cambios: Partial<Storyboard["scenes"][number]>): void {
    setEdicion((actual) => {
      if (!actual) return actual;
      const scenes = actual.scenes.map((s, i) => (i === index ? { ...s, ...cambios } : s));
      return { ...actual, scenes };
    });
  }
}

function Editable({
  label,
  value,
  editando,
  onChange,
}: {
  label: string;
  value: string;
  editando: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="mt-2 block">
      <span className="font-mono text-[10px] tracking-[0.08em] text-tinta-500 uppercase">
        {label}
      </span>
      {editando ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          className="mt-0.5 w-full rounded-lg border border-arena-300 bg-arena-50 px-2 py-1.5 text-[12.5px] text-tinta-900"
        />
      ) : (
        <p className="mt-0.5 text-[13px] text-tinta-900">{value || "—"}</p>
      )}
    </label>
  );
}
