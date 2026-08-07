import { forwardToAdmin } from "@/lib/luciaAdmin";

/**
 * Cómo está configurado este deploy: contexto del negocio, reglas de traspaso,
 * objetivo compuesto y la estrategia activa. El panel usa la estrategia para
 * saber qué vista tiene sentido (un negocio que agenda no muestra lo mismo que
 * uno que solo capta interesados).
 */
export async function GET() {
  return forwardToAdmin("/business-context", { method: "GET" });
}
