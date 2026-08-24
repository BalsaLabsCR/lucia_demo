/**
 * Las seis pestañas de la Sala, en el orden en que se muestran.
 *
 * Vive en su propio módulo y no en `types.ts` porque es un valor de tiempo de
 * ejecución: el servidor lo usa para validar el `?tab=` que venga en la URL
 * antes de renderizar. `types.ts` se queda con puros tipos, que es lo que
 * declara su nombre y lo que espera quien lo abre.
 *
 * El orden importa dos veces: es el orden de las pestañas en pantalla y es el
 * que mapea las teclas 1 a 6.
 */
export const DOMINIOS = [
  "direccion",
  "ventas",
  "operacion",
  "planilla",
  "mercado",
  "documentos",
] as const;

export type Dominio = (typeof DOMINIOS)[number];

export const ETIQUETAS: Record<Dominio, string> = {
  direccion: "Dirección",
  ventas: "Ventas",
  operacion: "Operación",
  planilla: "Planilla",
  mercado: "Mercado",
  documentos: "Documentos",
};

export function esDominio(valor: unknown): valor is Dominio {
  return typeof valor === "string" && (DOMINIOS as readonly string[]).includes(valor);
}
