import { forwardToAdmin } from "@/lib/luciaAdmin";

/** Conversación completa con todos sus mensajes. */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/lucia/chats/[id]">
) {
  const { id } = await ctx.params;
  return forwardToAdmin(`/chats/${encodeURIComponent(id)}`, { method: "GET" });
}
