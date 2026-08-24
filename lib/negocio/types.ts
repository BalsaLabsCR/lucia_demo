/**
 * Los tipos de la Sala de Operación.
 *
 * Esta pantalla es una MAQUETA: todo lo que muestra sale de `datos.ts`, un
 * archivo escrito a mano. No hay agentes corriendo, no se llama a ningún
 * modelo, no se consulta ninguna base y no depende del backend de la clínica.
 * Lo que se demuestra es cómo SE VERÍA un negocio operado con IA como capa
 * central, no un producto terminado.
 *
 * Por qué existen estos tipos si nada de esto viaja por la red: porque el
 * riesgo de una maqueta no es que se caiga, es que se CONTRADIGA en vivo —que
 * una pestaña diga 57% de agenda y otra 64%—. Un tipo cerrado no evita eso
 * solo, pero convierte media contradicción (un campo mal escrito, una métrica
 * sin fuente) en un error de compilación en vez de un descubrimiento arriba
 * del escenario.
 */

import type { DOMINIOS } from "./dominios";

export type DominioId = (typeof DOMINIOS)[number];

/** Cuán urgente es algo. Ordena el color, no el tamaño. */
export type Severidad = "ok" | "atencion" | "critico";

/**
 * Un agente del equipo.
 *
 * `lee` es el campo que hace el trabajo pesado de la charla: enumera fuentes
 * que en una pyme viven en cuatro archivos distintos y que nadie cruza. Es lo
 * que separa "un asistente" de "una capa operativa".
 */
export interface Agente {
  id: DominioId;
  nombre: string;
  /** Qué vigila, en media línea. */
  vigila: string;
  /** De dónde saca los datos. Ver arriba: es lo que más vende. */
  lee: string[];
  /** Hace cuántos minutos "revisó". Distinto en cada agente a propósito. */
  revisadoHaceMin: number;
  /** Cuántos pasos dio en su revisión. Alimenta la animación del roster. */
  pasos: number;
  /** El titular de una línea que sale en la tarjeta del roster. */
  titular: string;
  estado: Severidad;
  /**
   * A dónde lleva la tarjeta cuando el agente NO tiene pestaña propia.
   *
   * El de Marketing es el caso: su trabajo ya tiene su propio módulo en el
   * sitio, y mandarlo ahí desde el roster dice algo que ninguna pestaña nueva
   * diría igual de bien — que el sistema es más grande que estas seis
   * pantallas.
   */
  enlace?: string;
}

export type Unidad = "colones" | "porcentaje" | "cantidad" | "minutos" | "horas";

/**
 * Un número del panel, con su comparación y su procedencia.
 *
 * `fuente` no es decorativo: quien mira la pantalla tiene que poder preguntar
 * "¿de dónde sacaste eso?" y encontrar la respuesta en la misma tarjeta. Es la
 * diferencia entre un panel y un adorno, y en una demostración es también lo
 * que impide que el público sospeche que los números son un fondo de pantalla.
 *
 * `menosEsMejor` existe porque el color sigue el SIGNIFICADO y no el signo: que
 * suban los gastos o el tiempo de respuesta no se pinta de verde.
 */
export interface Metrica {
  label: string;
  valor: number;
  /** El mismo número el mes pasado. `null` cuando no hay con qué comparar. */
  antes: number | null;
  unidad: Unidad;
  menosEsMejor?: boolean;
  fuente: string;
  /** Una aclaración corta que va debajo del número. */
  nota?: string;
  /**
   * Los últimos meses, para la línea chiquita dentro de la tarjeta.
   *
   * Un número contra el mes anterior dice si subió; la línea dice si esto viene
   * pasando. Son preguntas distintas y un gerente hace la segunda apenas ve la
   * primera — sin la serie hay que creerle al panel que "bajó", con la serie se
   * ve si bajó o si volvió a lo de siempre.
   */
  serie?: number[];
}

/**
 * Las gráficas: la capa de BI de la pantalla.
 *
 * Es lo que un negocio ya tiene, o querría tener, en Power BI o en un Looker
 * Studio: series de tiempo, columnas, un mapa de calor de la agenda. Existe
 * porque el argumento de la demostración necesita las dos mitades — primero el
 * tablero que el gerente reconoce, y encima la lectura que ninguna herramienta
 * de BI le da. Sin la primera mitad, la segunda parece magia; con ella, parece
 * el paso siguiente.
 */

export interface Serie {
  nombre: string;
  puntos: number[];
  /**
   * Trazo punteado y apagado: es una referencia, no una medición.
   *
   * Se usa para metas y umbrales —el 40% de planilla sobre ingresos que fija el
   * plan de negocio, por ejemplo—. Dibujarlos igual que los datos haría que se
   * lean como algo que pasó.
   */
  referencia?: boolean;
}

export interface GraficaSerie {
  titulo: string;
  /** Una etiqueta por punto: "Jul 25", "Ago 26". */
  etiquetas: string[];
  unidad: Unidad;
  series: Serie[];
  /** Una marca vertical con su explicación: "acá pasó algo". */
  marca?: { indice: number; texto: string };
  pie?: string;
}

export interface GraficaColumnas {
  titulo: string;
  unidad: Unidad;
  columnas: { etiqueta: string; valor: number; destacada?: boolean }[];
  pie?: string;
}

/**
 * La agenda por día y franja horaria.
 *
 * Es la gráfica que más trabajo hace de toda la Sala: un 57% mensual esconde
 * martes llenos y jueves vacíos, y el mapa los muestra de un vistazo. Además es
 * la prueba visual del cruce con Planilla — el sábado se ve casi vacío en la
 * misma pantalla donde se pagaron 32 horas extra de sábado.
 *
 * `null` es cerrado, que no es lo mismo que vacío y no se puede pintar igual.
 */
export interface MapaCalor {
  titulo: string;
  dias: string[];
  franjas: string[];
  /** `valores[franja][día]`, de 0 a 1. `null` = cerrado. */
  valores: (number | null)[][];
  pie?: string;
}

export interface FilaBarra {
  etiqueta: string;
  valor: number;
  /** Cuando hay total, la barra es una proporción y se muestra "valor/total". */
  total?: number;
  nota?: string;
  destacada?: boolean;
}

export interface Barras {
  titulo: string;
  filas: FilaBarra[];
  /** Qué se está contando, para el pie de la sección. */
  pie?: string;
}

export interface FilaTabla {
  celdas: string[];
  destacada?: boolean;
}

export interface Tabla {
  titulo: string;
  columnas: string[];
  filas: FilaTabla[];
  pie?: string;
}

/**
 * Dónde está parado el negocio contra lo que cobra la competencia.
 *
 * Cada observación lleva fecha y fuente. Es inventado como todo lo demás, pero
 * esa forma —"observado el 12 de agosto en el perfil de Instagram"— es
 * exactamente lo que hace que se lea como investigación y no como opinión.
 */
export interface Rango {
  titulo: string;
  nuestraEtiqueta: string;
  nuestroValor: number;
  observaciones: { nombre: string; valor: number; fecha: string; fuente: string }[];
  nota: string;
}

/** Un paso de la revisión. Texto escrito a mano; no es el log de nada. */
export interface PasoTraza {
  paso: string;
  detalle: string;
}

export interface Evidencia {
  etiqueta: string;
  valor: string;
  fuente: string;
}

/**
 * Un hallazgo: la unidad de contenido de toda la pantalla.
 *
 * Los cuatro campos que hacen que se lea como producido por una IA y no como
 * una fila de una tabla:
 *
 *   - `cuerpo` lleva SIEMPRE número, comparación y causa. Un número sin causa
 *     es un reporte; una causa sin número es una opinión.
 *   - `descarte` dice qué consideró y por qué lo dejó afuera. Un agente que
 *     solo concluye parece un generador de frases; uno que descarta parece que
 *     pensó.
 *   - `supuestos` y `limitaciones` son obligatorios y van ARRIBA de cualquier
 *     botón. El hallazgo que admite lo que no sabe es el que hace creíbles a
 *     los otros cinco.
 *   - `traza` se despliega bajo "cómo llegué acá". Es lo que mueve al que mira
 *     de "la IA opina" a "la IA revisó mis datos".
 */
export interface Hallazgo {
  id: string;
  /** Qué agente lo firma. Sale en el rótulo de la tarjeta. */
  agente: string;
  titulo: string;
  cuerpo: string;
  descarte: string | null;
  /** De 0 a 1. Se muestra en palabras y en número. */
  confianza: number;
  supuestos: string[];
  limitaciones: string[];
  evidencia: Evidencia[];
  traza: PasoTraza[];
  severidad: Severidad;
}

/**
 * Algo que el sistema propone hacer.
 *
 * Aprobar y ejecutar son dos pasos distintos y eso no es burocracia de la
 * maqueta: es el argumento. Un panel donde aprobar YA crea la campaña le está
 * diciendo al gerente que la IA decide. Acá decide él, dos veces.
 *
 * `queHace` se muestra ANTES del botón, no después: es justamente lo que hay
 * que haber leído para poder aprobar.
 */
export interface Propuesta {
  id: string;
  titulo: string;
  detalle: string;
  /** Qué pasa si se ejecuta. Va arriba del botón. */
  queHace: string;
  /** Lo que se muestra una vez ejecutada. */
  alEjecutar: string;
  /** A dónde llevar después, si hay a dónde. */
  irA?: { href: string; texto: string };
}

/**
 * La conclusión cruzada: la razón de ser de la demostración.
 *
 * Es una conclusión a la que NINGÚN agente llega solo, y por eso se muestra
 * como una cadena con el nombre de quién aportó cada eslabón. Sin los nombres
 * es un párrafo más; con los nombres es la prueba de que las áreas se hablan.
 */
export interface Coordinacion {
  titulo: string;
  bajada: string;
  eslabones: { agente: string; texto: string }[];
  cierre: string;
  supuestos: string[];
  limitaciones: string[];
  propuestas: Propuesta[];
}

/** El contenido de una pestaña de área. */
export interface Pestana {
  id: DominioId;
  metricas: Metrica[];
  /** La capa de BI, en el orden en que se pinta. */
  serie?: GraficaSerie;
  columnas?: GraficaColumnas;
  mapa?: MapaCalor;
  barras?: Barras;
  tabla?: Tabla;
  rango?: Rango;
  /** La capa de IA: lo que un tablero no da. */
  hallazgos: Hallazgo[];
  propuestas: Propuesta[];
}

export interface Negocio {
  meta: {
    nombre: string;
    periodo: string;
    periodoAnterior: string;
    moneda: string;
  };
  agentes: Agente[];
  /** Los cuatro números grandes de Dirección. */
  titulares: Metrica[];
  /** Ingresos contra gastos, el gráfico de portada del negocio. */
  serieGeneral: GraficaSerie;
  /** De dónde sale la plata del mes. */
  ingresoPorServicio: GraficaColumnas;
  coordinacion: Coordinacion;
  pestanas: Record<Exclude<DominioId, "direccion" | "documentos">, Pestana>;
}
