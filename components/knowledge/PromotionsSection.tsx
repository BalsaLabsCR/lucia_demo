"use client";

import {
  isPromotionActive,
  newId,
  promotionBlockers,
  PROMOTION_TYPE_LABELS,
  type KnowledgePromotion,
  type KnowledgeService,
  type PromotionType,
} from "@/lib/knowledge";
import { AddButton, Checkbox, Field, RemoveButton, SectionCard, inputCls, textareaCls } from "./fields";

interface Props {
  value: KnowledgePromotion[];
  services: KnowledgeService[];
  onChange: (promotions: KnowledgePromotion[]) => void;
}

/**
 * Las promociones del negocio, estructuradas.
 *
 * Antes esto era un campo de texto por servicio y no había forma de saber si lo
 * escrito seguía en pie: "20% en agosto" seguía anunciándose en noviembre, y
 * escribir "no ofrecemos descuentos" ahí convertía la aclaración en una
 * promoción. Acá el número, la vigencia y el alcance son campos, así que el
 * sistema puede decidir por su cuenta cuándo dejar de anunciarla.
 *
 * Es la ÚNICA fuente de descuentos: lo que Lucía anuncia por chat y lo que una
 * campaña de marketing puede afirmar sale de esta lista.
 */
export function PromotionsSection({ value, services, onChange }: Props) {
  const update = (id: string, patch: Partial<KnowledgePromotion>) =>
    onChange(value.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const add = () =>
    onChange([
      ...value,
      {
        id: newId("promo"),
        name: "",
        enabled: true,
        type: "percentage",
        value: 10,
        currency: "",
        description: "",
        appliesToServiceIds: [],
        channels: [],
        conditions: "",
      },
    ]);

  return (
    <SectionCard
      id="promociones"
      title="Promociones"
      description="Lo único que Lucía puede anunciar como descuento. Una promoción vencida, apagada o de un servicio inactivo deja de anunciarse sola, sin que nadie tenga que acordarse."
    >
      <div className="flex flex-col gap-3">
        {value.map((promotion) => {
          const bloqueos = promotionBlockers(promotion, services, new Date());
          const vigente = bloqueos.length === 0;

          return (
            <details
              key={promotion.id}
              open={promotion.name === ""}
              className="group rounded-[12px] border border-arena-200 bg-arena-50"
            >
              <summary className="flex flex-wrap items-center gap-2 px-4 py-3">
                <span
                  className={`rounded-full border px-2.5 py-0.5 font-mono text-[10.5px] tracking-[0.06em] ${
                    vigente
                      ? "border-menta-200 bg-verde-50 text-verde-800"
                      : "border-arena-300 bg-arena-100 text-tinta-500"
                  }`}
                >
                  {vigente ? "vigente hoy" : "no vigente"}
                </span>
                {promotion.importedFrom && (
                  <span className="rounded-full border border-ambar-bd bg-ambar-bg px-2.5 py-0.5 font-mono text-[10.5px] tracking-[0.06em] text-ambar-tx">
                    importada · revisar
                  </span>
                )}
                <span className="text-[14.5px] font-semibold text-tinta-900">
                  {promotion.name || "Promoción sin nombre"}
                </span>
                <span className="text-[13px] text-tinta-500">
                  {describir(promotion)}
                </span>
              </summary>

              <div className="flex flex-col gap-3 border-t border-arena-200 px-4 py-3">
                {promotion.importedFrom && (
                  <p className="rounded-[10px] border border-ambar-bd bg-ambar-bg px-3 py-2 text-[12.5px] text-ambar-tx">
                    Esta promoción se importó del campo viejo de{" "}
                    <strong>{promotion.importedFrom.split(":")[1]}</strong> y quedó apagada a
                    propósito. Nadie sabe si ese descuento sigue en pie: completá el tipo, el valor y
                    la vigencia, y recién ahí habilitala.
                  </p>
                )}

                {!vigente && (
                  <p className="rounded-[10px] border border-arena-300 bg-arena-100 px-3 py-2 text-[12.5px] text-tinta-600">
                    Hoy no se anuncia porque {bloqueos.join("; ")}.
                  </p>
                )}

                <Checkbox
                  checked={promotion.enabled}
                  onChange={(enabled) => update(promotion.id, { enabled })}
                >
                  Habilitada
                </Checkbox>

                <Field label="Nombre interno">
                  <input
                    className={inputCls}
                    value={promotion.name}
                    onChange={(e) => update(promotion.id, { name: e.target.value })}
                    placeholder="Blanqueamiento de agosto"
                  />
                </Field>

                <div className="grid gap-3 dk:grid-cols-3">
                  <Field label="Tipo">
                    <select
                      className={inputCls}
                      value={promotion.type}
                      onChange={(e) =>
                        update(promotion.id, { type: e.target.value as PromotionType })
                      }
                    >
                      {(Object.keys(PROMOTION_TYPE_LABELS) as PromotionType[]).map((t) => (
                        <option key={t} value={t}>
                          {PROMOTION_TYPE_LABELS[t]}
                        </option>
                      ))}
                    </select>
                  </Field>

                  {promotion.type !== "custom" && (
                    <Field
                      label={promotion.type === "percentage" ? "Porcentaje" : "Monto"}
                      hint="Es el número exacto que se puede publicar. Ningún otro pasa."
                    >
                      <input
                        className={inputCls}
                        type="number"
                        min={0}
                        value={promotion.value ?? ""}
                        onChange={(e) =>
                          update(promotion.id, { value: Number(e.target.value) || 0 })
                        }
                      />
                    </Field>
                  )}

                  {(promotion.type === "fixed_amount" || promotion.type === "special_price") && (
                    <Field label="Moneda">
                      <input
                        className={inputCls}
                        value={promotion.currency}
                        onChange={(e) => update(promotion.id, { currency: e.target.value })}
                        placeholder="CRC"
                      />
                    </Field>
                  )}
                </div>

                <div className="grid gap-3 dk:grid-cols-2">
                  <Field label="Desde" hint="Opcional. Vacío = desde ya.">
                    <input
                      className={inputCls}
                      type="date"
                      value={promotion.startsAt ?? ""}
                      onChange={(e) =>
                        update(promotion.id, { startsAt: e.target.value || undefined })
                      }
                    />
                  </Field>
                  <Field label="Hasta" hint="Opcional. Al pasar esta fecha deja de anunciarse.">
                    <input
                      className={inputCls}
                      type="date"
                      value={promotion.endsAt ?? ""}
                      onChange={(e) => update(promotion.id, { endsAt: e.target.value || undefined })}
                    />
                  </Field>
                </div>

                <Field
                  label="Servicios a los que aplica"
                  hint="Sin ninguno marcado, aplica a todo. Si todos los marcados están inactivos, la promoción deja de estar vigente."
                >
                  <div className="flex flex-wrap gap-2">
                    {services.map((service) => {
                      const marcado = promotion.appliesToServiceIds.includes(service.id);
                      return (
                        <button
                          key={service.id}
                          type="button"
                          onClick={() =>
                            update(promotion.id, {
                              appliesToServiceIds: marcado
                                ? promotion.appliesToServiceIds.filter((id) => id !== service.id)
                                : [...promotion.appliesToServiceIds, service.id],
                            })
                          }
                          className={`rounded-full border px-3 py-1 text-[12.5px] ${
                            marcado
                              ? "border-verde-800 bg-verde-50 text-verde-800"
                              : "border-arena-300 bg-blanco text-tinta-600"
                          } ${service.enabled ? "" : "opacity-50"}`}
                        >
                          {service.name || service.id}
                          {!service.enabled && " (inactivo)"}
                        </button>
                      );
                    })}
                  </div>
                </Field>

                <Field
                  label="Canales donde se puede anunciar"
                  hint="Separados por coma. Vacío = en cualquier parte. Ej: instagram, facebook, whatsapp."
                >
                  <input
                    className={inputCls}
                    value={promotion.channels.join(", ")}
                    onChange={(e) =>
                      update(promotion.id, {
                        channels: e.target.value
                          .split(",")
                          .map((c) => c.trim())
                          .filter((c) => c.length > 0),
                      })
                    }
                    placeholder="instagram, facebook"
                  />
                </Field>

                <Field label="Cómo explicarla al público">
                  <textarea
                    className={textareaCls}
                    rows={2}
                    value={promotion.description}
                    onChange={(e) => update(promotion.id, { description: e.target.value })}
                    placeholder="20% de descuento en blanqueamiento dental durante agosto."
                  />
                </Field>

                <Field label="Condiciones" hint="Letra chica que el anuncio no puede omitir.">
                  <textarea
                    className={textareaCls}
                    rows={2}
                    value={promotion.conditions}
                    onChange={(e) => update(promotion.id, { conditions: e.target.value })}
                    placeholder="El precio final se confirma en la valoración."
                  />
                </Field>

                <div>
                  <RemoveButton
                    label="Eliminar promoción"
                    onClick={() => onChange(value.filter((p) => p.id !== promotion.id))}
                  />
                </div>
              </div>
            </details>
          );
        })}

        {value.length === 0 && (
          <p className="rounded-[12px] border border-dashed border-arena-300 bg-arena-50 px-4 py-6 text-center text-[13.5px] text-tinta-500">
            Sin promociones. Lucía no va a mencionar ningún descuento — que es lo correcto mientras
            no haya ninguno.
          </p>
        )}

        <AddButton onClick={add}>Agregar promoción</AddButton>
      </div>
    </SectionCard>
  );
}

/** El resumen de una promoción en una línea. */
function describir(promotion: KnowledgePromotion): string {
  const vigencia =
    promotion.startsAt && promotion.endsAt
      ? ` · ${promotion.startsAt} a ${promotion.endsAt}`
      : promotion.endsAt
        ? ` · hasta ${promotion.endsAt}`
        : "";

  switch (promotion.type) {
    case "percentage":
      return `${promotion.value ?? "?"}% de descuento${vigencia}`;
    case "fixed_amount":
      return `${promotion.currency} ${promotion.value ?? "?"} de descuento${vigencia}`;
    case "special_price":
      return `precio promocional ${promotion.currency} ${promotion.value ?? "?"}${vigencia}`;
    case "custom":
      return `${promotion.description || "a medida"}${vigencia}`;
  }
}

export { isPromotionActive };
