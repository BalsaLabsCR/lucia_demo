import type { Metrica, Severidad, Unidad } from "./types";

/**
 * Cómo se escriben los números de la Sala de Operación.
 *
 * Los miles se agrupan a mano y no con `toLocaleString`: el ICU de Node y el
 * del navegador no coinciden —Node devuelve espacios finos donde el navegador
 * pone puntos— y en una página que se renderiza en el servidor y se hidrata en
 * el cliente eso es una diferencia de HTML entre los dos, o sea un aviso de
 * hidratación y un número que parpadea al cargar. En una pantalla proyectada,
 * un número que parpadea es lo primero que ve la sala.
 */
export function miles(valor: number): string {
  const entero = Math.round(Math.abs(valor)).toString();
  const conPuntos = entero.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return valor < 0 ? `-${conPuntos}` : conPuntos;
}

/**
 * Un decimal con coma, sin arrastrar el `,0` cuando no hace falta.
 *
 * La coma no es un capricho local: en la misma pantalla conviven "47,5%" y la
 * variación de esa métrica, y si una usa coma y la otra el punto que pone
 * JavaScript por defecto, el panel se ve armado con dos criterios. Es de las
 * cosas que nadie sabe nombrar y todo el mundo nota.
 */
export function decimal(valor: number): string {
  const redondeado = Math.round(valor * 10) / 10;
  return Number.isInteger(redondeado)
    ? miles(redondeado)
    : `${miles(Math.trunc(redondeado))},${Math.abs(Math.round(redondeado * 10) % 10)}`;
}

export function formatear(valor: number, unidad: Unidad): string {
  switch (unidad) {
    case "colones":
      return `₡${miles(valor)}`;
    case "porcentaje":
      return `${decimal(valor)}%`;
    case "minutos":
      return `${decimal(valor)} min`;
    case "horas":
      return `${miles(valor)} h`;
    default:
      return decimal(valor);
  }
}

export type Tendencia = "sube-bien" | "sube-mal" | "baja-bien" | "baja-mal" | "plana" | "sin-dato";

/**
 * Hacia dónde se mueve una métrica y si eso es bueno.
 *
 * "Bueno" depende de la métrica: que suba el gasto o el tiempo de respuesta es
 * malo, que suba el ingreso es bueno. Sin esta distinción, el panel pintaría de
 * verde una subida de costos — y en una charla sobre control del negocio, ese
 * error se nota desde la última fila.
 */
export function tendencia(metrica: Metrica): Tendencia {
  if (metrica.antes === null || metrica.antes === 0) return "sin-dato";
  const cambio = ((metrica.valor - metrica.antes) / Math.abs(metrica.antes)) * 100;
  if (Math.abs(cambio) < 0.5) return "plana";
  const sube = cambio > 0;
  if (sube) return metrica.menosEsMejor ? "sube-mal" : "sube-bien";
  return metrica.menosEsMejor ? "baja-bien" : "baja-mal";
}

/**
 * Cuánto se movió una métrica, ya escrito.
 *
 * Las que YA son un porcentaje se comparan en **puntos porcentuales** y no en
 * porcentaje del porcentaje. Que la planilla pasara de 37,2% a 47,5% de los
 * ingresos es "10,3 puntos más", no "27,7% más": lo segundo es cierto,
 * incomprensible, y encima suena a menos de lo que es. En un panel que se
 * proyecta ante gerentes, ese matiz decide si el número asusta o se ignora.
 */
export function variacion(metrica: Metrica): string | null {
  if (metrica.antes === null || metrica.antes === 0) return null;

  if (metrica.unidad === "porcentaje") {
    return `${decimal(Math.abs(metrica.valor - metrica.antes))} pp`;
  }

  const relativa = Math.round(((metrica.valor - metrica.antes) / Math.abs(metrica.antes)) * 1000) / 10;
  return `${decimal(Math.abs(relativa))}%`;
}

export function flecha(t: Tendencia): string {
  if (t === "plana") return "→";
  if (t === "sin-dato") return "";
  return t.startsWith("sube") ? "↑" : "↓";
}

/** La confianza en palabras. Un 0,72 no le dice nada a nadie. */
export function confianzaEnPalabras(confianza: number): string {
  if (confianza >= 0.8) return "Alta";
  if (confianza >= 0.6) return "Media";
  return "Baja";
}

/**
 * La severidad, en tres niveles de brillo.
 *
 * En una pantalla sin color la jerarquía la lleva la luminosidad, y por eso va
 * al revés de lo que uno escribiría primero: lo crítico es BLANCO —lo que
 * arranca la mirada— y lo que está en orden queda en gris apagado, porque no
 * hay nada que mirar ahí. Ver el chip en `ui.tsx`: lo crítico además se invierte
 * (fondo blanco, letra negra), que es lo único que pega más fuerte que el
 * blanco sobre negro.
 */
export const COLOR_SEVERIDAD: Record<Severidad, { texto: string; borde: string; punto: string }> = {
  ok: { texto: "text-sala-tx2", borde: "border-sala-bd", punto: "bg-sala-tx3" },
  atencion: { texto: "text-sala-alerta", borde: "border-sala-bd", punto: "bg-sala-alerta" },
  critico: { texto: "text-sala-tx", borde: "border-sala-tx/30", punto: "bg-sala-tx" },
};

export const ETIQUETA_SEVERIDAD: Record<Severidad, string> = {
  ok: "En orden",
  atencion: "Atender",
  critico: "Urgente",
};
