"use client";

import { useState } from "react";
import type { KnowledgeRules, RuleChoice } from "@/lib/knowledge";
import { Checkbox, Field, SectionCard, inputCls, textareaCls } from "./fields";

interface Props {
  value: KnowledgeRules;
  onChange: (rules: KnowledgeRules) => void;
}

/** Opciones predefinidas por escenario (los textos completos los aplica el backend). */
const SCENARIOS: Array<{
  key: "angryUser" | "obsceneLanguage" | "offTopic" | "uncomfortableQuestions";
  title: string;
  options: Array<{ value: string; label: string }>;
}> = [
  {
    key: "angryUser",
    title: "Si el cliente está molesto y no se calma después de varios mensajes",
    options: [
      { value: "escalate", label: "Ofrecer disculpas y pasar el chat a una persona del equipo" },
      { value: "calm_persist", label: "Mantener la calma y seguir intentando resolver, sin escalar" },
      { value: "offer_call", label: "Ofrecer que una persona del equipo le llame por teléfono" },
    ],
  },
  {
    key: "obsceneLanguage",
    title: "Si el cliente usa lenguaje obsceno o hace referencias indebidas",
    options: [
      { value: "redirect", label: "Ignorar el lenguaje y redirigir la conversación con cortesía" },
      { value: "warn_then_end", label: "Pedir respeto; si insiste, despedirse y terminar la conversación" },
      { value: "escalate", label: "Pasar el chat a una persona del equipo" },
    ],
  },
  {
    key: "offTopic",
    title: "Si el cliente insiste con temas no relacionados a la clínica",
    options: [
      { value: "gentle_redirect", label: "Responder breve y amable, y redirigir a temas de la clínica" },
      { value: "decline", label: "Indicar que solo puede ayudar con temas de la clínica" },
    ],
  },
  {
    key: "uncomfortableQuestions",
    title: "Si hace preguntas incómodas (“¿por qué tan caro?”, “¿por qué el servicio es malo?”)",
    options: [
      { value: "empathize_value", label: "Responder con empatía, sin defensividad, destacando el valor del servicio" },
      { value: "escalate", label: "Agradecer el comentario y pasar el chat a una persona del equipo" },
    ],
  },
];

function ScenarioRule({
  name,
  title,
  options,
  value,
  onChange,
}: {
  name: string;
  title: string;
  options: Array<{ value: string; label: string }>;
  value: RuleChoice<string>;
  onChange: (choice: RuleChoice<string>) => void;
}) {
  return (
    <fieldset className="rounded-[12px] border border-arena-200 bg-arena-50 p-4">
      <legend className="float-left mb-2 w-full text-[14px] font-bold">{title}</legend>
      <div className="flex flex-col gap-1.5 clear-both">
        {options.map((opt) => (
          <label key={opt.value} className="flex cursor-pointer items-start gap-2 text-[13.5px]">
            <input
              type="radio"
              name={name}
              checked={value.option === opt.value}
              onChange={() => onChange({ ...value, option: opt.value })}
              className="mt-1 h-4 w-4 accent-verde-600"
            />
            {opt.label}
          </label>
        ))}
        <label className="flex cursor-pointer items-start gap-2 text-[13.5px]">
          <input
            type="radio"
            name={name}
            checked={value.option === "custom"}
            onChange={() => onChange({ ...value, option: "custom" })}
            className="mt-1 h-4 w-4 accent-verde-600"
          />
          Personalizado
        </label>
        {value.option === "custom" && (
          <textarea
            className={`${textareaCls} mt-1`}
            value={value.custom}
            onChange={(e) => onChange({ ...value, custom: e.target.value })}
            placeholder="Describa qué debe hacer Lucía en este caso…"
          />
        )}
      </div>
    </fieldset>
  );
}

export function RulesSection({ value, onChange }: Props) {
  const [keywordDraft, setKeywordDraft] = useState("");
  const e = value.escalation;
  const setEscalation = (patch: Partial<KnowledgeRules["escalation"]>) =>
    onChange({ ...value, escalation: { ...e, ...patch } });

  const addKeyword = () => {
    const kw = keywordDraft.trim();
    if (!kw || e.keywords.includes(kw)) return;
    setEscalation({ keywords: [...e.keywords, kw] });
    setKeywordDraft("");
  };

  return (
    <SectionCard
      id="reglas"
      title="Reglas para situaciones especiales"
      description="Qué debe hacer Lucía en casos difíciles y cuándo debe pasar el chat a una persona."
    >
      <div className="flex flex-col gap-4">
        {SCENARIOS.map((scenario) => (
          <ScenarioRule
            key={scenario.key}
            name={`rule-${scenario.key}`}
            title={scenario.title}
            options={scenario.options}
            value={value[scenario.key]}
            onChange={(choice) =>
              onChange({
                ...value,
                [scenario.key]: choice,
              })
            }
          />
        ))}

        <fieldset className="rounded-[12px] border border-arena-200 bg-arena-50 p-4">
          <legend className="float-left mb-2 w-full text-[14px] font-bold">
            ¿Cuándo pasar el chat a una persona del equipo?
          </legend>
          <div className="flex flex-col gap-2 clear-both">
            <Checkbox
              checked={e.onExplicitRequest}
              onChange={(v) => setEscalation({ onExplicitRequest: v })}
            >
              Cuando lo pide explícitamente (hablar con un humano, con el doctor, etc.)
            </Checkbox>
            <Checkbox checked={e.onComplaint} onChange={(v) => setEscalation({ onComplaint: v })}>
              Cuando presenta una queja o reclamo
            </Checkbox>
            <Checkbox checked={e.onEmergency} onChange={(v) => setEscalation({ onEmergency: v })}>
              Cuando describe una emergencia o dolor severo
            </Checkbox>
            <Checkbox checked={e.onBilling} onChange={(v) => setEscalation({ onBilling: v })}>
              Cuando reclama un cobro ya hecho o pide un reembolso
            </Checkbox>

            <Field
              label="Palabras clave que activan el traspaso"
              hint="Presione Enter para agregar. Si el cliente usa alguna, Lucía pasa el chat de inmediato."
              className="mt-2"
            >
              <div className="flex flex-wrap items-center gap-2">
                {e.keywords.map((kw) => (
                  <span
                    key={kw}
                    className="flex items-center gap-1.5 rounded-full border-[1.5px] border-menta-200 bg-blanco px-3 py-1 text-[13px] font-semibold text-verde-800"
                  >
                    {kw}
                    <button
                      type="button"
                      aria-label={`Quitar la palabra clave ${kw}`}
                      onClick={() =>
                        setEscalation({ keywords: e.keywords.filter((x) => x !== kw) })
                      }
                      className="text-tinta-500 hover:text-error-tx"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  className={`${inputCls} w-auto min-w-[160px] flex-1`}
                  value={keywordDraft}
                  onChange={(ev) => setKeywordDraft(ev.target.value)}
                  onKeyDown={(ev) => {
                    if (ev.key === "Enter") {
                      ev.preventDefault();
                      addKeyword();
                    }
                  }}
                  onBlur={addKeyword}
                  placeholder="urgente, abogado, demanda…"
                />
              </div>
            </Field>

            <Field label="Otras situaciones en las que debe escalar" className="mt-1">
              <textarea
                className={textareaCls}
                value={e.custom}
                onChange={(ev) => setEscalation({ custom: ev.target.value })}
                placeholder="Una situación por línea (opcional)…"
              />
            </Field>
          </div>
        </fieldset>
      </div>
    </SectionCard>
  );
}
