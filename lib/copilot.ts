/**
 * Tipos y helpers del Copiloto de Negocio.
 *
 * Espejo de lo que devuelve `/admin/business/*` en el backend
 * (`@balsalabscr/lucia-plugin-business-insights` y las rutas de escenarios de
 * Sonrisa Pura). No se importa el paquete: el sitio no depende del backend en
 * tiempo de compilación, igual que con leads, citas y marketing.
 */

export type SignalSeverity = "info" | "warning" | "critical";

export type RecommendationStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "rejected"
  | "executed"
  | "superseded";

export type RecommendationCategory =
  | "marketing"
  | "sales"
  | "customer_service"
  | "capacity"
  | "operations"
  | "financial"
  | "follow_up";

export type ProposedActionKind =
  | "create_marketing_brief"
  | "set_conversation_directive"
  | "create_internal_task"
  | "request_human_review"
  | "monitor_metric";

export const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  pending_review: "Esperando tu revisión",
  approved: "Aprobada",
  rejected: "Rechazada",
  executed: "Ejecutada",
  superseded: "Reemplazada",
};

export const CATEGORY_LABELS: Record<string, string> = {
  marketing: "Marketing",
  sales: "Ventas",
  customer_service: "Atención",
  capacity: "Capacidad",
  operations: "Operación",
  financial: "Finanzas",
  follow_up: "Seguimiento",
};

export const SEVERITY_LABELS: Record<string, string> = {
  info: "Para tener en cuenta",
  warning: "Atender",
  critical: "Urgente",
};

export const ACTION_LABELS: Record<string, string> = {
  create_marketing_brief: "Crear brief de campaña",
  set_conversation_directive: "Dar una directiva a Lucía",
  create_internal_task: "Crear tarea interna",
  request_human_review: "Marcar para revisión",
  monitor_metric: "Vigilar métricas",
};

/** Qué hace cada acción, para que nadie apruebe algo sin saber qué pasa. */
export const ACTION_HINTS: Record<string, string> = {
  create_marketing_brief:
    "Crea una campaña en BORRADOR en el módulo de Marketing. No publica nada.",
  set_conversation_directive:
    "Le da a Lucía una indicación temporal que solo usa cuando el cliente muestra una necesidad compatible.",
  create_internal_task: "Deja anotada una tarea para el equipo, con fecha.",
  request_human_review: "Marca el tema para que lo decida una persona.",
  monitor_metric: "Deja las métricas bajo observación hasta la fecha indicada.",
};

export interface EvidenceItem {
  metricKey: string;
  label: string;
  value: number;
  previousValue: number | null;
  changePercent: number | null;
  unit: string;
  /** De qué campos de la foto salió el número. Es la trazabilidad. */
  source: string;
}

export interface BusinessMetric {
  id: string;
  key: string;
  label: string;
  value: number;
  unit: "currency" | "count" | "percent" | "minutes" | "ratio";
  period: { label: string; start: string; end: string };
  previousValue: number | null;
  changePercent: number | null;
  source: string;
  calculatedAt: string;
}

export interface BusinessSignal {
  id: string;
  type: string;
  severity: SignalSeverity;
  title: string;
  description: string;
  metricKeys: string[];
  evidence: EvidenceItem[];
  detectedAt: string;
  status: string;
}

export interface BusinessInsight {
  id: string;
  title: string;
  summary: string;
  signalIds: string[];
  evidence: EvidenceItem[];
  confidence: number;
  assumptions: string[];
  limitations: string[];
  createdAt: string;
}

export interface ProposedAction {
  id: string;
  recommendationId: string;
  kind: ProposedActionKind;
  payload: Record<string, unknown>;
  status: "pending" | "executed" | "failed" | "skipped";
  idempotencyKey: string;
  result: Record<string, unknown> | null;
  /** La campaña creada, cuando la acción creó una. */
  linkedCampaignId: string | null;
  executedAt: string | null;
  executedBy: string | null;
  createdAt: string;
}

export interface BusinessRecommendation {
  id: string;
  runId: string;
  title: string;
  description: string;
  rationale: string;
  expectedImpact: string;
  evidence: EvidenceItem[];
  confidence: number;
  priority: "low" | "medium" | "high";
  category: RecommendationCategory;
  status: RecommendationStatus;
  signalIds: string[];
  metricKeys: string[];
  proposedActions: ProposedAction[];
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
}

export interface ConversationDirective {
  id: string;
  title: string;
  goal: string;
  serviceIds: string[];
  audience: string;
  triggerConditions: string[];
  suggestedApproach: string;
  allowedClaims: string[];
  prohibitedClaims: string[];
  priority: "low" | "medium" | "high";
  startsAt: string;
  endsAt: string;
  status: "active" | "expired" | "deactivated";
  sourceRecommendationId: string;
  /** Cuántos días le quedan de vigencia. Lo calcula el backend. */
  daysRemaining: number;
}

export interface AnalysisRun {
  id: string;
  scenarioId: string | null;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  status: "ok" | "failed";
  provider: string;
  /** true si el análisis corrió sin llamar a ningún modelo. */
  deterministic: boolean;
  error: string | null;
  createdAt: string;
}

export interface CopilotSummary {
  run: AnalysisRun | null;
  analysis: { provider: string; deterministic: boolean };
  metrics: BusinessMetric[];
  signals: BusinessSignal[];
  insights: BusinessInsight[];
  recommendations: BusinessRecommendation[];
  directives: ConversationDirective[];
  counts: { openRecommendations: number; criticalSignals: number; activeDirectives: number };
}

export interface ScenarioCard {
  id: string;
  label: string;
  description: string;
}

export interface ActiveScenario {
  scenarioId: string;
  label: string;
  description: string;
  activatedAt: string;
  activatedBy: string | null;
}

export interface ScenarioState {
  /** false = este backend no permite operaciones de demostración. */
  enabled: boolean;
  /** Por qué no, cuando no. */
  blockedReason: string | null;
  analysisMode: "deterministic" | "ai";
  scenarios: ScenarioCard[];
  active: ActiveScenario | null;
}

/**
 * Las métricas que se muestran en el resumen ejecutivo, en este orden.
 *
 * Son SEIS y no las quince que calcula el backend, a propósito: una pantalla con
 * quince números no se lee, se hojea. Las demás siguen estando —cada
 * recomendación muestra las suyas como evidencia— pero el encabezado tiene que
 * poder mirarse de un vistazo desde el fondo de una sala.
 */
export const RESUMEN_KEYS = [
  "revenue",
  "estimated_margin",
  "appointments_booked",
  "leads_received",
  "lead_conversion_rate",
  "schedule_utilization",
] as const;

/**
 * Miles con punto, como se escriben los montos en Costa Rica.
 *
 * A mano y no con `toLocaleString`: el ICU de Node y el del navegador no
 * coinciden —Node devuelve espacios finos donde el navegador pone puntos— y en
 * una página que se renderiza en el servidor y se hidrata en el cliente eso es
 * una diferencia de HTML entre los dos, o sea un aviso de hidratación y un
 * número que parpadea al cargar.
 */
export function miles(value: number): string {
  const entero = Math.round(Math.abs(value)).toString();
  const conPuntos = entero.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return value < 0 ? `-${conPuntos}` : conPuntos;
}

/**
 * El valor de una pieza de evidencia, formateado según su unidad.
 *
 * Sin esto, la evidencia de una métrica de plata se muestra como "6650000" —un
 * número que nadie lee de un vistazo y que, en una pantalla que existe para dar
 * respaldo, resta credibilidad en vez de sumarla.
 */
export function formatEvidence(value: number, unit: string, currency = "₡"): string {
  if (unit === "currency") return `${currency}${miles(value)}`;
  if (unit === "percent") return `${value}%`;
  if (unit === "minutes") return `${value} min`;
  return miles(value);
}

/** El valor de una métrica, ya formateado para mostrar. */
export function formatMetric(metric: BusinessMetric, currency = "₡"): string {
  switch (metric.unit) {
    case "currency":
      return `${currency}${miles(metric.value)}`;
    case "percent":
      return `${metric.value}%`;
    case "minutes":
      return `${metric.value} min`;
    default:
      return miles(metric.value);
  }
}

/**
 * Hacia dónde se mueve una métrica y si eso es bueno.
 *
 * "Bueno" depende de la métrica: que suba el gasto o el tiempo de respuesta es
 * malo, que suba el ingreso es bueno. Sin esta distinción, el panel pintaría de
 * verde una subida de costos.
 */
const MENOS_ES_MEJOR = new Set([
  "expenses",
  "avg_response_minutes",
  "cancellations",
  "cancellation_rate",
  "abandoned_conversations",
  "cost_per_lead",
  "cost_per_appointment",
]);

export type Trend = "up-good" | "up-bad" | "down-good" | "down-bad" | "flat";

export function trendOf(metric: BusinessMetric): Trend {
  if (metric.changePercent === null || Math.abs(metric.changePercent) < 1) return "flat";
  const sube = metric.changePercent > 0;
  const menosEsMejor = MENOS_ES_MEJOR.has(metric.key);
  if (sube) return menosEsMejor ? "up-bad" : "up-good";
  return menosEsMejor ? "down-good" : "down-bad";
}

export function trendArrow(trend: Trend): string {
  if (trend === "flat") return "→";
  return trend.startsWith("up") ? "↑" : "↓";
}

/** La confianza en palabras. Un 0.72 no le dice nada a nadie. */
export function confidenceLabel(confidence: number): string {
  if (confidence >= 0.8) return "Alta";
  if (confidence >= 0.6) return "Media";
  return "Baja";
}

/** true si la acción todavía se puede ejecutar. */
export function isExecutable(
  recommendation: BusinessRecommendation,
  action: ProposedAction
): boolean {
  return (
    (recommendation.status === "approved" || recommendation.status === "executed") &&
    action.status === "pending"
  );
}

/**
 * Llama al puente del sitio. Devuelve datos o lanza con el mensaje del backend.
 *
 * Los mensajes del copiloto están escritos para que una persona los lea —dicen
 * qué falta hacer antes— así que se muestran tal cual en vez de traducirlos a
 * "ocurrió un error".
 */
export async function copilotApi<T>(
  path: string,
  init: { method?: "GET" | "POST"; body?: unknown } = {}
): Promise<T> {
  const res = await fetch(`/api/lucia/copilot/${path}`, {
    method: init.method ?? "GET",
    headers: { "Content-Type": "application/json" },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(
      (body as { error?: string } | null)?.error ?? `El servidor respondió ${res.status}`
    );
  }
  return body as T;
}

/** Fecha y hora legibles, en la zona del navegador. */
export function dateTime(iso: string): string {
  return new Date(iso).toLocaleString("es-CR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
