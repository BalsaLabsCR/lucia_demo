/** Evento con el que cualquier parte del sitio le pide al widget que se abra. */
export const OPEN_CHAT_EVENT = "lucia:open-chat";

export interface OpenChatDetail {
  /** Texto opcional para dejar precargado en el input. */
  prefill?: string;
}

export function openLuciaChat(detail: OpenChatDetail = {}): void {
  window.dispatchEvent(new CustomEvent<OpenChatDetail>(OPEN_CHAT_EVENT, { detail }));
}
