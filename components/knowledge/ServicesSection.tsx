"use client";

import { newId, type KnowledgeService } from "@/lib/knowledge";
import {
  AddButton,
  Checkbox,
  Field,
  RemoveButton,
  SectionCard,
  inputCls,
  textareaCls,
} from "./fields";

interface Props {
  value: KnowledgeService[];
  onChange: (services: KnowledgeService[]) => void;
}

const DEFAULT_DURATION_MINUTES = 60;

/** "1 hora", "1 h 30 min" — solo para acompañar al campo en minutos. */
function humanDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const hourText = hours === 1 ? "1 hora" : `${hours} horas`;
  return rest === 0 ? hourText : `${hourText} ${rest} min`;
}

export function ServicesSection({ value, onChange }: Props) {
  const update = (id: string, patch: Partial<KnowledgeService>) =>
    onChange(value.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const add = () =>
    onChange([
      ...value,
      {
        id: newId("svc"),
        enabled: true,
        name: "",
        publicDescription: "",
        aiNotes: "",
        price: "",
        durationMinutes: DEFAULT_DURATION_MINUTES,
        discount: "",
      },
    ]);

  return (
    <SectionCard
      id="servicios"
      title="Servicios"
      description="Lucía solo ofrece y cotiza los servicios activos de esta lista. Si le preguntan por algo que no está aquí, dirá que la clínica no lo ofrece."
    >
      <div className="flex flex-col gap-3">
        {value.map((service) => (
          <details
            key={service.id}
            open={service.name === ""}
            className="group rounded-[12px] border border-arena-200 bg-arena-50"
          >
            <summary className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
              <span className="text-tinta-500 transition-transform group-open:rotate-90">▸</span>
              <span className={`font-semibold ${service.enabled ? "" : "text-tinta-500 line-through"}`}>
                {service.name || "Servicio nuevo"}
              </span>
              {service.price && (
                <span className="font-display text-[14px] text-tinta-600">{service.price}</span>
              )}
              <span className="font-mono text-[11.5px] text-tinta-500">
                {service.durationMinutes} min
              </span>
              {service.discount && (
                <span className="rounded-full border border-ambar-bd bg-ambar-bg px-2 py-0.5 text-[11px] font-semibold text-ambar-tx">
                  promo
                </span>
              )}
              {!service.enabled && (
                <span className="rounded-full border border-arena-300 bg-arena-100 px-2 py-0.5 text-[11px] font-semibold text-tinta-500">
                  Lucía no lo conoce
                </span>
              )}
            </summary>

            <div className="grid gap-4 border-t border-arena-200 p-4 dk:grid-cols-2">
              <Field label="Nombre del servicio">
                <input
                  className={inputCls}
                  value={service.name}
                  onChange={(e) => update(service.id, { name: e.target.value })}
                  placeholder="Limpieza dental"
                />
              </Field>
              <Field label="Precio" hint='Texto libre: "₡35.000", "desde ₡120.000", "según valoración".'>
                <input
                  className={inputCls}
                  value={service.price}
                  onChange={(e) => update(service.id, { price: e.target.value })}
                />
              </Field>
              <Field
                label="Duración"
                hint="Cuánto bloquea en la agenda. Lucía no agenda una cita que no alcance a terminar antes del cierre, ni encima de otra."
              >
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={5}
                    max={480}
                    step={5}
                    className={`${inputCls} max-w-[110px]`}
                    value={service.durationMinutes}
                    onChange={(e) =>
                      update(service.id, {
                        // Un servicio sin duración rompe la agenda, así que el
                        // campo vacío cae al default en vez de quedar en NaN.
                        durationMinutes: Number(e.target.value) || DEFAULT_DURATION_MINUTES,
                      })
                    }
                  />
                  <span className="text-[13.5px] text-tinta-500">
                    minutos {service.durationMinutes >= 60 && `· ${humanDuration(service.durationMinutes)}`}
                  </span>
                </div>
              </Field>
              <Field label="Descripción pública" hint="Lo que Lucía puede decirle al cliente sobre el servicio." className="dk:col-span-2">
                <textarea
                  className={textareaCls}
                  value={service.publicDescription}
                  onChange={(e) => update(service.id, { publicDescription: e.target.value })}
                />
              </Field>
              <Field
                label="Contexto oculto para la IA"
                hint="Solo para Lucía: cómo se realiza el procedimiento, duración, quién lo hace, aclaraciones. Le da contexto para responder preguntas complejas sin recitarlo textualmente."
                className="dk:col-span-2"
              >
                <textarea
                  className={textareaCls}
                  value={service.aiNotes}
                  onChange={(e) => update(service.id, { aiNotes: e.target.value })}
                />
              </Field>
              <Field
                label="Descuento o promoción vigente"
                hint="Si hay algo aquí, Lucía lo anuncia cuando el servicio salga en la conversación. Déjelo vacío si no hay promoción."
                className="dk:col-span-2"
              >
                <input
                  className={inputCls}
                  value={service.discount}
                  onChange={(e) => update(service.id, { discount: e.target.value })}
                  placeholder="15% de descuento durante octubre"
                />
              </Field>

              <div className="flex items-center justify-between gap-3 dk:col-span-2">
                <Checkbox
                  checked={service.enabled}
                  onChange={(enabled) => update(service.id, { enabled })}
                >
                  Lucía conoce y ofrece este servicio
                </Checkbox>
                <RemoveButton
                  onClick={() => onChange(value.filter((s) => s.id !== service.id))}
                  label={`Eliminar el servicio ${service.name || "nuevo"}`}
                />
              </div>
            </div>
          </details>
        ))}
      </div>

      <div className="mt-4">
        <AddButton onClick={add}>Agregar servicio</AddButton>
      </div>
    </SectionCard>
  );
}
