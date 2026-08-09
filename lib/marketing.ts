/**
 * Tipos y helpers del panel de marketing.
 *
 * Espejo de lo que devuelve `/admin/marketing/*` en el backend
 * (`@balsalabscr/lucia-plugin-marketing`). No se importa el paquete: el sitio no
 * depende del backend en tiempo de compilación, igual que con leads y citas.
 */

export type CampaignStatus =
  | "draft"
  | "strategy_review"
  | "strategy_approved"
  | "assets_generating"
  | "creative_review"
  | "approved"
  | "archived";

/** Los pasos, en el orden en que los recorre una persona. */
export const STEP_ORDER: CampaignStatus[] = [
  "draft",
  "strategy_review",
  "strategy_approved",
  "assets_generating",
  "creative_review",
  "approved",
];

export const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  strategy_review: "Estrategia en revisión",
  strategy_approved: "Estrategia aprobada",
  assets_generating: "Generando material",
  creative_review: "Creativo en revisión",
  approved: "Aprobada",
  archived: "Archivada",
};

/** Qué tiene que hacer la persona en cada etapa. Es la guía del panel. */
export const STATUS_HINTS: Record<string, string> = {
  draft: "Pedile a Lucía tres propuestas para este brief.",
  strategy_review: "Leé las propuestas, elegí una y aprobá la estrategia.",
  strategy_approved: "Revisá el guion y mandá a generar el material.",
  assets_generating: "Lucía está generando. Podés cerrar y volver.",
  creative_review: "Aprobá o rechazá cada pieza. Nada se publica sin tu visto bueno.",
  approved: "Lista. Descargá el paquete de producción para terminarla.",
  archived: "Archivada.",
};

export const ASSET_STATUS_LABELS: Record<string, string> = {
  uploaded: "Tu material",
  generating: "Generando…",
  generated: "Sin revisar",
  rejected: "Rechazada",
  approved: "Aprobada",
};

export const REVISION_LABELS: Record<string, string> = {
  regenerate: "Otra propuesta",
  rewrite_hook: "Reescribir el gancho",
  change_tone: "Cambiar el tono",
  variant: "Hacer una variante",
  shorten: "Acortar",
  more_emotional: "Más emocional",
  more_direct: "Más directo",
  custom: "Otro cambio",
};

export interface CampaignBrief {
  context: string;
  instruction: string;
  audience: string;
  objective: string;
  keyMessage: string;
  styleAndTone: string;
  cta: string;
  keywords: string[];
  competitorNotes: string;
  campaignGoal: string;
  primaryKpi: string;
  secondaryKpis: string[];
  landingPage?: string;
  /**
   * Las promociones que la campaña anuncia, por id.
   *
   * Referencia, no texto: la promoción vive una sola vez en /lucia/knowledge, con
   * su vigencia. Vacío = la campaña no puede mencionar ningún descuento.
   */
  promotionIds: string[];
  constraints: string[];
  additionalInstructions: string;
}

export interface Concept {
  id: string;
  title: string;
  angle: string;
  hook: string;
  keyMessage: string;
  audienceInsight: string;
  valueProposition: string;
  cta: string;
  /** Por qué la IA propone esto. Es lo que permite elegir con criterio. */
  rationale: string;
  selected: boolean;
  derivedFrom: string | null;
  revisionNote: string | null;
  createdAt: string;
}

export interface StoryboardScene {
  start: number;
  end: number;
  purpose: string;
  visualDescription: string;
  source: "existing_asset" | "generated" | "text_only";
  sourceAssetId?: string;
  generatedAssetPrompt: string;
  voiceover: string;
  overlayText: string;
  transition: string;
}

export interface Storyboard {
  durationSeconds: number;
  aspectRatio: string;
  scenes: StoryboardScene[];
  voiceoverScript: string;
  musicMood: string;
}

export interface ChannelContent {
  headline: string;
  caption: string;
  hashtags: string[];
  cta: string;
  overlayTexts: string[];
  musicMood: string;
}

export interface Asset {
  id: string;
  /** uploaded = lo puso la clínica · generated = lo produjo un proveedor. */
  origin: string;
  /** source | draft | export: en qué etapa vive el archivo. */
  assetClass: string;
  kind: string;
  status: string;
  /**
   * Ruta autenticada del backend para leer el archivo, relativa a /admin.
   *
   * No es una URL pública ni una firmada: se pide a través del proxy de este
   * sitio, que es el único que tiene la llave del panel.
   */
  contentPath: string | null;
  /** URL de material que ya vivía afuera. El backend no la controla. */
  externalUrl: string | null;
  mimeType: string | null;
  bytes: number | null;
  prompt: string | null;
  sceneIndex: number | null;
  label: string | null;
  reviewNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  subject: string;
  subjectId: string | null;
  action: string;
  fromStatus: string | null;
  toStatus: string | null;
  note: string | null;
  actor: string | null;
  createdAt: string;
}

export interface CampaignSummary {
  id: string;
  name: string;
  status: CampaignStatus;
  statusLabel: string;
  channel: string;
  channelLabel: string;
  nextStatuses: CampaignStatus[];
  conceptCount: number;
  selectedConceptId: string | null;
  hasStoryboard: boolean;
  assetCounts: { total: number; approved: number; rejected: number; pending: number };
  createdAt: string;
  updatedAt: string;
}

export interface CampaignDetail extends CampaignSummary {
  brief: CampaignBrief;
  /**
   * Los hechos congelados al aprobar la estrategia, con la versión del formato.
   *
   * La versión viaja para que un cambio futuro se pueda detectar en vez de leerse
   * a medias.
   */
  brandSnapshot: { schemaVersion: number; capturedAt: string; facts: { name: string } } | null;
  concepts: Concept[];
  storyboard: Storyboard | null;
  channelContent: ChannelContent | null;
  assets: Asset[];
  reviews: Review[];
  capabilities: {
    text: boolean;
    image: boolean;
    voice: boolean;
    video: boolean;
    renderer: boolean;
  };
}

/** Una promoción del negocio, con su vigencia ya evaluada por el backend. */
export interface PromotionOption {
  id: string;
  name: string;
  /** Cómo se le dice al público, armado desde el número declarado. */
  headline: string;
  conditions: string;
  active: boolean;
  /** Por qué no está vigente, cuando no lo está. */
  blockers: string[];
}

export interface ChannelFormat {
  id: string;
  platform: string;
  label: string;
  medium: "video" | "image";
  aspectRatio: string;
  duration: { min: number; max: number; recommended: number } | null;
  captionMaxChars: number;
  hashtags: { min: number; max: number };
}

export interface ProductionPackage {
  campaign: {
    id: string;
    name: string;
    status: string;
    channelLabel: string;
    aspectRatio: string;
    durationSeconds: number | null;
  };
  brand: { name: string; colors: { role: string; hex: string }[] };
  timeline: {
    sceneIndex: number;
    start: number;
    end: number;
    purpose: string;
    overlayText: string;
    voiceover: string;
    /** URL firmada para bajar el material. Vence. */
    assetUrl: string | null;
    assetUrlExpiresAt: string | null;
    assetOrigin: string | null;
  }[];
  voiceoverScript: string;
  voiceoverUrl: string | null;
  voiceoverUrlExpiresAt: string | null;
  copy: ChannelContent | null;
  cta: string;
  firstCut: { assetId: string; url: string | null } | null;
  warnings: string[];
  generatedAt: string;
}

/**
 * Llama al puente del sitio. Devuelve datos o lanza con el mensaje del backend.
 *
 * Los mensajes del plugin están escritos para que una persona los lea —dicen qué
 * falta hacer antes— así que se muestran tal cual en vez de traducirlos a
 * "ocurrió un error".
 */
export async function marketingApi<T>(
  path: string,
  init: { method?: "GET" | "POST" | "PUT"; body?: unknown } = {}
): Promise<T> {
  const res = await fetch(`/api/lucia/marketing/${path}`, {
    method: init.method ?? "GET",
    headers: { "Content-Type": "application/json" },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.error ?? `El servidor respondió ${res.status}`);
  }
  return body as T;
}

/**
 * De dónde saca el navegador los bytes de un asset.
 *
 * Siempre por el proxy de este sitio: el backend exige la llave del panel, que
 * vive solo en el servidor de Next. Para material externo, su URL tal cual.
 */
export function assetSrc(asset: Asset): string | null {
  if (asset.contentPath) {
    return `/api/lucia${asset.contentPath}`;
  }
  return asset.externalUrl;
}

/** "0:00 – 0:05" para los tiempos de una escena. */
export function sceneTime(start: number, end: number): string {
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
  return `${fmt(start)} – ${fmt(end)}`;
}

/** true si en esta etapa el material todavía no se puede dar por final. */
export function needsReview(campaign: CampaignSummary): boolean {
  return campaign.status !== "approved" && campaign.status !== "archived";
}
