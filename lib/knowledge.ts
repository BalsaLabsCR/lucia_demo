/**
 * Tipos del conocimiento de Lucía que edita la página /lucia/knowledge.
 *
 * IMPORTANTE: espejo del cuerpo de `GET`/`PUT /admin/knowledge` del backend
 * (allá los tipos viven con zod, en `src/knowledge/types.ts` del repo privado).
 * Si se cambia la estructura en un lado hay que cambiarla en el otro.
 */

export interface KnowledgeService {
  id: string;
  /** Si está apagado, Lucía no conoce el servicio y no lo ofrece. */
  enabled: boolean;
  name: string;
  /** Descripción corta que se puede decir al cliente. */
  publicDescription: string;
  /** Contexto oculto para la IA (cómo se realiza el procedimiento, detalles internos). */
  aiNotes: string;
  /** Texto libre: "₡35.000", "desde ₡120.000", "según valoración". */
  price: string;
  /** Cuánto bloquea en la agenda, en minutos. Es tiempo de sillón, no una estimación. */
  durationMinutes: number;
  /** Promoción vigente que Lucía puede anunciar. Vacío = sin promo. */
  discount: string;
}

export interface KnowledgeFaq {
  id: string;
  question: string;
  answer: string;
}

export type Weekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface DaySchedule {
  day: Weekday;
  closed: boolean;
  /** HH:MM (24 h) */
  open: string;
  close: string;
}

export interface SpecialDay {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  reason: string;
  closed: boolean;
  open: string;
  close: string;
}

export interface Vacation {
  id: string;
  start: string;
  end: string;
  note: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  /** Bio pública que Lucía puede compartir (nada confidencial). */
  bio: string;
  /** Horario de atención en texto libre. */
  schedule: string;
  vacations: Vacation[];
}

export interface RuleChoice<Option extends string> {
  option: Option | "custom";
  custom: string;
}

export type AngryUserOption = "escalate" | "calm_persist" | "offer_call";
export type ObsceneOption = "redirect" | "warn_then_end" | "escalate";
export type OffTopicOption = "gentle_redirect" | "decline";
export type UncomfortableOption = "empathize_value" | "escalate";

export interface KnowledgeRules {
  angryUser: RuleChoice<AngryUserOption>;
  obsceneLanguage: RuleChoice<ObsceneOption>;
  offTopic: RuleChoice<OffTopicOption>;
  uncomfortableQuestions: RuleChoice<UncomfortableOption>;
  escalation: {
    onExplicitRequest: boolean;
    onComplaint: boolean;
    onEmergency: boolean;
    onBilling: boolean;
    keywords: string[];
    custom: string;
  };
}

export interface Knowledge {
  version: 1;
  general: {
    clinicName: string;
    address: string;
    phone: string;
    paymentMethods: string;
    bookingPolicy: string;
    extraNotes: string;
  };
  services: KnowledgeService[];
  faqs: KnowledgeFaq[];
  schedule: {
    weekly: DaySchedule[];
    specialDays: SpecialDay[];
  };
  staff: StaffMember[];
  rules: KnowledgeRules;
  agent: {
    name: string;
    /** 1 = más profesional/formal · 5 = más amigable/cercano. */
    tone: number;
    extraInstructions: string;
  };
}


/** Id corto para elementos nuevos de las listas. */
export function newId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  monday: "Lunes",
  tuesday: "Martes",
  wednesday: "Miércoles",
  thursday: "Jueves",
  friday: "Viernes",
  saturday: "Sábado",
  sunday: "Domingo",
};
