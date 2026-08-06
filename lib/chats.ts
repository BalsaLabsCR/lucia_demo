/**
 * Tipos de la bandeja de conversaciones que muestra /lucia/chats.
 * Espejo de lucia-backend/src/admin/conversations.ts.
 */

/** Quién tiene el control de la conversación. */
export type ControlState =
  /** Lucía responde normalmente. */
  | "ai"
  /** Lucía escaló: necesita atención humana (sección "Urgente"). */
  | "urgent"
  /** Una persona tomó el control a propósito. */
  | "manual";

export type Channel = "whatsapp" | "web";

/** user = cliente · assistant = Lucía · owner = persona del equipo. */
export type MessageRole = "user" | "assistant" | "owner";

export interface ChatMessage {
  id: string;
  role: MessageRole | string;
  text: string;
  classification?: string | null;
  createdAt: string;
}

export interface ConversationSummary {
  id: string;
  channel: string;
  /** Teléfono en WhatsApp, id de sesión del navegador en web. */
  externalId: string;
  phone: string | null;
  name: string | null;
  state: ControlState;
  /** ai_escalation | unverified_reply | manual. */
  handoffReason: string | null;
  handoffAt: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  messageCount: number;
  preview: { role: string; text: string; createdAt: string } | null;
}

export interface ConversationDetail extends ConversationSummary {
  snoozedUntil: string | null;
  messages: ChatMessage[];
}

/** Etiqueta legible de la contraparte del chat. */
export function displayName(c: ConversationSummary): string {
  if (c.name) return c.name;
  if (c.phone) return c.phone;
  return c.channel === "web" ? `Visitante web · ${c.externalId.slice(0, 8)}` : c.externalId;
}

export const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  web: "Sitio web",
};

export const STATE_LABELS: Record<ControlState, string> = {
  ai: "Lucía atiende",
  urgent: "Requiere atención",
  manual: "Control manual",
};

/** Fecha relativa corta para la lista ("hace 5 min", "ayer"). */
export function relativeTime(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diff / 60_000);

  if (minutes < 1) return "ahora";
  if (minutes < 60) return `hace ${minutes} min`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;

  const days = Math.round(hours / 24);
  if (days === 1) return "ayer";
  if (days < 7) return `hace ${days} días`;

  return new Date(iso).toLocaleDateString("es-CR", { day: "numeric", month: "short" });
}

/** Fecha y hora completas, para el detalle de la conversación. */
export function fullDateTime(iso: string): string {
  return new Date(iso).toLocaleString("es-CR", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function timeOnly(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-CR", {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Etiqueta del separador de día dentro de la conversación. */
export function dayLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

  if (isSameDay(date, today)) return "Hoy";

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (isSameDay(date, yesterday)) return "Ayer";

  return date.toLocaleDateString("es-CR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
