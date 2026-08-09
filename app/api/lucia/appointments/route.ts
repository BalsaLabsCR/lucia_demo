import { forwardToAdmin } from "@/lib/luciaAdmin";

/** Agenda de citas. Reenvía los filtros (channel, status, range, from, to, q, limit). */
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.toString();
  return forwardToAdmin(`/appointments${query ? `?${query}` : ""}`, { method: "GET" });
}

/** Agenda una cita a mano, sin conversación detrás. */
export async function POST(request: Request) {
  const body = await request.text();
  return forwardToAdmin("/appointments", { method: "POST", body });
}
