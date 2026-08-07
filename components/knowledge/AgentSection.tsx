"use client";

import type { Knowledge } from "@/lib/knowledge";
import { Field, SectionCard, inputCls, textareaCls } from "./fields";

interface Props {
  value: Knowledge["agent"];
  onChange: (agent: Knowledge["agent"]) => void;
}

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
      title="Personalidad"
      description="Cómo suena Lucía y qué indicaciones propias sigue. Siempre trata de usted y nunca dice ser una IA. Qué busca en cada conversación lo define la estrategia del deploy, no esta pantalla."
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
