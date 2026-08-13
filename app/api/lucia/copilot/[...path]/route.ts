import { forwardToAdmin } from "@/lib/luciaAdmin";

/**
 * Puente hacia /admin/business/* del backend de la clínica.
 *
 * Es una sola ruta atrapa-todo y no quince archivos con un `forwardToAdmin`
 * cada uno, por la misma razón que en marketing: el copiloto expone muchos
 * verbos sobre los mismos recursos —resumen, métricas, señales,
 * recomendaciones, aprobación, ejecución, directivas, escenarios— y repetir el
 * mismo reenvío no agrega ninguna garantía, solo lugares donde olvidarse de algo.
 *
 * Lo que sí se revisa acá es que el camino no se escape del prefijo: sin eso,
 * un `..` en la URL convertiría este puente en un proxy hacia CUALQUIER ruta
 * administrativa, con la llave del servidor puesta.
 *
 * La llave nunca sale del servidor: el navegador pide acá, y el backend de la
 * clínica se encarga.
 */

/** Segmentos válidos: nada de rutas relativas ni vacíos. */
function safePath(segments: string[]): string | null {
  if (segments.length === 0) return null;
  if (segments.some((s) => s === "" || s === "." || s === ".." || s.includes("/"))) return null;
  return segments.map((s) => encodeURIComponent(s)).join("/");
}

async function proxy(
  request: Request,
  ctx: RouteContext<"/api/lucia/copilot/[...path]">,
  method: "GET" | "POST"
): Promise<Response> {
  const { path } = await ctx.params;
  const safe = safePath(path);
  if (!safe) {
    return Response.json({ error: "Ruta del copiloto inválida" }, { status: 400 });
  }

  const query = new URL(request.url).searchParams.toString();
  const body = method === "GET" ? undefined : await request.text();

  return forwardToAdmin(`/business/${safe}${query ? `?${query}` : ""}`, { method, body });
}

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/lucia/copilot/[...path]">
) {
  return proxy(request, ctx, "GET");
}

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/lucia/copilot/[...path]">
) {
  return proxy(request, ctx, "POST");
}
