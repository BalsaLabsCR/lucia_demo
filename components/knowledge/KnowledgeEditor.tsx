"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Knowledge } from "@/lib/knowledge";
import { AgentSection } from "./AgentSection";
import { FaqSection } from "./FaqSection";
import { GeneralSection } from "./GeneralSection";
import { RulesSection } from "./RulesSection";
import { ScheduleSection } from "./ScheduleSection";
import { ServicesSection } from "./ServicesSection";
import { StaffSection } from "./StaffSection";

const NAV = [
  { href: "#general", label: "General" },
  { href: "#servicios", label: "Servicios" },
  { href: "#faq", label: "FAQ" },
  { href: "#horarios", label: "Horarios" },
  { href: "#personal", label: "Personal" },
  { href: "#reglas", label: "Reglas" },
  // El ancla se queda en #personalidad para no romper enlaces guardados.
  { href: "#personalidad", label: "Objetivo y tono" },
];

type SaveState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved" }
  | { kind: "error"; message: string; issues?: Array<{ path: string; message: string }> };

export function KnowledgeEditor() {
  const [knowledge, setKnowledge] = useState<Knowledge | null>(null);
  const [snapshot, setSnapshot] = useState<string>("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>({ kind: "idle" });

  const dirty = useMemo(
    () => knowledge !== null && JSON.stringify(knowledge) !== snapshot,
    [knowledge, snapshot]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/lucia/knowledge");
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error ?? `El servidor respondió ${res.status}`);
        if (cancelled) return;
        setKnowledge(body.knowledge);
        setSnapshot(JSON.stringify(body.knowledge));
      } catch (err) {
        if (!cancelled)
          setLoadError(err instanceof Error ? err.message : "No se pudo cargar la configuración");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Aviso del navegador si intenta salir con cambios sin guardar.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const save = async () => {
    if (!knowledge) return;
    setSaveState({ kind: "saving" });
    try {
      const res = await fetch("/api/lucia/knowledge", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ knowledge }),
      });
      const body = await res.json();
      if (!res.ok) {
        setSaveState({
          kind: "error",
          message: body?.error ?? `El servidor respondió ${res.status}`,
          issues: body?.issues,
        });
        return;
      }
      setKnowledge(body.knowledge);
      setSnapshot(JSON.stringify(body.knowledge));
      setSaveState({ kind: "saved" });
      setTimeout(() => setSaveState((s) => (s.kind === "saved" ? { kind: "idle" } : s)), 2500);
    } catch {
      setSaveState({ kind: "error", message: "No se pudo contactar el servidor" });
    }
  };

  const discard = () => {
    if (snapshot) setKnowledge(JSON.parse(snapshot));
    setSaveState({ kind: "idle" });
  };

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-50 border-b border-arena-200 bg-arena-50/95 backdrop-blur">
        <div className="mx-auto max-w-[1000px] px-5 pt-4 pb-0 dk:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Link href="/" className="text-[13px] font-semibold text-verde-800 hover:underline">
                ← Volver al sitio
              </Link>
              <h1 className="font-display text-[24px] font-bold tracking-[-0.01em]">
                Conocimiento de Lucía
              </h1>
            </div>
            <div className="flex items-center gap-2.5">
              <Link
                href="/lucia/citas"
                className="rounded-full border-[1.5px] border-menta-200 bg-blanco px-4 py-2 text-[13px] font-semibold text-verde-800 transition-colors hover:bg-verde-50"
              >
                Citas
              </Link>
              <Link
                href="/lucia/chats"
                className="rounded-full border-[1.5px] border-menta-200 bg-blanco px-4 py-2 text-[13px] font-semibold text-verde-800 transition-colors hover:bg-verde-50"
              >
                Chats
              </Link>
              <Link
                href="/lucia/leads"
                className="rounded-full border-[1.5px] border-menta-200 bg-blanco px-4 py-2 text-[13px] font-semibold text-verde-800 transition-colors hover:bg-verde-50"
              >
                Leads
              </Link>
              <SaveButton dirty={dirty} saveState={saveState} onSave={save} />
            </div>
          </div>
          <nav className="-mx-5 mt-2 flex gap-1.5 overflow-x-auto px-5 pb-3 dk:mx-0 dk:px-0">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-full px-3 py-1.5 text-[13px] font-semibold whitespace-nowrap text-tinta-600 transition-colors hover:bg-verde-50 hover:text-verde-800"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[1000px] px-5 py-8 dk:px-8">
        <p className="mb-6 rounded-[12px] border border-verde-100 bg-verde-50 px-4 py-3 text-[13.5px] text-verde-950">
          Lucía responde <strong>únicamente</strong> con la información de esta página. Lo que no
          esté aquí, no lo sabe: dirá con honestidad que alguien del equipo debe confirmarlo.
        </p>

        {loadError && (
          <p className="rounded-[12px] border border-error-bd bg-error-bg px-4 py-3 text-[13.5px] text-error-tx">
            No se pudo cargar la configuración: {loadError}
          </p>
        )}

        {!knowledge && !loadError && (
          <p className="py-16 text-center text-[14px] text-tinta-500">Cargando configuración…</p>
        )}

        {knowledge && (
          <div className="flex flex-col gap-6">
            <GeneralSection
              value={knowledge.general}
              onChange={(general) => setKnowledge({ ...knowledge, general })}
            />
            <ServicesSection
              value={knowledge.services}
              onChange={(services) => setKnowledge({ ...knowledge, services })}
            />
            <FaqSection
              value={knowledge.faqs}
              onChange={(faqs) => setKnowledge({ ...knowledge, faqs })}
            />
            <ScheduleSection
              value={knowledge.schedule}
              onChange={(schedule) => setKnowledge({ ...knowledge, schedule })}
            />
            <StaffSection
              value={knowledge.staff}
              onChange={(staff) => setKnowledge({ ...knowledge, staff })}
            />
            <RulesSection
              value={knowledge.rules}
              onChange={(rules) => setKnowledge({ ...knowledge, rules })}
            />
            <AgentSection
              value={knowledge.agent}
              onChange={(agent) => setKnowledge({ ...knowledge, agent })}
            />
          </div>
        )}
      </main>

      {dirty && (
        <div className="sticky bottom-0 z-50 border-t border-arena-200 bg-blanco/95 backdrop-blur">
          <div className="mx-auto flex max-w-[1000px] flex-wrap items-center justify-between gap-3 px-5 py-3 dk:px-8">
            <div className="min-w-0">
              <p className="text-[13.5px] font-semibold">Hay cambios sin guardar</p>
              {saveState.kind === "error" && <SaveError state={saveState} />}
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={discard}
                className="rounded-full px-4 py-2 text-[13.5px] font-semibold text-tinta-600 transition-colors hover:bg-arena-100"
              >
                Descartar
              </button>
              <SaveButton dirty={dirty} saveState={saveState} onSave={save} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SaveButton({
  dirty,
  saveState,
  onSave,
}: {
  dirty: boolean;
  saveState: SaveState;
  onSave: () => void;
}) {
  const saving = saveState.kind === "saving";
  return (
    <button
      type="button"
      onClick={onSave}
      disabled={!dirty || saving}
      className={`rounded-full px-5 py-2.5 text-[13.5px] font-bold transition-colors ${
        dirty
          ? "bg-verde-600 text-blanco hover:bg-verde-500"
          : "cursor-default bg-arena-100 text-tinta-500"
      }`}
    >
      {saving ? "Guardando…" : saveState.kind === "saved" && !dirty ? "✓ Guardado" : "Guardar cambios"}
    </button>
  );
}

function SaveError({ state }: { state: Extract<SaveState, { kind: "error" }> }) {
  return (
    <p className="truncate text-[12.5px] text-error-tx">
      {state.message}
      {state.issues && state.issues.length > 0 && (
        <> — {state.issues.map((i) => `${i.path}: ${i.message}`).join("; ")}</>
      )}
    </p>
  );
}
