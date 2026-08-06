"use client";

import { useEffect, useRef, useState } from "react";
import {
  CHANNEL_LABELS,
  dayLabel,
  displayName,
  fullDateTime,
  timeOnly,
  type ConversationDetail,
} from "@/lib/chats";

interface Props {
  conversation: ConversationDetail;
  busy: boolean;
  error: string | null;
  onReply: (text: string) => Promise<boolean>;
  onSetControl: (mode: "human" | "ai") => void;
  onBack: () => void;
}

/** Conversación completa + respuesta manual + traspaso de control. */
export function ConversationView({
  conversation,
  busy,
  error,
  onReply,
  onSetControl,
  onBack,
}: Props) {
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const lastMessageId = conversation.messages.at(-1)?.id;

  // Baja al último mensaje al abrir el chat y cuando entra uno nuevo.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [conversation.id, lastMessageId]);

  const send = async () => {
    const text = draft.trim();
    if (!text || busy) return;
    const ok = await onReply(text);
    if (ok) setDraft("");
  };

  const aiActive = conversation.state === "ai";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-arena-200 bg-blanco px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="text-[13px] font-semibold text-verde-800 dk:hidden"
        >
          ← Chats
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[15.5px] font-bold">{displayName(conversation)}</p>
          <p className="truncate text-[12px] text-tinta-500">
            {CHANNEL_LABELS[conversation.channel] ?? conversation.channel}
            {conversation.phone && ` · ${conversation.phone}`}
            {` · ${conversation.messageCount} mensajes · desde ${fullDateTime(conversation.createdAt)}`}
          </p>
        </div>

        <ControlToggle state={conversation.state} busy={busy} onSetControl={onSetControl} />
      </header>

      {conversation.state === "urgent" && (
        <p className="border-b border-ambar-bd bg-ambar-bg px-4 py-2 text-[13px] text-ambar-tx">
          {conversation.handoffReason === "unverified_reply" ? (
            <>
              Lucía no logró responder con datos respaldados por la información de la
              clínica, así que prefirió no contestar
            </>
          ) : (
            <>Lucía pasó este chat a una persona</>
          )}
          {conversation.handoffAt && ` (${fullDateTime(conversation.handoffAt)})`} y seguirá
          en <strong>Urgente</strong> hasta que usted devuelva el control a Lucía.
        </p>
      )}

      {conversation.state === "manual" && (
        <p className="border-b border-arena-200 bg-arena-100 px-4 py-2 text-[13px] text-tinta-600">
          Usted tiene el control: Lucía no responde en este chat.
        </p>
      )}

      <div ref={listRef} className="flex-1 overflow-y-auto bg-arena-50 px-4 py-4">
        <div className="mx-auto flex max-w-[720px] flex-col gap-2.5">
          {conversation.messages.map((message, index) => {
            const previous = conversation.messages[index - 1];
            const showDay =
              !previous ||
              new Date(previous.createdAt).toDateString() !==
                new Date(message.createdAt).toDateString();

            return (
              <div key={message.id} className="contents">
                {showDay && (
                  <p className="mx-auto my-2 rounded-full bg-arena-200 px-3 py-1 font-mono text-[10.5px] tracking-[0.06em] text-tinta-600">
                    {dayLabel(message.createdAt)}
                  </p>
                )}
                <Bubble message={message} />
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <p className="border-t border-error-bd bg-error-bg px-4 py-2 text-[13px] text-error-tx">
          {error}
        </p>
      )}

      <div className="border-t border-arena-200 bg-blanco px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
        {aiActive && (
          <p className="mb-2 text-[12.5px] text-tinta-500">
            Lucía está atendiendo este chat. Si escribe, usted toma el control
            automáticamente y Lucía deja de responder.
          </p>
        )}
        <div className="flex items-end gap-2.5">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            rows={2}
            placeholder="Escriba su respuesta… (Enter para enviar)"
            className="min-h-[46px] flex-1 resize-y rounded-[12px] border border-arena-200 bg-blanco px-3 py-2.5 text-[14.5px] text-tinta-900 placeholder:text-tinta-500/60 focus:border-verde-600 focus:outline-none"
          />
          <button
            type="button"
            onClick={send}
            disabled={busy || draft.trim() === ""}
            className={`min-h-[46px] shrink-0 rounded-full px-5 text-[14px] font-bold transition-colors ${
              busy || draft.trim() === ""
                ? "cursor-default bg-arena-100 text-tinta-500"
                : "bg-verde-600 text-blanco hover:bg-verde-500"
            }`}
          >
            {busy ? "Enviando…" : "Enviar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ControlToggle({
  state,
  busy,
  onSetControl,
}: {
  state: ConversationDetail["state"];
  busy: boolean;
  onSetControl: (mode: "human" | "ai") => void;
}) {
  const aiActive = state === "ai";

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => onSetControl(aiActive ? "human" : "ai")}
      className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-bold transition-colors disabled:opacity-60 ${
        aiActive
          ? "border-[1.5px] border-arena-400 text-tinta-900 hover:border-verde-600 hover:text-verde-800"
          : "bg-verde-600 text-blanco hover:bg-verde-500"
      }`}
    >
      {aiActive ? "Tomar el control" : "Devolver control a Lucía"}
    </button>
  );
}

function Bubble({ message }: { message: ConversationDetail["messages"][number] }) {
  // El cliente va a la izquierda; Lucía y el equipo a la derecha (lado negocio).
  const isClient = message.role === "user";
  const isOwner = message.role === "owner";
  // "other" es la categoría por defecto del clasificador: no aporta nada al
  // operador, así que solo se muestran las que sí dicen algo (lead, cita…).
  const tag =
    message.classification && message.classification !== "other"
      ? message.classification
      : null;

  return (
    <div className={`flex ${isClient ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[min(80%,540px)] rounded-[16px] px-3.5 py-2.5 text-[14.5px] leading-relaxed ${
          isClient
            ? "rounded-bl-[4px] border border-arena-200 bg-blanco"
            : isOwner
              ? "rounded-br-[4px] bg-verde-950 text-crema-100"
              : "rounded-br-[4px] bg-verde-600 text-blanco"
        }`}
      >
        <p className="whitespace-pre-wrap">{message.text}</p>
        <p
          className={`mt-1 font-mono text-[10px] ${
            isClient ? "text-tinta-500" : "text-blanco/70"
          }`}
        >
          {isClient ? "Cliente" : isOwner ? "Equipo" : "Lucía"} · {timeOnly(message.createdAt)}
          {tag && ` · ${tag}`}
        </p>
      </div>
    </div>
  );
}
