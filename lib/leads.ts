/**
 * Tipos del listado de leads que muestra /lucia/leads.
 * Espejo de lo que devuelve `GET /admin/leads` en el backend
 * (`src/admin/leads.ts` del repo privado).
 */

/** hot_lead = quiere contratar ya · lead = mostró interés. */
export type LeadType = "lead" | "hot_lead";

export type LeadSort = "recent" | "oldest" | "name";

/** pending = mostró interés y no agendó · booked = ya tiene cita. */
export type LeadStatus = "pending" | "booked";

export type ConversionGoal = "appointment" | "lead";

/** El chat del que salió el lead. null si esa conversación fue borrada. */
export interface LeadOrigin {
  id: string;
  channel: string;
  externalId: string;
  name: string | null;
  phone: string | null;
  lastMessageAt: string | null;
  messageCount: number;
}

export interface Lead {
  id: string;
  type: string;
  channel: string;
  name: string | null;
  phone: string | null;
  /** Qué le interesó, en las palabras que registró Lucía. */
  notes: string | null;
  createdAt: string;
  conversationId: string | null;
  conversation: LeadOrigin | null;
  /** true si esa conversación terminó con una cita: ya no hay que perseguirla. */
  booked: boolean;
}

export interface LeadCounts {
  all: number;
  hot: number;
  normal: number;
  /** Interesados que NO agendaron: el número que de verdad importa. */
  pending: number;
  lastDay: number;
  lastWeek: number;
}

export const TYPE_LABELS: Record<string, string> = {
  hot_lead: "Quiere contratar",
  lead: "Interesado",
};

export const SORT_LABELS: Record<LeadSort, string> = {
  recent: "Más recientes",
  oldest: "Más antiguos",
  name: "Por nombre",
};

/** Cómo llamar al lead en la lista, con lo poco o mucho que se sepa de él. */
export function leadName(lead: Lead): string {
  if (lead.name) return lead.name;
  if (lead.phone) return lead.phone;
  if (lead.conversation?.name) return lead.conversation.name;
  if (lead.conversation?.phone) return lead.conversation.phone;
  return lead.channel === "web" ? "Visitante del sitio" : "Contacto de WhatsApp";
}

/** true si no hay forma de contactar a esta persona. */
export function isUnreachable(lead: Lead): boolean {
  return !lead.phone && !lead.conversation?.phone;
}

/** El teléfono utilizable, venga del lead o de su conversación. */
export function contactPhone(lead: Lead): string | null {
  return lead.phone ?? lead.conversation?.phone ?? null;
}
