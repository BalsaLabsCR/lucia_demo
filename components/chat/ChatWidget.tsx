"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { OPEN_CHAT_EVENT, type OpenChatDetail } from "@/lib/chatEvents";
import { CLINIC } from "@/lib/clinic";
import { fetchMessagesSince, sendMessage } from "@/lib/luciaApi";
import { ChatPanel } from "./ChatPanel";
import type { ChatMessage } from "./types";

/** Cada cuánto se consultan mensajes nuevos mientras el chat está abierto. */
const POLL_MS = 5_000;

const GREETING: ChatMessage = {
  id: "greeting",
  kind: "ai",
  text: "¡Hola! Soy Lucía, la asistente virtual de Sonrisa Pura. Con gusto le brindo información sobre precios y horarios, o le agendo una cita. ¿En qué le puedo ayudar?",
};

let messageCounter = 0;
const nextId = () => `m${++messageCounter}`;

/**
 * Capa flotante del sitio: barra de CTA móvil, botón del chat y panel.
 * Comparten el estado de "abierto" porque el diseño esconde la barra y el botón
 * mientras el chat está abierto.
 */
export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  /** Último mensaje que falló, para el botón "Reintentar". */
  const failedRef = useRef<string | null>(null);
  /** Marca de tiempo hasta la que ya se mostró todo (hora del servidor). */
  const seenUntilRef = useRef<string>(new Date().toISOString());
  /** Ids ya mostrados: evita repetir si dos sondeos se cruzan. */
  const seenIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const onOpen = (event: Event) => {
      const detail = (event as CustomEvent<OpenChatDetail>).detail;
      setOpen(true);
      if (detail?.prefill) setInput(detail.prefill);
    };
    window.addEventListener(OPEN_CHAT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => () => abortRef.current?.abort(), []);

  /**
   * Sondeo mientras el chat está abierto: trae lo que escribió Lucía o una
   * persona del equipo desde el panel. El turno del chat es síncrono, así que
   * sin esto una respuesta humana nunca llegaría a esta pantalla.
   */
  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    let stopped = false;

    const poll = async () => {
      try {
        const { messages: incoming } = await fetchMessagesSince(
          seenUntilRef.current,
          controller.signal
        );
        if (stopped || incoming.length === 0) return;

        const fresh = incoming.filter((m) => !seenIdsRef.current.has(m.id));
        for (const m of incoming) seenIdsRef.current.add(m.id);
        seenUntilRef.current = incoming[incoming.length - 1].createdAt;

        if (fresh.length > 0) {
          setMessages((prev) => [
            ...prev,
            ...fresh.map((m): ChatMessage => ({
              id: nextId(),
              kind: m.role === "owner" ? "human" : "ai",
              text: m.text,
            })),
          ]);
        }
      } catch {
        // Un sondeo fallido no debe ensuciar el chat: se reintenta al siguiente.
      }
    };

    // Sin condicionar a visibilityState: hay contextos (webviews, navegadores
    // in-app) que reportan "hidden" siempre, y ahí el visitante nunca recibiría
    // la respuesta. Solo corre con el chat abierto, y el navegador ya ralentiza
    // los timers en segundo plano.
    void poll();
    const timer = setInterval(poll, POLL_MS);

    return () => {
      stopped = true;
      controller.abort();
      clearInterval(timer);
    };
  }, [open]);

  const submit = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || typing) return;

      setInput("");
      failedRef.current = null;
      setMessages((prev) => [
        // Un intento nuevo limpia el error anterior.
        ...prev.filter((m) => m.kind !== "error"),
        { id: nextId(), kind: "user", text },
      ]);
      setTyping(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const { status, replies, serverTime } = await sendMessage(text, controller.signal);

        // Las respuestas de este turno ya se muestran acá: el sondeo arranca
        // desde la hora del servidor para no repetirlas.
        if (serverTime) seenUntilRef.current = serverTime;

        const incoming: ChatMessage[] = replies.map((reply) => ({
          id: nextId(),
          kind: "ai",
          text: reply,
        }));

        // El bot puede quedarse callado a propósito: handoff a una persona o
        // control manual. Se explica en pantalla en vez de dejar el chat mudo;
        // la respuesta de la persona llega por el sondeo.
        if (status === "handoff" || status === "silent") {
          incoming.push({
            id: nextId(),
            kind: "system",
            text:
              status === "handoff"
                ? "Lucía pasó esta conversación a una persona del equipo. Le responderán por aquí mismo."
                : "Una persona del equipo está atendiendo este chat. Le responderán por aquí mismo.",
          });
        }

        setMessages((prev) => [...prev, ...incoming]);
      } catch (err) {
        if (controller.signal.aborted) return;
        failedRef.current = text;
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            kind: "error",
            text: `No se pudo conectar con el servidor (${
              err instanceof Error ? err.message : "error desconocido"
            }).`,
          },
        ]);
      } finally {
        setTyping(false);
        abortRef.current = null;
      }
    },
    [typing]
  );

  const retry = useCallback(() => {
    const failed = failedRef.current;
    if (!failed) return;
    // Se quita el mensaje del usuario que falló: submit lo vuelve a agregar.
    setMessages((prev) => {
      const withoutError = prev.filter((m) => m.kind !== "error");
      const lastUser = withoutError.findLastIndex((m) => m.kind === "user");
      return lastUser === -1 ? withoutError : withoutError.toSpliced(lastUser, 1);
    });
    void submit(failed);
  }, [submit]);

  return (
    <>
      {open && (
        <ChatPanel
          messages={messages}
          input={input}
          typing={typing}
          onInputChange={setInput}
          onSubmit={submit}
          onRetry={retry}
          onClose={() => setOpen(false)}
        />
      )}

      {!open && (
        <>
          {/* CTA persistente en móvil; el botón del chat flota por encima. */}
          <div className="fixed inset-x-0 bottom-0 z-60 flex gap-2.5 border-t border-arena-200 bg-blanco/95 px-3 pt-2.5 pb-[calc(10px+env(safe-area-inset-bottom))] backdrop-blur-[10px] dk:hidden">
            <a
              href={CLINIC.phoneHref}
              aria-label={`Llamar al ${CLINIC.phone}`}
              className="grid min-h-12 w-[50px] place-items-center rounded-[14px] border-[1.5px] border-verde-600 text-lg text-verde-800 no-underline"
            >
              ✆
            </a>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="mr-16 min-h-12 flex-1 rounded-[14px] bg-verde-600 text-base font-semibold text-blanco"
            >
              Agendar por el chat
            </button>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Abrir chat con Lucía"
            className="pulse-ring fixed right-3.5 bottom-[calc(84px+env(safe-area-inset-bottom))] z-70 grid h-15 w-15 place-items-center rounded-full bg-linear-[140deg,var(--color-verde-500),var(--color-verde-800)] shadow-fab dk:right-6 dk:bottom-6"
          >
            <span className="relative block h-5 w-[26px] rounded-[10px] bg-blanco" />
            <span className="absolute bottom-[15px] left-5 h-[9px] w-[9px] rotate-45 bg-blanco" />
            <span className="absolute top-1.5 right-1 rounded-full border-2 border-arena-50 bg-verde-300 px-1.5 py-0.5 font-mono text-[8.5px] font-bold text-verde-950">
              AI
            </span>
          </button>
        </>
      )}
    </>
  );
}
