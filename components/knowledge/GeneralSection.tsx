"use client";

import type { Knowledge } from "@/lib/knowledge";
import { Field, SectionCard, inputCls, textareaCls } from "./fields";

interface Props {
  value: Knowledge["general"];
  onChange: (general: Knowledge["general"]) => void;
}

export function GeneralSection({ value, onChange }: Props) {
  const set = <K extends keyof Knowledge["general"]>(key: K, v: string) =>
    onChange({ ...value, [key]: v });

  return (
    <SectionCard
      id="general"
      title="Información general"
      description="Datos básicos de la clínica que Lucía usa en sus respuestas."
    >
      <div className="grid gap-4 dk:grid-cols-2">
        <Field label="Nombre de la clínica">
          <input
            className={inputCls}
            value={value.clinicName}
            onChange={(e) => set("clinicName", e.target.value)}
          />
        </Field>
        <Field label="Teléfono">
          <input
            className={inputCls}
            value={value.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
        </Field>
        <Field label="Dirección" className="dk:col-span-2">
          <input
            className={inputCls}
            value={value.address}
            onChange={(e) => set("address", e.target.value)}
          />
        </Field>
        <Field label="Formas de pago" className="dk:col-span-2">
          <input
            className={inputCls}
            value={value.paymentMethods}
            onChange={(e) => set("paymentMethods", e.target.value)}
            placeholder="SINPE Móvil, tarjeta, efectivo…"
          />
        </Field>
        <Field
          label="Políticas de citas y cancelación"
          hint="Cómo se agenda, con cuánta anticipación se cancela, qué pasa con emergencias, etc."
          className="dk:col-span-2"
        >
          <textarea
            className={textareaCls}
            value={value.bookingPolicy}
            onChange={(e) => set("bookingPolicy", e.target.value)}
          />
        </Field>
        <Field
          label="Otros datos útiles"
          hint="Parqueo, puntos de referencia, o cualquier dato extra que Lucía deba saber."
          className="dk:col-span-2"
        >
          <textarea
            className={textareaCls}
            value={value.extraNotes}
            onChange={(e) => set("extraNotes", e.target.value)}
          />
        </Field>
      </div>
    </SectionCard>
  );
}
