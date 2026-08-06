export interface ChatMessage {
  id: string;
  /**
   * `user`, `ai` y `human` (una persona del equipo respondiendo desde el panel)
   * son la conversación; `system` avisa cambios de estado del backend (handoff,
   * modo manual) y `error` un fallo de conexión reintentable.
   */
  kind: "user" | "ai" | "human" | "system" | "error";
  text: string;
}
