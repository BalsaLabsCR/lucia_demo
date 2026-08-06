/** Estados que devuelve el pipeline de Lucía para un turno del chat web. */
export type ChatStatus = "replied" | "handoff" | "silent" | "duplicate";

export interface ChatResponse {
  status: ChatStatus;
  replies: string[];
  /**
   * Ids de esas respuestas, ya guardadas en el backend, en el mismo orden.
   * Es la misma llave que trae el sondeo: marcándolas como vistas, lo que este
   * turno muestra no se puede volver a pintar cuando el sondeo las traiga.
   * Opcional solo por compatibilidad: sin él se cae al respaldo de `serverTime`.
   */
  messageIds?: string[];
  /**
   * Hora del servidor al cerrar el turno. Respaldo para backends que todavía
   * no mandan `messageIds`; ahí es lo único que evita repetir las respuestas.
   */
  serverTime?: string;
}

const API_URL = (
  process.env.NEXT_PUBLIC_LUCIA_API_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

const SESSION_KEY = "lucia-demo-session-id";

/**
 * Id de sesión del navegador: identifica la conversación en el backend
 * (equivale al número de teléfono en el canal de WhatsApp). Vive en
 * sessionStorage, así que al cerrar la pestaña empieza un chat nuevo.
 */
export function getSessionId(): string {
  const existing = sessionStorage.getItem(SESSION_KEY);
  if (existing) return existing;

  const id = crypto.randomUUID();
  sessionStorage.setItem(SESSION_KEY, id);
  return id;
}

export interface PendingMessage {
  id: string;
  /** assistant = Lucía · owner = una persona del equipo. */
  role: "assistant" | "owner" | string;
  text: string;
  createdAt: string;
}

export interface PendingMessages {
  /** ai | urgent | manual: quién está atendiendo la conversación. */
  state: string;
  messages: PendingMessage[];
}

/**
 * Mensajes posteriores a `after`. El turno del chat es síncrono, así que sin
 * este sondeo el visitante nunca vería lo que le escribe una persona del equipo
 * desde el panel /lucia/chats.
 */
export async function fetchMessagesSince(
  after: string,
  signal?: AbortSignal
): Promise<PendingMessages> {
  const url = `${API_URL}/chat/${encodeURIComponent(getSessionId())}/messages?after=${encodeURIComponent(after)}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`El servidor respondió ${res.status}`);
  return (await res.json()) as PendingMessages;
}

export async function sendMessage(
  message: string,
  signal?: AbortSignal
): Promise<ChatResponse> {
  const res = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId: getSessionId(), message }),
    signal,
  });

  if (!res.ok) {
    const detail = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(detail?.error ?? `El servidor respondió ${res.status}`);
  }

  return (await res.json()) as ChatResponse;
}
