"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  STATE_LABELS,
  type ControlState,
  type ConversationDetail,
  type ConversationSummary,
} from "@/lib/chats";
import { ConversationList } from "./ConversationList";
import { ConversationView } from "./ConversationView";

/** Cada cuánto se refresca la bandeja y el chat abierto (ms). */
const LIST_POLL_MS = 10_000;
const DETAIL_POLL_MS = 6_000;

type ChannelFilter = "all" | "whatsapp" | "web";
type StateFilter = "all" | ControlState;

const CHANNEL_OPTIONS: Array<{ value: ChannelFilter; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "web", label: "Sitio web" },
];

const STATE_OPTIONS: Array<{ value: StateFilter; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "urgent", label: STATE_LABELS.urgent },
  { value: "manual", label: STATE_LABELS.manual },
  { value: "ai", label: STATE_LABELS.ai },
];

/* Fetchers puros: devuelven datos o lanzan. Sin estado de React adentro, para
 * que los efectos solo hagan setState dentro de callbacks asíncronos. */

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error ?? `El servidor respondió ${res.status}`);
  return body;
}

async function fetchConversations(query: string): Promise<ConversationSummary[]> {
  const body = await fetchJson(`/api/lucia/chats?${query}`);
  return body.conversations;
}

async function fetchConversation(id: string): Promise<ConversationDetail> {
  const body = await fetchJson(`/api/lucia/chats/${id}`);
  return body.conversation;
}

export function ChatsExplorer() {
  // ?chat=<id> abre una conversación directo: es el enlace "Ver conversación"
  // de /lucia/leads. Solo se lee al montar; después manda el estado local.
  const searchParams = useSearchParams();

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    searchParams.get("chat")
  );
  const [detail, setDetail] = useState<ConversationDetail | null>(null);

  const [channel, setChannel] = useState<ChannelFilter>("all");
  const [state, setState] = useState<StateFilter>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  /** Se incrementa tras responder o cambiar el control, para releer del server. */
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const query = new URLSearchParams({
    ...(channel !== "all" && { channel }),
    ...(state !== "all" && { state }),
    ...(debouncedSearch && { q: debouncedSearch }),
  }).toString();

  // Bandeja: carga inicial + sondeo. Se reinicia al cambiar filtros o refreshKey.
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await fetchConversations(query);
        if (cancelled) return;
        setConversations(data);
        setListError(null);
      } catch (err) {
        if (!cancelled) {
          setListError(err instanceof Error ? err.message : "No se pudo cargar la bandeja");
        }
      } finally {
        if (!cancelled) setLoaded(true);
      }
    };

    void load();
    const timer = setInterval(load, LIST_POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [query, refreshKey]);

  // Chat abierto: carga + sondeo. Un fallo puntual no rompe la vista.
  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;

    const load = async () => {
      try {
        const data = await fetchConversation(selectedId);
        if (!cancelled) setDetail(data);
      } catch {
        // Se reintenta en el siguiente sondeo.
      }
    };

    void load();
    const timer = setInterval(load, DETAIL_POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [selectedId, refreshKey]);

  const select = (id: string) => {
    setActionError(null);
    setSelectedId(id);
    setDetail(null);
  };

  const reply = async (text: string): Promise<boolean> => {
    if (!selectedId) return false;
    setBusy(true);
    setActionError(null);
    try {
      const body = await fetchJson(`/api/lucia/chats/${selectedId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      setDetail(body.conversation);
      setRefreshKey((k) => k + 1);
      return true;
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "No se pudo enviar el mensaje");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const setControl = async (mode: "human" | "ai") => {
    if (!selectedId) return;
    setBusy(true);
    setActionError(null);
    try {
      const body = await fetchJson(`/api/lucia/chats/${selectedId}/control`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      setDetail(body.conversation);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "No se pudo cambiar el control del chat"
      );
    } finally {
      setBusy(false);
    }
  };

  const urgentCount = conversations.filter((c) => c.state === "urgent").length;

  return (
    <div className="flex h-dvh flex-col">
      <header className="shrink-0 border-b border-arena-200 bg-arena-50 px-4 pt-3 pb-2.5 dk:px-6">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div>
            <Link href="/" className="text-[13px] font-semibold text-verde-800 hover:underline">
              ← Volver al sitio
            </Link>
            <h1 className="flex items-center gap-2.5 font-display text-[24px] font-bold tracking-[-0.01em]">
              Chats de Lucía
              {urgentCount > 0 && (
                <span className="rounded-full border border-ambar-bd bg-ambar-bg px-2.5 py-0.5 font-mono text-[11px] tracking-[0.06em] text-ambar-tx">
                  {urgentCount} urgente{urgentCount === 1 ? "" : "s"}
                </span>
              )}
            </h1>
          </div>
          <div className="flex gap-2">
            <Link
              href="/lucia/citas"
              className="rounded-full border-[1.5px] border-menta-200 bg-blanco px-4 py-2 text-[13px] font-semibold text-verde-800 transition-colors hover:bg-verde-50"
            >
              Citas
            </Link>
            <Link
              href="/lucia/leads"
              className="rounded-full border-[1.5px] border-menta-200 bg-blanco px-4 py-2 text-[13px] font-semibold text-verde-800 transition-colors hover:bg-verde-50"
            >
              Leads
            </Link>
            <Link
              href="/lucia/knowledge"
              className="rounded-full border-[1.5px] border-menta-200 bg-blanco px-4 py-2 text-[13px] font-semibold text-verde-800 transition-colors hover:bg-verde-50"
            >
              Conocimiento
            </Link>
          </div>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por teléfono o nombre…"
            className="min-w-[200px] flex-1 rounded-[10px] border border-arena-200 bg-blanco px-3 py-2 text-[14px] placeholder:text-tinta-500/60 focus:border-verde-600 focus:outline-none dk:max-w-[300px]"
          />
          <FilterGroup
            label="Canal"
            options={CHANNEL_OPTIONS}
            value={channel}
            onChange={setChannel}
          />
          <FilterGroup label="Estado" options={STATE_OPTIONS} value={state} onChange={setState} />
        </div>
      </header>

      <div className="grid min-h-0 flex-1 dk:grid-cols-[minmax(300px,380px)_1fr]">
        <div
          className={`min-h-0 overflow-y-auto border-arena-200 dk:block dk:border-r ${
            selectedId ? "hidden" : "block"
          }`}
        >
          {listError && (
            <p className="m-4 rounded-[12px] border border-error-bd bg-error-bg px-4 py-3 text-[13.5px] text-error-tx">
              {listError}
            </p>
          )}
          {!loaded && !listError ? (
            <p className="px-4 py-10 text-center text-[13.5px] text-tinta-500">
              Cargando conversaciones…
            </p>
          ) : (
            <ConversationList
              conversations={conversations}
              selectedId={selectedId}
              onSelect={select}
            />
          )}
        </div>

        <div className={`min-h-0 ${selectedId ? "block" : "hidden dk:block"}`}>
          {detail ? (
            <ConversationView
              conversation={detail}
              busy={busy}
              error={actionError}
              onReply={reply}
              onSetControl={setControl}
              onBack={() => {
                setSelectedId(null);
                setDetail(null);
              }}
            />
          ) : (
            <p className="grid h-full place-items-center px-6 text-center text-[14px] text-tinta-500">
              {selectedId
                ? "Cargando conversación…"
                : "Seleccione una conversación para verla y responder."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-[10.5px] tracking-[0.08em] text-tinta-500 uppercase">
        {label}
      </span>
      <div className="flex gap-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={value === option.value}
            className={`rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${
              value === option.value
                ? "bg-verde-950 text-crema-100"
                : "border border-arena-200 bg-blanco text-tinta-600 hover:bg-arena-100"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
