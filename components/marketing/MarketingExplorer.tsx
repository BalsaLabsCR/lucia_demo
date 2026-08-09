"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  marketingApi,
  STATUS_LABELS,
  type CampaignSummary,
  type ChannelFormat,
} from "@/lib/marketing";
import { relativeTime } from "@/lib/chats";
import { NewCampaignForm } from "./NewCampaignForm";
import { CampaignWorkspace } from "./CampaignWorkspace";

/**
 * Fetcher puro: devuelve datos o lanza. Sin estado de React adentro, igual que en
 * el listado de interesados — así el efecto solo decide qué hacer con el
 * resultado y se puede cancelar si el componente se desmonta en el medio.
 */
async function fetchListado(): Promise<{
  campaigns: CampaignSummary[];
  formats: ChannelFormat[];
}> {
  const [lista, capacidades] = await Promise.all([
    marketingApi<{ campaigns: CampaignSummary[] }>("campaigns"),
    marketingApi<{ formats: ChannelFormat[] }>("capabilities"),
  ]);
  return { campaigns: lista.campaigns, formats: capacidades.formats };
}

/**
 * La sección de Marketing del panel.
 *
 * Dos vistas: el listado de campañas y el taller de una. La segunda se abre con
 * ?campaign=<id>, así que se puede compartir el enlace de una campaña con alguien
 * del equipo.
 */
export function MarketingExplorer() {
  const searchParams = useSearchParams();
  const abierta = searchParams.get("campaign");

  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [formats, setFormats] = useState<ChannelFormat[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [creando, setCreando] = useState(false);
  /** Se incrementa para volver a leer. Lo usa el taller al cambiar algo. */
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void fetchListado().then(
      (datos) => {
        if (cancelled) return;
        setCampaigns(datos.campaigns);
        setFormats(datos.formats);
        setError(null);
        setCargando(false);
      },
      (err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "No se pudo cargar el listado");
        setCargando(false);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [version]);

  if (abierta) {
    return <CampaignWorkspace id={abierta} onChange={() => setVersion((v) => v + 1)} />;
  }

  return (
    <main className="mx-auto max-w-[1100px] px-4 py-8 dk:px-8">
      <header className="mb-6">
        <p className="font-mono text-[11px] tracking-[0.14em] text-verde-700 uppercase">
          Panel de Lucía
        </p>
        <h1 className="mt-1 font-display text-[30px] leading-tight text-tinta-900">Marketing</h1>
        <p className="mt-2 max-w-[62ch] text-[14.5px] text-tinta-600">
          Lucía propone la estrategia, escribe el guion y genera el material. Lo que se publica lo
          decide la clínica: cada pieza pasa por tu revisión antes de darse por final.
        </p>
      </header>

      {error && (
        <p className="mb-5 rounded-lg border border-error-bd bg-error-bg px-4 py-3 text-[13.5px] text-error-tx">
          {error}
        </p>
      )}

      {creando ? (
        <NewCampaignForm
          formats={formats}
          onCancel={() => setCreando(false)}
          onCreated={(id) => {
            setCreando(false);
            // Recién creada: se abre su taller, que es el paso siguiente.
            window.location.search = `?campaign=${encodeURIComponent(id)}`;
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setCreando(true)}
          className="mb-6 rounded-lg bg-verde-800 px-4 py-2.5 text-[14px] font-semibold text-crema-100 shadow-suave transition-colors hover:bg-verde-950"
        >
          Nueva campaña
        </button>
      )}

      <section className="overflow-hidden rounded-xl border border-arena-200 bg-blanco shadow-suave">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-arena-200 bg-arena-50 font-mono text-[10.5px] tracking-[0.08em] text-tinta-500 uppercase">
              <th className="px-4 py-2.5 font-normal">Campaña</th>
              <th className="px-4 py-2.5 font-normal">Canal</th>
              <th className="px-4 py-2.5 font-normal">Estado</th>
              <th className="px-4 py-2.5 font-normal">Material</th>
              <th className="px-4 py-2.5 font-normal">Creada</th>
              <th className="px-4 py-2.5 font-normal">Actualizada</th>
            </tr>
          </thead>
          <tbody>
            {cargando && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[14px] text-tinta-500">
                  Cargando…
                </td>
              </tr>
            )}

            {!cargando && campaigns.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[14px] text-tinta-500">
                  Todavía no hay campañas. Creá la primera con el brief de lo que querés promocionar.
                </td>
              </tr>
            )}

            {campaigns.map((c) => (
              <tr
                key={c.id}
                className="cursor-pointer border-b border-arena-200 transition-colors last:border-0 hover:bg-arena-50"
                onClick={() => {
                  window.location.search = `?campaign=${encodeURIComponent(c.id)}`;
                }}
              >
                <td className="px-4 py-3 text-[14.5px] font-semibold text-tinta-900">{c.name}</td>
                <td className="px-4 py-3 text-[13.5px] text-tinta-600">{c.channelLabel}</td>
                <td className="px-4 py-3">
                  <StatusChip status={c.status} label={c.statusLabel} />
                </td>
                <td className="px-4 py-3 text-[13px] text-tinta-600">
                  {c.assetCounts.total === 0 ? (
                    "—"
                  ) : (
                    <>
                      {c.assetCounts.approved}/{c.assetCounts.total} aprobadas
                      {c.assetCounts.pending > 0 && (
                        <span className="ml-1.5 text-ambar-tx">
                          · {c.assetCounts.pending} sin revisar
                        </span>
                      )}
                    </>
                  )}
                </td>
                <td className="px-4 py-3 text-[13px] text-tinta-500">
                  {relativeTime(c.createdAt)}
                </td>
                <td className="px-4 py-3 text-[13px] text-tinta-500">
                  {relativeTime(c.updatedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}

/** El estado, con el color que corresponde a lo que exige. */
export function StatusChip({ status, label }: { status: string; label?: string }) {
  // Ámbar = te está esperando. Verde = ya pasó por una persona.
  const espera = status === "strategy_review" || status === "creative_review";
  const listo = status === "approved" || status === "strategy_approved";

  const clases = espera
    ? "border-ambar-bd bg-ambar-bg text-ambar-tx"
    : listo
      ? "border-menta-200 bg-verde-50 text-verde-800"
      : "border-arena-300 bg-arena-100 text-tinta-600";

  return (
    <span
      className={`rounded-full border px-2.5 py-0.5 font-mono text-[10.5px] tracking-[0.06em] ${clases}`}
    >
      {label ?? STATUS_LABELS[status] ?? status}
    </span>
  );
}
