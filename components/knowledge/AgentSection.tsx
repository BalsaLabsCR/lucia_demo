"use client";

import type { ConversionGoal, Knowledge } from "@/lib/knowledge";
import { Field, SectionCard, inputCls, textareaCls } from "./fields";

interface Props {
  value: Knowledge["agent"];
  onChange: (agent: Knowledge["agent"]) => void;
}

const GOAL_OPTIONS: Array<{
  value: ConversionGoal;
  title: string;
  detail: string;
}> = [
  {
    value: "appointment",
    title: "Dejar la cita agendada",
    detail:
      "Para negocios que manejan agenda: clínicas, salones, talleres. Lucía informa y empuja a agendar, y deja la cita hecha en el sistema. A quien pregunta y no agenda lo anota como interesado, para que ustedes le den seguimiento.",
  },
  {
    value: "lead",
    title: "Capturar el interés y el contacto",
    detail:
      "Para negocios sin agenda que Lucía pueda reservar: bufetes, constructoras, inmobiliarias. Lucía no ofrece agendar nada; recoge qué necesita la persona y cómo contactarla, y avisa que el equipo le va a escribir.",
  },
];

const TONE_DESCRIPTIONS: Record<number, string> = {
  1: "Muy profesional: lenguaje sobrio y formal, sin emojis, directo al punto.",
  2: "Profesional: cortés y claro, sin exceso de confianza.",
  3: "Equilibrado: profesional pero cálido; un emoji ocasional.",
  4: "Amigable: cercano y conversacional, con expresiones ticas.",
  5: "Muy amigable: súper cercano y cálido, como una persona de confianza.",
};

export function AgentSection({ value, onChange }: Props) {
  return (
    <SectionCard
      id="personalidad"
      title="Objetivo y personalidad"
      description="Qué busca Lucía en cada conversación y cómo suena mientras lo hace. Siempre trata de usted y nunca dice ser una IA."
    >
      <div className="grid gap-5 dk:grid-cols-2">
        <Field label="Nombre del asistente">
          <input
            className={inputCls}
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
          />
        </Field>

        <div className="dk:col-span-2">
          <span className="mb-1 block text-[13px] font-semibold text-tinta-600">
            Objetivo de cada conversación
          </span>
          <p className="mb-2 text-[13px] text-tinta-500">
            Es la opción que más cambia el comportamiento de Lucía: define hacia dónde
            empuja cada respuesta y qué herramientas tiene disponibles.
          </p>
          <div className="grid gap-2.5 dk:grid-cols-2">
            {GOAL_OPTIONS.map((option) => {
              const selected = value.conversionGoal === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onChange({ ...value, conversionGoal: option.value })}
                  aria-pressed={selected}
                  className={`rounded-[12px] border p-4 text-left transition-colors ${
                    selected
                      ? "border-verde-600 bg-verde-50"
                      : "border-arena-200 bg-blanco hover:bg-arena-50"
                  }`}
                >
                  <span
                    className={`block text-[14px] font-semibold ${
                      selected ? "text-verde-800" : "text-tinta-900"
                    }`}
                  >
                    {selected ? "✓ " : ""}
                    {option.title}
                  </span>
                  <span className="mt-1 block text-[13px] leading-[1.5] text-tinta-600">
                    {option.detail}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="dk:col-span-2">
          <span className="mb-1 block text-[13px] font-semibold text-tinta-600">
            Tono de la conversación
          </span>
          <div className="rounded-[12px] border border-arena-200 bg-arena-50 p-4">
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={value.tone}
              onChange={(e) => onChange({ ...value, tone: Number(e.target.value) })}
              className="w-full accent-verde-600"
              aria-label="Tono: 1 más profesional, 5 más amigable"
            />
            <div className="mt-1 flex justify-between text-xs text-tinta-500">
              <span>1 · Más profesional</span>
              <span>5 · Más amigable</span>
            </div>
            <p className="mt-3 text-[13.5px] font-semibold text-verde-800">
              {value.tone}: {TONE_DESCRIPTIONS[value.tone] ?? ""}
            </p>
          </div>
        </div>

        <Field
          label="Instrucciones adicionales"
          hint="Cualquier otra indicación para Lucía: frases que debe usar, temas que debe evitar, cómo despedirse, etc."
          className="dk:col-span-2"
        >
          <textarea
            className={textareaCls}
            value={value.extraInstructions}
            onChange={(e) => onChange({ ...value, extraInstructions: e.target.value })}
            placeholder="Ej.: siempre ofrezca agendar una valoración al final de la conversación."
          />
        </Field>
      </div>
    </SectionCard>
  );
}
