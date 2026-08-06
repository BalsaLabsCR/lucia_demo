import { forwardToAdmin } from "@/lib/luciaAdmin";

/** Listado de leads. Reenvía los filtros (channel, type, q, sort, limit). */
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.toString();
  return forwardToAdmin(`/leads${query ? `?${query}` : ""}`, { method: "GET" });
}
