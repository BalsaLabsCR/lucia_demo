"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "./types";

const SUGGESTIONS = [
  "¿Cuánto vale una limpieza?",
  "¿Qué horarios tienen?",
  "Quiero agendar una cita",
];

interface Props {
  messages: ChatMessage[];
  input: string;
  typing: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (text: string) => void;
  onRetry: () => void;
  onClose: () => void;
  /** Arranca de cero, con sesión nueva. Ver `startNewConversation`. */
  onNewConversation: () => void;
}

/** Pantalla completa en móvil; panel flotante de 390px en desktop. */
export function ChatPanel({
  messages,
  input,
  typing,
  onInputChange,
  onSubmit,
  onRetry,
  onClose,
  onNewConversation,
}: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  useEffect(() => {
    // preventScroll: enfocar el input no debe mover la página de fondo.
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div
      role="dialog"
      aria-label="Chat con Lucía, asistente virtual"
      className="fixed inset-0 z-100 flex h-dvh w-full flex-col overflow-hidden bg-arena-50 dk:inset-auto dk:right-6 dk:bottom-6 dk:h-[min(660px,calc(100dvh-48px))] dk:w-[390px] dk:rounded-[22px] dk:shadow-chat"
    >
      <header className="flex items-center gap-3 bg-verde-950 px-4 py-3.5 text-crema-100">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-linear-[140deg,var(--color-verde-500),var(--color-verde-600)] font-display text-[19px] font-bold text-blanco">
          L
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15.5px] leading-tight font-bold">Lucía · Asistente virtual</p>
          <p className="flex items-center gap-1.5 text-xs text-verde-200">
            <span className="inline-block h-[7px] w-[7px] rounded-full bg-verde-300" />
            Demo en vivo — responde una IA
          </p>
        </div>
        {/*
          Empezar de cero. Está en la cabecera y no escondido en un menú porque
          durante la demostración se usa a la vista de todos: es lo que prueba
          que Lucía cambió de comportamiento por la directiva aprobada y no por
          lo que ya se había dicho en el chat.
        */}
        <button
          type="button"
          onClick={onNewConversation}
          aria-label="Iniciar una conversación nueva"
          title="Iniciar una conversación nueva"
          className="h-11 rounded-xl bg-blanco/12 px-3 text-[12.5px] font-semibold text-crema-100"
        >
          Nueva
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar chat"
          className="h-11 w-11 rounded-xl bg-blanco/12 text-xl leading-none text-crema-100"
        >
          ×
        </button>
      </header>

      <p className="border-b border-ambar-bd bg-ambar-bg px-4 py-2 font-mono text-[11.5px] leading-snug text-ambar-tx">
        Las respuestas las genera una IA. No envíe datos personales reales.
      </p>

      <div ref={listRef} className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-3.5 py-[18px]">
        {messages.map((message) => (
          <Bubble key={message.id} message={message} onRetry={onRetry} />
        ))}

        {typing && (
          <div className="flex justify-start">
            <div className="flex items-center gap-[5px] rounded-[16px_16px_16px_4px] border border-arena-200 bg-blanco px-4 py-3.5">
              {[0, 0.2, 0.4].map((delay) => (
                <span
                  key={delay}
                  className="typing-dot h-[7px] w-[7px] rounded-full bg-verde-600"
                  style={{ animationDelay: `${delay}s` }}
                />
              ))}
              <span className="sr-only">Lucía está escribiendo</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto px-3.5 pt-1 pb-2.5">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onSubmit(suggestion)}
            className="rounded-full border-[1.5px] border-menta-200 bg-blanco px-[15px] py-[11px] text-[13.5px] font-semibold whitespace-nowrap text-verde-800 transition-colors hover:bg-verde-50"
          >
            {suggestion}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(input);
        }}
        className="flex gap-2.5 border-t border-arena-200 bg-blanco px-3.5 pt-2.5 pb-[calc(12px+env(safe-area-inset-bottom))]"
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          maxLength={1000}
          placeholder="Escriba su consulta…"
          aria-label="Escriba su consulta"
          className="h-12 min-w-0 flex-1 rounded-full border-[1.5px] border-arena-200 bg-arena-50 px-[18px] text-[15px] text-tinta-900 outline-none focus:border-verde-600"
        />
        <button
          type="submit"
          disabled={typing || input.trim().length === 0}
          aria-label="Enviar mensaje"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-verde-600 text-lg text-blanco transition-colors hover:bg-verde-800 disabled:bg-arena-200 disabled:text-tinta-500"
        >
          ➤
        </button>
      </form>
    </div>
  );
}

function Bubble({ message, onRetry }: { message: ChatMessage; onRetry: () => void }) {
  if (message.kind === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-[16px_16px_4px_16px] bg-verde-600 px-[15px] py-[11px] text-[14.5px] leading-normal whitespace-pre-wrap text-blanco">
          {message.text}
        </div>
      </div>
    );
  }

  if (message.kind === "ai") {
    return (
      <div className="flex justify-start">
        <div className="max-w-[85%] rounded-[16px_16px_16px_4px] border border-arena-200 bg-blanco px-[15px] py-[11px] text-[14.5px] leading-normal whitespace-pre-wrap text-tinta-900">
          {message.text}
        </div>
      </div>
    );
  }

  if (message.kind === "human") {
    return (
      <div className="flex justify-start">
        <div className="max-w-[85%] rounded-[16px_16px_16px_4px] border border-menta-300 bg-verde-50 px-[15px] py-[11px] text-[14.5px] leading-normal whitespace-pre-wrap text-tinta-900">
          <span className="mb-1 block font-mono text-[10px] tracking-[0.06em] text-verde-800">
            EQUIPO DE LA CLÍNICA
          </span>
          {message.text}
        </div>
      </div>
    );
  }

  if (message.kind === "system") {
    return (
      <div className="flex justify-center">
        <div className="max-w-[92%] rounded-xl border border-dashed border-menta-300 bg-verde-50 px-3.5 py-[9px] text-center text-[12.5px] leading-normal text-verde-800">
          ⇄ {message.text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <div className="max-w-[92%] rounded-xl border border-error-bd bg-error-bg px-3.5 py-2.5 text-center text-[12.5px] leading-normal text-error-tx">
        {message.text}{" "}
        <button
          type="button"
          onClick={onRetry}
          className="px-1 py-1.5 text-[12.5px] font-bold text-error-tx underline"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
