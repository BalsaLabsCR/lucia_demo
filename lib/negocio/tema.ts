/**
 * El tema de la Sala: claro por defecto, oscuro para una sala a oscuras.
 *
 * Vive en su propio módulo por lo mismo que `dominios.ts`: el servidor tiene que
 * poder validar el `?tema=` de la URL antes de renderizar, y para eso hace falta
 * la lista en tiempo de ejecución.
 *
 * Que viaje en la URL —y no en `localStorage`— es a propósito: se puede dejar un
 * enlace preparado con el tema puesto, y recargar en medio de la charla no
 * devuelve la pantalla al otro. Es el mismo trato que `?tab=`.
 */
export const TEMAS = ["claro", "oscuro"] as const;

export type Tema = (typeof TEMAS)[number];

/**
 * Claro por defecto porque el default tiene que ser el que funciona en un
 * proyector con las luces prendidas, que es el caso normal de una charla.
 */
export const TEMA_POR_DEFECTO: Tema = "claro";

export function esTema(valor: unknown): valor is Tema {
  return typeof valor === "string" && (TEMAS as readonly string[]).includes(valor);
}
