import { forwardToAdmin } from "@/lib/luciaAdmin";

/** Quita el control a Lucía o se lo devuelve. */
export async function POST(
  request: Request,
  ctx: RouteContext<"/api/lucia/chats/[id]/control">
) {
  const { id } = await ctx.params;
  return forwardToAdmin(`/chats/${encodeURIComponent(id)}/control`, {
    method: "POST",
    body: await request.text(),
  });
}
