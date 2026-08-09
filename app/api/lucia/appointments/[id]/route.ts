import { forwardToAdmin } from "@/lib/luciaAdmin";

/**
 * Borra una cita agendada a mano.
 *
 * Solo las manuales: el backend rechaza las que salieron de una conversación,
 * que se cancelan para que quede el registro de que existieron.
 */
export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/lucia/appointments/[id]">
) {
  const { id } = await context.params;
  return forwardToAdmin(`/appointments/${id}`, { method: "DELETE" });
}
