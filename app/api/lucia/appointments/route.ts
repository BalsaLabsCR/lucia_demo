import { forwardToAdmin } from "@/lib/luciaAdmin";

/** Agenda de citas. Reenvía los filtros (channel, status, range, q, limit). */
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.toString();
  return forwardToAdmin(`/appointments${query ? `?${query}` : ""}`, { method: "GET" });
}
