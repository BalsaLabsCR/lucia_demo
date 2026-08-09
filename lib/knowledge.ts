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
  /**
   * @deprecated Texto libre que se usaba como promoción.
   *
   * Ya no se anuncia ni autoriza nada: un campo de texto no puede decir si la
   * promoción está vigente. Las promociones viven en `knowledge.promotions`.
   */
  discount: string;
}

export type PromotionType = "percentage" | "fixed_amount" | "special_price" | "custom";

export const PROMOTION_TYPE_LABELS: Record<PromotionType, string> = {
  percentage: "Porcentaje de descuento",
  fixed_amount: "Monto de descuento",
  special_price: "Precio promocional",
  custom: "Otra (2x1, regalo…)",
};

/**
 * Una promoción estructurada. Espejo de `promotionSchema` del backend.
 *
 * El número va aparte del texto: es lo que permite que el sistema sepa cuándo
 * dejar de anunciarla y qué valor exacto se puede publicar.
 */
export interface KnowledgePromotion {
  id: string;
  name: string;
  enabled: boolean;
  type: PromotionType;
  /** El número que afirma. Ausente solo en las de tipo `custom`. */
  value?: number;
  currency: string;
  description: string;
  /** Ids de servicios. Vacío = aplica a todo. */
  appliesToServiceIds: string[];
  startsAt?: string;
  endsAt?: string;
  /** Vacío = se puede anunciar en cualquier canal. */
  channels: string[];
  conditions: string;
  /**
   * De dónde salió, cuando la creó el conversor del campo viejo `discount`.
   *
   * Presente = nadie la revisó todavía: llegó con el texto que alguien había
   * escrito, apagada y sin tipo ni vigencia.
   */
  importedFrom?: string;
}

/**
 * Por qué una promoción NO se anuncia hoy. Vacío = está vigente.
 *
 * Es el mismo criterio que aplica el backend, repetido acá para que el panel
 * pueda mostrarlo sin ir a preguntar. Si los dos se desincronizaran, el que manda
 * es el backend: el panel solo informa.
 */
export function promotionBlockers(
  promotion: KnowledgePromotion,
  services: KnowledgeService[],
  now: Date
): string[] {
  const blockers: string[] = [];
  const hoy = now.toISOString().slice(0, 10);

  if (!promotion.enabled) blockers.push("está deshabilitada");
  if (promotion.startsAt && promotion.startsAt > hoy) {
    blockers.push(`todavía no empieza (arranca el ${promotion.startsAt})`);
  }
  if (promotion.endsAt && promotion.endsAt < hoy) {
    blockers.push(`ya venció (terminó el ${promotion.endsAt})`);
  }
  if (promotion.appliesToServiceIds.length > 0) {
    const activos = new Set(services.filter((s) => s.enabled).map((s) => s.id));
    if (!promotion.appliesToServiceIds.some((id) => activos.has(id))) {
      blockers.push("ninguno de los servicios a los que aplica está activo");
    }
  }
  return blockers;
}

export function isPromotionActive(
  promotion: KnowledgePromotion,
  services: KnowledgeService[],
  now: Date
): boolean {
  return promotionBlockers(promotion, services, now).length === 0;
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
  /** Las promociones estructuradas del negocio. La única fuente de descuentos. */
  promotions: KnowledgePromotion[];
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
