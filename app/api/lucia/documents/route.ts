import { forwardToAdmin } from "@/lib/luciaAdmin";

/**
 * El listado de documentos: `GET /admin/documents`.
 *
 * Va en su propio archivo y no en el atrapa-todo de al lado porque `[...path]`
 * exige al menos un segmento, y el listado no tiene ninguno. Es la única razón:
 * el reenvío es el mismo.
 */
export async function GET(): Promise<Response> {
  return forwardToAdmin("/documents", { method: "GET" });
}
