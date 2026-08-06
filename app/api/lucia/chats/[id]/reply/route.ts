import { forwardToAdmin } from "@/lib/luciaAdmin";

/** Respuesta manual de una persona del equipo. */
export async function POST(
  request: Request,
  ctx: RouteContext<"/api/lucia/chats/[id]/reply">
) {
  const { id } = await ctx.params;
  return forwardToAdmin(`/chats/${encodeURIComponent(id)}/reply`, {
    method: "POST",
    body: await request.text(),
  });
}
