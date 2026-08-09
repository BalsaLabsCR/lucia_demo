"use client";

import { useEffect, useState } from "react";
import {
  marketingApi,
  type CampaignDetail,
  type ChannelFormat,
  type PromotionOption,
} from "@/lib/marketing";

/**
 * El formulario de una campaña nueva: el brief.
 *
 * Los siete bloques son obligatorios y el backend los exige igual, así que acá no
 * hay validación paralela: se marcan como requeridos y, si algo falla, se muestra
 * el mensaje del backend. Duplicar las reglas en el navegador es la forma más
 * común de que se desincronicen.
 */
export function NewCampaignForm({
  formats,
  onCreated,
  onCancel,
}: {
  formats: ChannelFormat[];
  onCreated: (id: string) => void;
  onCancel: () => void;
}) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assets, setAssets] = useState<{ url: string; label: string }[]>([]);
  const [assetUrl, setAssetUrl] = useState("");
  const [assetLabel, setAssetLabel] = useState("");
  const [promociones, setPromociones] = useState<PromotionOption[]>([]);
  const [elegidas, setElegidas] = useState<string[]>([]);

  // Las promociones del negocio, con su vigencia ya evaluada por el backend. Se
  // ofrecen para elegir: escribir un descuento a mano ya no es una opción.
  useEffect(() => {
    let cancelled = false;
    void marketingApi<{ promotions: PromotionOption[] }>("promotions").then(
      (datos) => {
        if (!cancelled) setPromociones(datos.promotions);
      },
      () => {
        if (!cancelled) setPromociones([]);
      }
    );
    return () => {
      cancelled = true;
    };
  }, []);

  async function crear(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEnviando(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const texto = (campo: string) => String(form.get(campo) ?? "").trim();
    const lista = (campo: string) =>
      texto(campo)
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

    try {
      const campaña = await marketingApi<CampaignDetail>("campaigns", {
        method: "POST",
        body: {
          name: texto("name"),
          channel: texto("channel"),
          brief: {
            context: texto("context"),
            instruction: texto("instruction"),
            audience: texto("audience"),
            objective: texto("objective"),
            keyMessage: texto("keyMessage"),
            styleAndTone: texto("styleAndTone"),
            cta: texto("cta"),
            keywords: lista("keywords"),
            competitorNotes: texto("competitorNotes"),
            campaignGoal: texto("campaignGoal"),
            primaryKpi: texto("primaryKpi"),
            secondaryKpis: lista("secondaryKpis"),
            constraints: lista("constraints"),
            additionalInstructions: texto("additionalInstructions"),
            // Referencias a promociones declaradas. Sin ninguna, Lucía no puede
            // mencionar descuentos — que es lo correcto si no hay ninguno.
            promotionIds: elegidas,
          },
        },
      });

      // El material se adjunta después de crear, porque cuelga de la campaña.
      for (const asset of assets) {
        await marketingApi(`campaigns/${campaña.id}/assets`, {
          method: "POST",
          body: { kind: "image", url: asset.url, label: asset.label },
        });
      }

      onCreated(campaña.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la campaña");
      setEnviando(false);
    }
  }

  return (
    <form
      onSubmit={crear}
      className="mb-6 rounded-xl border border-arena-200 bg-blanco p-5 shadow-suave dk:p-6"
    >
      <h2 className="font-display text-[21px] text-tinta-900">Nueva campaña</h2>
      <p className="mt-1 mb-5 max-w-[64ch] text-[13.5px] text-tinta-600">
        Contale a Lucía qué querés promocionar. Cuanto más concreto el brief, menos vueltas después:
        lo que no le digas, no lo va a inventar.
      </p>

      {error && (
        <p className="mb-4 rounded-lg border border-error-bd bg-error-bg px-4 py-3 text-[13.5px] text-error-tx">
          {error}
        </p>
      )}

      <div className="grid gap-4 dk:grid-cols-2">
        <Campo name="name" label="Nombre de la campaña" required placeholder="Blanqueamiento — agosto" />

        <label className="block">
          <span className="mb-1 block text-[13px] font-semibold text-tinta-900">Canal</span>
          <select
            name="channel"
            required
            defaultValue={formats[0]?.id ?? ""}
            className="w-full rounded-lg border border-arena-300 bg-arena-50 px-3 py-2 text-[14px] text-tinta-900"
          >
            {formats.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
                {f.duration ? ` · ${f.duration.recommended}s · ${f.aspectRatio}` : ` · ${f.aspectRatio}`}
              </option>
            ))}
          </select>
        </label>

        <Campo
          name="objective"
          label="Objetivo"
          required
          placeholder="Generar citas de valoración durante agosto"
        />
        <Campo
          name="audience"
          label="Público"
          required
          placeholder="Adultos de 25 a 40 años interesados en mejorar su sonrisa"
        />
        <Campo
          name="keyMessage"
          label="Mensaje clave"
          required
          placeholder="Blanqueamiento profesional, hecho por un odontólogo"
        />
        <Campo
          name="cta"
          label="Qué querés que haga la persona"
          required
          placeholder="Agendá tu cita por WhatsApp"
        />
        <Campo
          name="styleAndTone"
          label="Estilo y tono"
          required
          placeholder="Moderno, limpio y profesional"
        />
        <Campo
          name="context"
          label="Contexto"
          required
          textarea
          className="dk:col-span-2"
          placeholder="Agosto es un mes flojo y queremos llenar los espacios de la tarde."
        />
        <Campo
          name="instruction"
          label="Qué pieza querés"
          required
          textarea
          className="dk:col-span-2"
          placeholder="Un Reel corto que muestre el antes y el después y cierre invitando a agendar."
        />
        <Campo
          name="constraints"
          label="Restricciones (una por línea)"
          textarea
          className="dk:col-span-2"
          placeholder={"No prometer resultados\nNo mostrar pacientes reales sin autorización"}
        />
        <Campo
          name="additionalInstructions"
          label="Instrucciones adicionales"
          textarea
          className="dk:col-span-2"
        />
      </div>

      <fieldset className="mt-4 rounded-lg border border-arena-200 px-4 py-3">
        <legend className="px-1 text-[13px] font-semibold text-tinta-900">
          Promociones que anuncia
        </legend>
        <p className="mb-3 text-[12.5px] text-tinta-500">
          Solo las que la clínica declaró en{" "}
          <a href="/lucia/knowledge#promociones" className="font-semibold text-verde-800 underline">
            Conocimiento → Promociones
          </a>
          . Sin ninguna marcada, Lucía no va a mencionar ningún descuento: no inventa promociones.
        </p>

        {promociones.length === 0 ? (
          <p className="text-[13px] text-tinta-500">
            La clínica no tiene promociones cargadas.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {promociones.map((p) => (
              <label
                key={p.id}
                className={`flex items-start gap-2 text-[13.5px] ${p.active ? "" : "opacity-60"}`}
              >
                <input
                  type="checkbox"
                  disabled={!p.active}
                  checked={elegidas.includes(p.id)}
                  onChange={(e) =>
                    setElegidas(
                      e.target.checked
                        ? [...elegidas, p.id]
                        : elegidas.filter((id) => id !== p.id)
                    )
                  }
                  className="mt-1"
                />
                <span>
                  <span className="font-semibold text-tinta-900">{p.name}</span>{" "}
                  <span className="text-tinta-600">— {p.headline}</span>
                  {!p.active && (
                    <span className="block text-[12px] text-ambar-tx">
                      No se puede anunciar: {p.blockers.join("; ")}.
                    </span>
                  )}
                </span>
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <details className="mt-4 rounded-lg border border-arena-200 bg-arena-50 px-4 py-3">
        <summary className="text-[13.5px] font-semibold text-verde-800">
          Información estratégica (opcional)
        </summary>
        <div className="mt-3 grid gap-4 dk:grid-cols-2">
          <Campo name="campaignGoal" label="Meta de la campaña" />
          <Campo name="primaryKpi" label="KPI principal" />
          <Campo name="keywords" label="Keywords (coma o línea)" />
          <Campo name="secondaryKpis" label="KPIs secundarios" />
          <Campo
            name="competitorNotes"
            label="Notas de competencia"
            textarea
            className="dk:col-span-2"
            hint="Lo que vos sepas. Lucía no sale a investigar por su cuenta ni lo inventa."
          />
        </div>
      </details>

      <fieldset className="mt-4 rounded-lg border border-arena-200 px-4 py-3">
        <legend className="px-1 text-[13px] font-semibold text-tinta-900">
          Fotos y videos de la clínica
        </legend>
        <p className="mb-3 text-[12.5px] text-tinta-500">
          Pegá la URL del material que ya tenés publicado. Lucía lo prefiere antes que generar una
          imagen: una foto real de la clínica siempre gana.
        </p>

        <div className="flex flex-wrap gap-2">
          <input
            value={assetUrl}
            onChange={(e) => setAssetUrl(e.target.value)}
            placeholder="https://…"
            className="min-w-[240px] flex-1 rounded-lg border border-arena-300 bg-arena-50 px-3 py-2 text-[14px]"
          />
          <input
            value={assetLabel}
            onChange={(e) => setAssetLabel(e.target.value)}
            placeholder="Qué se ve"
            className="min-w-[160px] rounded-lg border border-arena-300 bg-arena-50 px-3 py-2 text-[14px]"
          />
          <button
            type="button"
            onClick={() => {
              if (!assetUrl.trim()) return;
              setAssets([...assets, { url: assetUrl.trim(), label: assetLabel.trim() }]);
              setAssetUrl("");
              setAssetLabel("");
            }}
            className="rounded-lg border border-verde-800 px-3 py-2 text-[13.5px] font-semibold text-verde-800"
          >
            Agregar
          </button>
        </div>

        {assets.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {assets.map((a, i) => (
              <li key={a.url} className="flex items-center gap-2 text-[13px] text-tinta-600">
                <span className="truncate">{a.label || a.url}</span>
                <button
                  type="button"
                  onClick={() => setAssets(assets.filter((_, j) => j !== i))}
                  className="text-error-tx hover:underline"
                >
                  quitar
                </button>
              </li>
            ))}
          </ul>
        )}
      </fieldset>

      <div className="mt-5 flex gap-3">
        <button
          type="submit"
          disabled={enviando}
          className="rounded-lg bg-verde-800 px-4 py-2.5 text-[14px] font-semibold text-crema-100 disabled:opacity-60"
        >
          {enviando ? "Creando…" : "Crear campaña"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-arena-300 px-4 py-2.5 text-[14px] font-semibold text-tinta-600"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

function Campo({
  name,
  label,
  placeholder,
  hint,
  required,
  textarea,
  className,
}: {
  name: string;
  label: string;
  placeholder?: string;
  hint?: string;
  required?: boolean;
  textarea?: boolean;
  className?: string;
}) {
  const clases =
    "w-full rounded-lg border border-arena-300 bg-arena-50 px-3 py-2 text-[14px] text-tinta-900 placeholder:text-tinta-500/70";

  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-1 block text-[13px] font-semibold text-tinta-900">
        {label}
        {required && <span className="ml-1 text-verde-700">*</span>}
      </span>
      {textarea ? (
        <textarea name={name} required={required} placeholder={placeholder} rows={3} className={clases} />
      ) : (
        <input name={name} required={required} placeholder={placeholder} className={clases} />
      )}
      {hint && <span className="mt-1 block text-[12px] text-tinta-500">{hint}</span>}
    </label>
  );
}
