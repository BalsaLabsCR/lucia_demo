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

/**
 * Reenvía y devuelve el CUERPO BINARIO tal cual, para archivos.
 *
 * Va aparte del reenvío JSON porque una imagen no se puede leer con `.json()`.
 * Es lo que le permite al panel mostrar material privado: el navegador pide una
 * URL de este sitio, el servidor de Next le pone la llave del panel, y el archivo
 * llega sin que exista ninguna URL pública ni firmada dando vueltas.
 */
export async function forwardFileToAdmin(path: string): Promise<Response> {
  const key = process.env.LUCIA_ADMIN_API_KEY;
  if (!key) {
    return Response.json(
      { error: "LUCIA_ADMIN_API_KEY no está configurada en el sitio demo" },
      { status: 503 }
    );
  }

  try {
    const res = await fetch(`${API_URL}/admin${path}`, {
      headers: { "x-admin-key": key },
      cache: "no-store",
    });

    if (!res.ok || !res.body) {
      return Response.json(
        { error: `El backend respondió ${res.status} al pedir el archivo` },
        { status: res.status === 404 ? 404 : 502 }
      );
    }

    return new Response(res.body, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("content-type") ?? "application/octet-stream",
        // Se repiten las defensas del backend: nada de reinterpretar el archivo
        // y nada de cachés compartidas para material sin publicar.
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch {
    return Response.json({ error: "No se pudo contactar el backend de Lucía" }, { status: 502 });
  }
}

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
