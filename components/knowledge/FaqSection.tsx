"use client";

import { newId, type KnowledgeFaq } from "@/lib/knowledge";
import { AddButton, Field, RemoveButton, SectionCard, inputCls, textareaCls } from "./fields";

interface Props {
  value: KnowledgeFaq[];
  onChange: (faqs: KnowledgeFaq[]) => void;
}

export function FaqSection({ value, onChange }: Props) {
  const update = (id: string, patch: Partial<KnowledgeFaq>) =>
    onChange(value.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  return (
    <SectionCard
      id="faq"
      title="Preguntas frecuentes"
      description="Las preguntas que más le hacen sus clientes, con la respuesta oficial que Lucía debe dar."
    >
      <div className="flex flex-col gap-3">
        {value.map((faq, index) => (
          <div key={faq.id} className="rounded-[12px] border border-arena-200 bg-arena-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <span className="font-display text-[15px] font-bold text-verde-800">
                {index + 1}.
              </span>
              <RemoveButton
                onClick={() => onChange(value.filter((f) => f.id !== faq.id))}
                label={`Eliminar la pregunta ${index + 1}`}
              />
            </div>
            <div className="mt-2 grid gap-3">
              <Field label="Pregunta">
                <input
                  className={inputCls}
                  value={faq.question}
                  onChange={(e) => update(faq.id, { question: e.target.value })}
                  placeholder="¿Atienden sin cita?"
                />
              </Field>
              <Field label="Respuesta">
                <textarea
                  className={textareaCls}
                  value={faq.answer}
                  onChange={(e) => update(faq.id, { answer: e.target.value })}
                />
              </Field>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <AddButton
          onClick={() => onChange([...value, { id: newId("faq"), question: "", answer: "" }])}
        >
          Agregar pregunta
        </AddButton>
      </div>
    </SectionCard>
  );
}
