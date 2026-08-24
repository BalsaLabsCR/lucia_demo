import { copilotApi } from "./copilot";

/**
 * El prompt de video de una campaña, listo para pegar en un generador.
 *
 * Vive en su propio módulo y no en `marketing.ts` porque no es una ruta del
 * plugin de marketing: el paquete de producción es agnóstico de la herramienta
 * de video a propósito, y convertirlo en un prompt es una decisión de ESTE
 * deploy. Por eso viaja por el puente del copiloto, que es donde el backend
 * monta sus rutas propias.
 */

export interface VideoPromptResponse {
  campaignId: string;
  campaignName: string;
  prompt: string;
  warnings: string[];
}

export async function fetchVideoPrompt(
  campaignId: string,
  direction?: string
): Promise<VideoPromptResponse> {
  const query = direction?.trim() ? `?direction=${encodeURIComponent(direction.trim())}` : "";
  return copilotApi<VideoPromptResponse>(
    `demo/campaigns/${encodeURIComponent(campaignId)}/video-prompt${query}`
  );
}

export interface PromptSection {
  title: string;
  body: string;
}

/**
 * Parte el prompt en sus bloques, para poder mostrarlo legible.
 *
 * El backend lo arma como bloques separados por una línea en blanco, cada uno
 * con su encabezado en mayúsculas en la primera línea. Se parte acá y no se
 * pide estructurado al servidor por una razón: lo que se copia y se pega tiene
 * que ser EXACTAMENTE el texto que se está mostrando. Si el servidor mandara un
 * objeto y la pantalla lo volviera a unir, cualquier diferencia entre las dos
 * versiones sería invisible hasta que alguien pegara la equivocada.
 *
 * Un bloque sin encabezado reconocible se muestra entero y sin título: peor es
 * esconderlo.
 */
export function parseVideoPrompt(prompt: string): PromptSection[] {
  return prompt
    .split(/\n{2,}/)
    .map((bloque) => bloque.trim())
    .filter((bloque) => bloque.length > 0)
    .map((bloque) => {
      const [primera, ...resto] = bloque.split("\n");
      const esEncabezado = /^[A-ZÁÉÍÓÚÑ0-9 ·—,'()]+$/.test(primera.trim()) && resto.length > 0;

      return esEncabezado
        ? { title: primera.trim(), body: resto.join("\n").trim() }
        : { title: "", body: bloque };
    });
}
