import { forwardToAdmin } from "@/lib/luciaAdmin";

/**
 * Puente hacia /admin/documents/* del backend de la clínica.
 *
 * Es el mismo patrón que el de marketing y el del copiloto, y por la misma
 * razón: una sola ruta atrapa-todo en vez de un archivo por endpoint, porque
 * repetir el reenvío no agrega ninguna garantía y sí lugares donde olvidarse de
 * algo.
 *
 * Acá importa más que en los otros dos. Los documentos son los CVs del equipo y
 * un contrato con un tercero: la llave nunca sale del servidor de Next, y el
 * camino se valida para que un `..` en la URL no convierta este puente en un
 * proxy hacia cualquier ruta administrativa con la llave puesta.
 */

/** Segmentos válidos: nada de rutas relativas ni vacíos. */
function safePath(segments: string[]): string | null {
  if (segments.length === 0) return null;
  if (segments.some((s) => s === "" || s === "." || s === ".." || s.includes("/"))) return null;
  return segments.map((s) => encodeURIComponent(s)).join("/");
}

async function proxy(
  request: Request,
  ctx: RouteContext<"/api/lucia/documents/[...path]">,
  method: "GET" | "POST"
): Promise<Response> {
  const { path } = await ctx.params;
  const safe = safePath(path);
  if (!safe) {
    return Response.json({ error: "Ruta de documentos inválida" }, { status: 400 });
  }

  const query = new URL(request.url).searchParams.toString();
  const body = method === "GET" ? undefined : await request.text();

  return forwardToAdmin(`/documents/${safe}${query ? `?${query}` : ""}`, { method, body });
}

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/lucia/documents/[...path]">
) {
  return proxy(request, ctx, "GET");
}

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/lucia/documents/[...path]">
) {
  return proxy(request, ctx, "POST");
}
