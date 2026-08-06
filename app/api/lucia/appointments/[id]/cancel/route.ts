import { forwardToAdmin } from "@/lib/luciaAdmin";

/** Cancela una cita y libera su espacio en el calendario, si llegó a crearse. */
export async function POST(
  _request: Request,
  context: RouteContext<"/api/lucia/appointments/[id]/cancel">
) {
  const { id } = await context.params;
  return forwardToAdmin(`/appointments/${id}/cancel`, { method: "POST" });
}
