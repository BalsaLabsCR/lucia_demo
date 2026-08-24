"use client";

import { useState } from "react";
import {
  fetchVideoPrompt,
  parseVideoPrompt,
  type VideoPromptResponse,
} from "@/lib/videoPrompt";

/**
 * El paquete convertido en un prompt para un generador de video.
 *
 * Es el último eslabón: hasta acá todo era guion, tiempos y material; esto es
 * lo que se pega en la herramienta que produce la pieza. Se muestra por bloques
 * y no como un párrafo largo porque quien lo va a usar necesita revisar QUÉ se
 * está pidiendo —sobre todo el bloque de lo que no se puede decir— antes de
 * gastar créditos.
 *
 * No llama a ningún modelo: arma texto sobre lo que ya se generó y se aprobó.
 * Se puede apretar dos veces sin consecuencias.
 */
export function VideoPromptSection({ campaignId }: { campaignId: string }) {
  const [respuesta, setRespuesta] = useState<VideoPromptResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  async function generar() {
    setCargando(true);
    setError(null);
    try {
      setRespuesta(await fetchVideoPrompt(campaignId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo armar el prompt");
    } finally {
      setCargando(false);
    }
  }

  async function copiar() {
    if (!respuesta) return;
    try {
      await navigator.clipboard.writeText(respuesta.prompt);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2500);
    } catch {
      // Sin permiso de portapapeles no se pierde nada: el texto está en
      // pantalla y se puede seleccionar a mano.
      setError("El navegador no dejó copiar. Seleccioná el texto y copialo a mano.");
    }
  }

  const secciones = respuesta ? parseVideoPrompt(respuesta.prompt) : [];

  return (
    <div className="mt-6 border-t border-arena-200 pt-5">
      <div className="flex flex-wrap items-baseline gap-3">
        <h3 className="font-display text-[17px] text-tinta-900">Prompt para generar el video</h3>
        <button
          type="button"
          onClick={generar}
          disabled={cargando}
          className="ml-auto rounded-lg bg-verde-800 px-3.5 py-2 text-[13.5px] font-semibold text-crema-100 disabled:opacity-60"
        >
          {cargando ? "Armando…" : respuesta ? "Volver a armar" : "Generar prompt para video"}
        </button>
        {respuesta && (
          <button
            type="button"
            onClick={copiar}
            className="rounded-lg border border-verde-800 px-3.5 py-2 text-[13.5px] font-semibold text-verde-800"
          >
            {copiado ? "¡Copiado!" : "Copiar prompt"}
          </button>
        )}
      </div>

      {error && (
        <p className="mt-3 rounded-lg border border-error-bd bg-error-bg px-4 py-3 text-[13.5px] text-error-tx">
          {error}
        </p>
      )}

      {respuesta && respuesta.warnings.length > 0 && (
        <ul className="mt-3 space-y-1.5 rounded-lg border border-ambar-bd bg-ambar-bg px-4 py-3 text-[13px] text-ambar-tx">
          {respuesta.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}

      {respuesta && (
        <dl className="mt-4 space-y-3">
          {secciones.map((s, i) => (
            <div key={`${s.title}-${i}`} className="rounded-lg bg-arena-50 px-4 py-3">
              {s.title && (
                <dt className="font-mono text-[10px] tracking-[0.08em] text-tinta-500 uppercase">
                  {s.title}
                </dt>
              )}
              <dd className="mt-1 text-[13.5px] whitespace-pre-line text-tinta-900">{s.body}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
