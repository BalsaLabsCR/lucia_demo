/**
 * Los documentos de la clínica. **La única parte de la Sala que consulta de
 * verdad.**
 *
 * Todo lo demás en `/lucia/negocio` sale de `datos.ts`, un archivo escrito a
 * mano. Esta pestaña no: los PDFs están ingeridos en la base con sus embeddings
 * y la pregunta se resuelve con búsqueda semántica contra el backend de la
 * clínica. Por eso es la única con caja de texto, y por eso vale la pena decir
 * en voz alta que lo es.
 *
 * El navegador nunca habla con OpenAI: pide al proxy de Next, el proxy al
 * backend con la llave de admin, y el backend —el único que tiene las llaves—
 * al proveedor.
 */

export type CategoriaDocumento = "RRHH" | "Talento" | "Operación" | "Negocio" | "Legal";

export interface DocumentoCargado {
  archivo: string;
  titulo: string;
  categoria: CategoriaDocumento;
  detalle: string;
  /** false = está en el catálogo pero nadie corrió la ingesta. */
  ingerido: boolean;
  fragmentos: number;
  ingeridoEl: string | null;
}

export interface CatalogoDocumentos {
  documentos: DocumentoCargado[];
  preguntasSugeridas: string[];
  /** false = no hay ni un documento ingerido; la pestaña no puede responder. */
  listo: boolean;
  fragmentos: number;
}

export interface Cita {
  archivo: string;
  titulo: string;
  fragmento: string;
}

export interface RespuestaDocumental {
  pregunta: string;
  respuesta: string;
  citas: Cita[];
  /** true cuando no había nada relevante que leer. */
  sinFuentes: boolean;
  modelo: string | null;
}

/**
 * Llama al puente del sitio. Devuelve datos o lanza con el mensaje del backend.
 *
 * Los mensajes de estas rutas están escritos para que una persona los lea —dicen
 * qué falta configurar o qué falta correr— así que se muestran tal cual en vez
 * de traducirlos a "ocurrió un error". En una charla, "corré npm run ingest" es
 * infinitamente más útil que "error 500".
 */
async function documentosApi<T>(
  path: string,
  init: { method?: "GET" | "POST"; body?: unknown } = {}
): Promise<T> {
  const res = await fetch(`/api/lucia/documents${path}`, {
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

export function leerCatalogo(): Promise<CatalogoDocumentos> {
  return documentosApi<CatalogoDocumentos>("");
}

export function preguntar(pregunta: string): Promise<RespuestaDocumental> {
  return documentosApi<RespuestaDocumental>("/ask", { method: "POST", body: { pregunta } });
}
