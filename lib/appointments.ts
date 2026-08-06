/**
 * Tipos de la agenda que muestra /lucia/citas.
 * Espejo de lucia-backend/src/admin/appointments.ts.
 */

/** confirmed = agendada · conflict = el horario estaba ocupado · cancelled = cancelada desde el panel. */
export type AppointmentStatus = "confirmed" | "conflict" | "cancelled";

export type AppointmentRange = "upcoming" | "past" | "all";

/** El chat que originó la cita. null si esa conversación fue borrada. */
export interface AppointmentOrigin {
  id: string;
  channel: string;
  externalId: string;
  messageCount: number;
}

export interface Appointment {
  id: string;
  channel: string;
  name: string | null;
  phone: string | null;
  /** Motivo o servicio, en las palabras que registró Lucía. */
  notes: string | null;
  startsAt: string;
  endsAt: string;
  status: string;
  eventId: string | null;
  createdAt: string;
  conversationId: string | null;
  conversation: AppointmentOrigin | null;
}

export interface AppointmentCounts {
  upcoming: number;
  today: number;
  conflicts: number;
  cancelled: number;
  total: number;
}

export const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmada",
  conflict: "Horario ocupado",
  cancelled: "Cancelada",
};

export const RANGE_LABELS: Record<AppointmentRange, string> = {
  upcoming: "Próximas",
  past: "Pasadas",
  all: "Todas",
};

/** Cómo llamar al paciente con lo poco o mucho que se sepa de él. */
export function patientName(appointment: Appointment): string {
  if (appointment.name) return appointment.name;
  if (appointment.phone) return appointment.phone;
  return appointment.channel === "web" ? "Visitante del sitio" : "Contacto de WhatsApp";
}

/** Clave de día (YYYY-MM-DD en hora local) para agrupar la agenda. */
export function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/** Encabezado de cada grupo de día: "Hoy", "Mañana" o la fecha completa. */
export function dayHeading(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

  if (sameDay(date, today)) return "Hoy";

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (sameDay(date, tomorrow)) return "Mañana";

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (sameDay(date, yesterday)) return "Ayer";

  return date.toLocaleDateString("es-CR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/** Rango horario de la cita: "10:00 a.m. – 11:00 a.m.". */
export function timeRange(startsAt: string, endsAt: string): string {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString("es-CR", { hour: "numeric", minute: "2-digit" });
  return `${fmt(startsAt)} – ${fmt(endsAt)}`;
}

/** Agrupa en orden, respetando el que viene del servidor. */
export function groupByDay(
  appointments: Appointment[]
): Array<{ key: string; heading: string; appointments: Appointment[] }> {
  const groups: Array<{ key: string; heading: string; appointments: Appointment[] }> = [];

  for (const appointment of appointments) {
    const key = dayKey(appointment.startsAt);
    const last = groups[groups.length - 1];
    if (last?.key === key) {
      last.appointments.push(appointment);
    } else {
      groups.push({
        key,
        heading: dayHeading(appointment.startsAt),
        appointments: [appointment],
      });
    }
  }

  return groups;
}
