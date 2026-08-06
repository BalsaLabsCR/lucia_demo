"use client";

import {
  CHANNEL_LABELS,
  displayName,
  relativeTime,
  type ConversationSummary,
} from "@/lib/chats";

interface Props {
  conversations: ConversationSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const ROLE_PREFIX: Record<string, string> = {
  user: "",
  assistant: "Lucía: ",
  owner: "Usted: ",
};

/** Chats agrupados: primero los que Lucía escaló, luego el resto por fecha. */
export function ConversationList({ conversations, selectedId, onSelect }: Props) {
  const urgent = conversations.filter((c) => c.state === "urgent");
  const rest = conversations.filter((c) => c.state !== "urgent");

  if (conversations.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-[13.5px] text-tinta-500">
        No hay conversaciones que coincidan con estos filtros.
      </p>
    );
  }

  return (
    <div className="flex flex-col">
      {urgent.length > 0 && (
        <section>
          <h2 className="sticky top-0 z-10 flex items-center gap-2 border-y border-ambar-bd bg-ambar-bg px-4 py-2 font-mono text-[11px] tracking-[0.08em] text-ambar-tx">
            <span className="inline-block h-[7px] w-[7px] rounded-full bg-ambar-tx" />
            URGENTE · {urgent.length}{" "}
            {urgent.length === 1 ? "chat necesita" : "chats necesitan"} atención
          </h2>
          {urgent.map((c) => (
            <ConversationRow
              key={c.id}
              conversation={c}
              selected={c.id === selectedId}
              onSelect={onSelect}
            />
          ))}
        </section>
      )}

      {rest.length > 0 && (
        <section>
          {urgent.length > 0 && (
            <h2 className="sticky top-0 z-10 border-y border-arena-200 bg-arena-100 px-4 py-2 font-mono text-[11px] tracking-[0.08em] text-tinta-500">
              TODOS LOS CHATS
            </h2>
          )}
          {rest.map((c) => (
            <ConversationRow
              key={c.id}
              conversation={c}
              selected={c.id === selectedId}
              onSelect={onSelect}
            />
          ))}
        </section>
      )}
    </div>
  );
}

function ConversationRow({
  conversation,
  selected,
  onSelect,
}: {
  conversation: ConversationSummary;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const preview = conversation.preview;

  return (
    <button
      type="button"
      onClick={() => onSelect(conversation.id)}
      aria-current={selected}
      className={`flex w-full flex-col gap-1 border-b border-arena-200 px-4 py-3 text-left transition-colors ${
        selected ? "bg-verde-50" : "bg-blanco hover:bg-arena-50"
      }`}
    >
      <div className="flex items-baseline gap-2">
        <span className="min-w-0 flex-1 truncate text-[14.5px] font-semibold">
          {displayName(conversation)}
        </span>
        <span className="shrink-0 text-[11.5px] text-tinta-500">
          {relativeTime(conversation.lastMessageAt)}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span
          className={`shrink-0 rounded-full px-1.5 py-px font-mono text-[10px] tracking-[0.06em] ${
            conversation.channel === "whatsapp"
              ? "bg-verde-100 text-verde-800"
              : "bg-arena-100 text-tinta-600"
          }`}
        >
          {CHANNEL_LABELS[conversation.channel] ?? conversation.channel}
        </span>
        {conversation.state === "manual" && (
          <span className="shrink-0 rounded-full bg-arena-200 px-1.5 py-px font-mono text-[10px] tracking-[0.06em] text-tinta-600">
            CONTROL MANUAL
          </span>
        )}
        {preview && (
          <span className="min-w-0 flex-1 truncate text-[13px] text-tinta-500">
            {ROLE_PREFIX[preview.role] ?? ""}
            {preview.text}
          </span>
        )}
      </div>
    </button>
  );
}
