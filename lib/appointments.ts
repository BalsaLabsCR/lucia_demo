/**
 * Tipos de la agenda que muestra /lucia/citas.
 * Espejo de lo que devuelve `GET /admin/appointments` en el backend
 * (`src/admin/appointments.ts` del repo privado).
 */

/** confirmed = agendada · cancelled = cancelada desde el panel. */
export type AppointmentStatus = "confirmed" | "cancelled";

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
  cancelled: number;
  total: number;
}

export const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmada",
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

// ---------------------------------------------------------------------------
// Vista semanal
// ---------------------------------------------------------------------------

/** Días de la semana, empezando el lunes como se cuenta en Costa Rica. */
export const WEEKDAY_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

/** El lunes de la semana a la que pertenece esa fecha, a las 00:00. */
export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  // getDay() da 0 para domingo; acá el domingo es el último día, no el primero.
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Los siete días de esa semana. */
export function weekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

/** "4 – 10 de agosto de 2026", sin repetir el mes cuando es el mismo. */
export function weekLabel(weekStart: Date): string {
  const end = addDays(weekStart, 6);
  const sameMonth = weekStart.getMonth() === end.getMonth();
  const sameYear = weekStart.getFullYear() === end.getFullYear();

  const from = weekStart.toLocaleDateString("es-CR", {
    day: "numeric",
    ...(sameMonth ? {} : { month: "long" }),
    ...(sameYear ? {} : { year: "numeric" }),
  });
  const to = end.toLocaleDateString("es-CR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return `${from} – ${to}`;
}

/** Minutos desde la medianoche de su propio día. */
export function minutesOfDay(iso: string): number {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

/** Las citas de ese día, de la más temprana en adelante. */
export function appointmentsOfDay(
  appointments: Appointment[],
  day: Date
): Appointment[] {
  return appointments
    .filter((a) => isSameDay(new Date(a.startsAt), day))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export interface PlacedAppointment {
  appointment: Appointment;
  /** Carril que le tocó dentro de su grupo de citas encimadas. */
  lane: number;
  /** Cuántos carriles tiene ese grupo: define el ancho de cada bloque. */
  lanes: number;
}

/**
 * Reparte en carriles las citas que se enciman.
 *
 * Encimarse no es un caso raro acá: una cita en estado `conflict` es
 * literalmente una que cayó sobre un horario ocupado. Si se dibujaran una
 * encima de otra, el problema que hay que resolver quedaría tapado justo en la
 * vista que se hizo para verlo.
 *
 * Se agrupan las que se tocan entre sí y cada grupo reparte el ancho: dos
 * encimadas ocupan media columna cada una. El carril es el primero que ya
 * quedó libre a esa hora, así que citas seguidas —no encimadas— vuelven a usar
 * el carril de la izquierda en vez de irse escalonando hacia la derecha.
 */
export function placeOverlaps(dayAppointments: Appointment[]): PlacedAppointment[] {
  const placed: PlacedAppointment[] = [];
  let cluster: PlacedAppointment[] = [];
  /** Fin de cada carril del grupo actual, en minutos. */
  let laneEnds: number[] = [];

  const flush = () => {
    for (const item of cluster) item.lanes = laneEnds.length;
    placed.push(...cluster);
    cluster = [];
    laneEnds = [];
  };

  for (const appointment of dayAppointments) {
    const start = minutesOfDay(appointment.startsAt);
    const end = Math.max(minutesOfDay(appointment.endsAt), start + 15);

    // Si arranca después de que terminó TODO el grupo, el grupo se cierra.
    if (cluster.length > 0 && laneEnds.every((laneEnd) => start >= laneEnd)) flush();

    let lane = laneEnds.findIndex((laneEnd) => start >= laneEnd);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(end);
    } else {
      laneEnds[lane] = end;
    }

    cluster.push({ appointment, lane, lanes: 1 });
  }

  if (cluster.length > 0) flush();
  return placed;
}

/**
 * Franja de horas que tiene que mostrar la grilla.
 *
 * Arranca en el horario de oficina y se estira si hay citas afuera: una cita a
 * las 7 a.m. tiene que verse, y una grilla de 24 horas deja las 10 horas que
 * importan aplastadas contra el medio.
 */
export function hourRange(
  appointments: Appointment[],
  fallback: [number, number] = [8, 18]
): [number, number] {
  let [from, to] = fallback;

  for (const a of appointments) {
    from = Math.min(from, Math.floor(minutesOfDay(a.startsAt) / 60));
    // Una cita que termina 6:01 p.m. necesita que la grilla llegue a las 7.
    to = Math.max(to, Math.ceil(minutesOfDay(a.endsAt) / 60));
  }

  return [Math.max(0, from), Math.min(24, Math.max(to, from + 1))];
}

/** Valor para un `<input type="date">`: YYYY-MM-DD en hora local. */
export function toLocalDateValue(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

/** Valor para un `<input type="time">`: HH:MM en hora local. */
export function toLocalTimeValue(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

/** "8 a.m." — etiqueta corta para la regleta de horas. */
export function hourLabel(hour: number): string {
  const h = hour % 24;
  const suffix = h < 12 ? "a.m." : "p.m.";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12} ${suffix}`;
}

/** Solo la hora de inicio: "10:00 a.m.". En un bloque angosto no cabe el rango. */
export function startTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-CR", {
    hour: "numeric",
    minute: "2-digit",
  });
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
