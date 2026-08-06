import { forwardToAdmin } from "@/lib/luciaAdmin";

/** Lista de conversaciones. Reenvía los filtros (channel, q, state, limit). */
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.toString();
  return forwardToAdmin(`/chats${query ? `?${query}` : ""}`, { method: "GET" });
}
