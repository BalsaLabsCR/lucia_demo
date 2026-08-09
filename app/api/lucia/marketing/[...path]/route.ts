import { forwardFileToAdmin, forwardToAdmin } from "@/lib/luciaAdmin";

/**
 * Puente hacia /admin/marketing/* del backend de la clínica.
 *
 * Es una sola ruta atrapa-todo y no veinte archivos con un `forwardToAdmin` cada
 * uno: el plugin de marketing expone muchos verbos sobre el mismo recurso
 * (conceptos, revisiones, guion, material, aprobaciones, métricas) y repetir el
 * mismo reenvío veinte veces no agrega ninguna garantía — solo lugares donde
 * olvidarse de algo.
 *
 * Lo que sí se revisa acá es que el camino no se escape del prefijo: sin eso,
 * un `..` en la URL convertiría este puente en un proxy hacia CUALQUIER ruta
 * administrativa, con la llave del servidor puesta.
 *
 * La llave nunca sale del servidor y el navegador nunca habla con OpenAI: pide
 * acá, y el backend de la clínica se encarga.
 */

/** Segmentos válidos: nada de rutas relativas ni vacíos. */
function safePath(segments: string[]): string | null {
  if (segments.length === 0) return null;
  if (segments.some((s) => s === "" || s === "." || s === ".." || s.includes("/"))) return null;
  return segments.map((s) => encodeURIComponent(s)).join("/");
}

async function proxy(
  request: Request,
  ctx: RouteContext<"/api/lucia/marketing/[...path]">,
  method: "GET" | "POST" | "PUT"
): Promise<Response> {
  const { path } = await ctx.params;
  const safe = safePath(path);
  if (!safe) {
    return Response.json({ error: "Ruta de marketing inválida" }, { status: 400 });
  }

  // El contenido de un asset es binario: no pasa por el reenvío JSON.
  if (method === "GET" && path[path.length - 1] === "content") {
    return forwardFileToAdmin(`/marketing/${safe}`);
  }

  const query = new URL(request.url).searchParams.toString();
  const body = method === "GET" ? undefined : await request.text();

  return forwardToAdmin(`/marketing/${safe}${query ? `?${query}` : ""}`, { method, body });
}

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/lucia/marketing/[...path]">
) {
  return proxy(request, ctx, "GET");
}

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/lucia/marketing/[...path]">
) {
  return proxy(request, ctx, "POST");
}

export async function PUT(
  request: Request,
  ctx: RouteContext<"/api/lucia/marketing/[...path]">
) {
  return proxy(request, ctx, "PUT");
}
