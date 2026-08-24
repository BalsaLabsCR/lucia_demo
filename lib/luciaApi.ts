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

const ATTRIBUTION_KEY = "lucia-demo-attribution";

/**
 * De dónde llegó el visitante, leído de la URL.
 *
 * `/chat?source=instagram&campaign=blanqueamiento-sensibilidad&creative=concepto-2`
 *
 * Se guarda en `sessionStorage` junto al id de sesión y por la misma razón: la
 * atribución pertenece a ESTA conversación, y una pestaña nueva es una
 * conversación nueva. Guardarla al llegar —y no leer la URL en cada mensaje—
 * es lo que hace que siga valiendo después de que la persona navegue a otra
 * página del sitio y vuelva al chat.
 *
 * No se pisa: si ya hay una guardada, la de la URL nueva se ignora. Es la misma
 * regla de first-touch que aplica el backend, adelantada acá para no mandar dos
 * atribuciones distintas en la misma conversación.
 */
export function captureAttribution(search: string): void {
  if (sessionStorage.getItem(ATTRIBUTION_KEY)) return;

  const params = new URLSearchParams(search);
  const source = params.get("source");
  if (!source) return;

  // Solo estas cuatro llaves viajan. Lo que el backend no espera lo rechaza
  // entero, así que mandar de más es perder la atribución completa.
  const atribucion: Record<string, string> = { source };
  for (const [desde, hacia] of [
    ["campaign", "campaignId"],
    ["creative", "creativeId"],
    ["medium", "medium"],
  ] as const) {
    const valor = params.get(desde);
    if (valor) atribucion[hacia] = valor;
  }

  sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(atribucion));
}

/** La atribución guardada, o `null`. La valida el backend, no esto. */
export function getAttribution(): Record<string, string> | null {
  const raw = sessionStorage.getItem(ATTRIBUTION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    // Un valor corrupto en sessionStorage no puede dejar sin chat a nadie.
    return null;
  }
}

/**
 * Empieza una conversación nueva, con id de sesión nuevo.
 *
 * Existe por el Acto 5 de la demostración: después de aprobar una directiva hay
 * que mostrar que Lucía la aplica, y hacerlo en el MISMO chat no lo demuestra —
 * esa conversación ya trae su historial, y quien mira no puede distinguir si
 * respondió distinto por la directiva o por lo que se dijo antes. Con una
 * sesión nueva la única diferencia es la directiva.
 *
 * La atribución NO se borra: la persona sigue habiendo llegado por donde llegó,
 * y esto es una conversación nueva, no una visita nueva.
 */
export function startNewConversation(): string {
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
    // La atribución viaja en cada mensaje y no solo en el primero: el backend
    // aplica first-touch, así que repetirla es inofensivo y evita depender de
    // que el primer envío haya sido el que la llevaba.
    body: JSON.stringify({
      sessionId: getSessionId(),
      message,
      ...(getAttribution() ? { attribution: getAttribution() } : {}),
    }),
    signal,
  });

  if (!res.ok) {
    const detail = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(detail?.error ?? `El servidor respondió ${res.status}`);
  }

  return (await res.json()) as ChatResponse;
}
