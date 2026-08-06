/**
 * Puente server-side hacia las rutas /admin/* del backend de Lucía.
 * La API key vive solo en el servidor (LUCIA_ADMIN_API_KEY): el navegador
 * siempre habla con las rutas /api/lucia/* de este sitio, nunca con el backend.
 *
 * SOLO para route handlers. Importarlo desde un componente cliente filtraría
 * la key al bundle del navegador.
 */

const API_URL = (
  process.env.NEXT_PUBLIC_LUCIA_API_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

/** Reenvía una petición a `/admin<path>` y devuelve la respuesta tal cual. */
export async function forwardToAdmin(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const key = process.env.LUCIA_ADMIN_API_KEY;
  if (!key) {
    return Response.json(
      { error: "LUCIA_ADMIN_API_KEY no está configurada en el sitio demo" },
      { status: 503 }
    );
  }

  try {
    const res = await fetch(`${API_URL}/admin${path}`, {
      ...init,
      headers: { "x-admin-key": key, "Content-Type": "application/json" },
      cache: "no-store",
    });
    const body = await res
      .json()
      .catch(() => ({ error: "Respuesta inválida del backend" }));
    return Response.json(body, { status: res.status });
  } catch {
    return Response.json(
      { error: "No se pudo contactar el backend de Lucía" },
      { status: 502 }
    );
  }
}
