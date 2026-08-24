import type { Negocio } from "./types";

/**
 * TODA la Sala de Operación, en un archivo. DATOS FICTICIOS.
 *
 * No hay agentes, no hay modelo, no hay base de datos. Esta pantalla lee este
 * objeto y lo pinta. Cambiar la demostración es editar este archivo.
 *
 * La regla que sostiene todo: **los números tienen que cerrar entre pestañas.**
 * La única forma realista de que esta demostración se caiga en vivo es que
 * Planilla diga "la agenda está al 57%" y Operación muestre 64%, o que la suma
 * de los servicios no dé el ingreso del mes. Por eso:
 *
 *   - las cifras base se declaran UNA vez (abajo) y el resto se deriva;
 *   - los servicios suman exactamente el ingreso del período;
 *   - los cupos suman exactamente la capacidad, y el uso de agenda sale de esa
 *     división y no de un número escrito aparte.
 *
 * Y la otra regla, la de escritura: cada hallazgo lleva número, comparación y
 * causa; dice qué descartó; y declara sus supuestos y sus límites. Ver
 * `types.ts` para el porqué de cada uno.
 */

// ---------------------------------------------------------------------------
// Las cifras base. Todo lo demás se deriva de acá.
// ---------------------------------------------------------------------------

const INGRESOS = 12_290_000;
const INGRESOS_ANTES = 15_240_000;
const GASTOS = 10_180_000;
const GASTOS_ANTES = 10_050_000;

/** Cada servicio con sus citas, sus cupos, sus consultas y su ingreso. */
const SERVICIOS = [
  { nombre: "Valoración inicial", citas: 34, cupos: 60, antes: 45, consultas: 52, ingreso: 510_000 },
  { nombre: "Limpieza dental", citas: 48, cupos: 80, antes: 60, consultas: 70, ingreso: 1_680_000 },
  { nombre: "Calzas y resinas", citas: 48, cupos: 80, antes: 52, consultas: 55, ingreso: 2_160_000 },
  { nombre: "Blanqueamiento", citas: 7, cupos: 24, antes: 17, consultas: 24, ingreso: 910_000 },
  { nombre: "Ortodoncia", citas: 19, cupos: 30, antes: 21, consultas: 24, ingreso: 2_755_000 },
  { nombre: "Endodoncia", citas: 11, cupos: 20, antes: 12, consultas: 16, ingreso: 2_035_000 },
  { nombre: "Coronas y prótesis", citas: 7, cupos: 12, antes: 8, consultas: 9, ingreso: 2_240_000 },
];

const CITAS = SERVICIOS.reduce((t, s) => t + s.citas, 0); // 174
const CUPOS = SERVICIOS.reduce((t, s) => t + s.cupos, 0); // 306
const CITAS_ANTES = SERVICIOS.reduce((t, s) => t + s.antes, 0); // 215

/** Uso de agenda: se CALCULA. Nunca se escribe a mano en dos lugares. */
const USO_AGENDA = redondear((CITAS / CUPOS) * 100); // 56,86
const USO_AGENDA_ANTES = redondear((CITAS_ANTES / CUPOS) * 100); // 70,26

const LEADS = 71;
const LEADS_ANTES = 94;
const CONVERTIDOS = 26;
const CONVERTIDOS_ANTES = 42;
const CONVERSION = redondear((CONVERTIDOS / LEADS) * 100); // 36,62
const CONVERSION_ANTES = redondear((CONVERTIDOS_ANTES / LEADS_ANTES) * 100); // 44,68

/** Planilla. La carga patronal de Costa Rica, aplicada al bruto. */
const CARGA_PATRONAL = 0.2667;
const SALARIOS = 4_260_000;
const EXTRAS = 347_000;
const EXTRAS_ANTES = 212_000;
const BRUTO = SALARIOS + EXTRAS; // 4.607.000
const BRUTO_ANTES = SALARIOS + EXTRAS_ANTES; // 4.472.000
const CARGAS = Math.round(BRUTO * CARGA_PATRONAL); // 1.228.687 → 1.228.687
const CARGAS_ANTES = Math.round(BRUTO_ANTES * CARGA_PATRONAL);
const PLANILLA = BRUTO + CARGAS;
const PLANILLA_ANTES = BRUTO_ANTES + CARGAS_ANTES;
const PLANILLA_SOBRE_INGRESOS = redondear((PLANILLA / INGRESOS) * 100); // 47,5
const PLANILLA_SOBRE_INGRESOS_ANTES = redondear((PLANILLA_ANTES / INGRESOS_ANTES) * 100); // 37,2

/** Blanqueamiento: el servicio del relato. */
const BLANQ = SERVICIOS.find((s) => s.nombre === "Blanqueamiento")!;
const BLANQ_CIERRE = redondear((BLANQ.citas / BLANQ.consultas) * 100); // 29,17
const BLANQ_CIERRE_ANTES = 68; // 17 de 25 consultas el mes pasado
const BLANQ_PRECIO = 130_000;
const BLANQ_MEDIANA_MERCADO = 118_000;

/** La campaña de mayo, que sigue viva en los números del mes. */
const CAMPANA = { gasto: 320_000, interesados: 34, cierres: 2 };
const COSTO_POR_CITA = Math.round(CAMPANA.gasto / CAMPANA.cierres); // 160.000

function redondear(n: number): number {
  return Math.round(n * 10) / 10;
}

// ---------------------------------------------------------------------------
// Las series mensuales. La capa de BI se dibuja de acá.
// ---------------------------------------------------------------------------

/**
 * Catorce meses, de julio del 25 a agosto del 26.
 *
 * Van catorce y no doce a propósito: incluyen el julio y el agosto del año
 * pasado, así que la caída de este agosto se puede comparar contra el MISMO mes
 * del año anterior y no solo contra el mes de al lado. Es la comparación que un
 * gerente hace apenas ve el número, y es también lo que le da sentido al
 * hallazgo que descarta la estacionalidad: en el gráfico se ve que agosto
 * siempre baja, y se ve que este bajó mucho más.
 *
 * El último valor de cada serie es, por construcción, la cifra del mes que
 * muestra el panel. Si se cambia una, hay que cambiar la otra.
 */
const MESES = [
  "Jul 25", "Ago 25", "Sep 25", "Oct 25", "Nov 25", "Dic 25", "Ene 26",
  "Feb 26", "Mar 26", "Abr 26", "May 26", "Jun 26", "Jul 26", "Ago 26",
];

const INGRESOS_MES = [
  14_200_000, 13_100_000, 14_800_000, 15_600_000, 17_200_000, 18_400_000, 13_900_000,
  14_600_000, 15_800_000, 16_400_000, 17_100_000, 16_800_000, INGRESOS_ANTES, INGRESOS,
];

const GASTOS_MES = [
  9_600_000, 9_500_000, 9_700_000, 9_900_000, 10_400_000, 11_200_000, 9_800_000,
  9_700_000, 9_900_000, 10_000_000, 10_200_000, 10_100_000, GASTOS_ANTES, GASTOS,
];

const MARGEN_MES = INGRESOS_MES.map((ingreso, i) => ingreso - GASTOS_MES[i]);

const USO_AGENDA_MES = [
  68.2, 63.5, 69.8, 71.4, 76.2, 79.1, 64.8, 67.2, 71.9, 73.5, 76.8, 74.9,
  USO_AGENDA_ANTES, USO_AGENDA,
];

const CONVERSION_MES = [
  41.2, 39.8, 42.6, 43.4, 45.9, 46.8, 40.1, 41.8, 43.1, 44.8, 45.2, 43.9,
  CONVERSION_ANTES, CONVERSION,
];

const PLANILLA_SOBRE_INGRESOS_MES = [
  35.9, 38.4, 36.1, 34.8, 32.6, 38.2, 39.4, 37.9, 35.7, 34.6, 33.4, 34.1,
  PLANILLA_SOBRE_INGRESOS_ANTES, PLANILLA_SOBRE_INGRESOS,
];

const LEADS_MES = [
  88, 79, 86, 91, 103, 112, 82, 87, 93, 98, 104, 99, LEADS_ANTES, LEADS,
];

/**
 * El costo de planilla mes a mes, DERIVADO del porcentaje y de los ingresos.
 *
 * Se calcula en vez de escribirse para que no pueda contradecir a la serie de
 * al lado: si alguien toca un ingreso, la planilla lo sigue sola. Es la misma
 * regla que sostiene todo este archivo.
 */
const PLANILLA_MES = PLANILLA_SOBRE_INGRESOS_MES.map((porcentaje, i) =>
  Math.round((porcentaje / 100) * INGRESOS_MES[i])
);

/** El techo que fija el plan de negocio 2026. Se dibuja punteado. */
const TECHO_PLANILLA = 40;

/** Los últimos doce, para las líneas chiquitas de las tarjetas. */
const ultimos12 = (serie: number[]): number[] => serie.slice(-12);

// ---------------------------------------------------------------------------
// El negocio.
// ---------------------------------------------------------------------------

export const NEGOCIO: Negocio = {
  meta: {
    nombre: "Clínica Dental Sonrisa Pura",
    periodo: "Agosto 2026",
    periodoAnterior: "Julio 2026",
    moneda: "₡",
  },

  /*
   * Los seis agentes. Los minutos de "revisado hace" son distintos a propósito:
   * seis tarjetas que dicen todas "hace 5 min" se leen como una plantilla, y el
   * público lo percibe aunque no sepa nombrarlo.
   */
  agentes: [
    {
      id: "ventas",
      nombre: "Agente de Ventas",
      vigila: "Interesados, cierre y objeciones",
      lee: ["conversaciones de WhatsApp y web", "interesados", "citas", "precios"],
      revisadoHaceMin: 7,
      pasos: 5,
      titular: `El cierre de blanqueamiento cayó de ${pct(BLANQ_CIERRE_ANTES)} a ${pct(BLANQ_CIERRE)}.`,
      estado: "critico",
    },
    {
      id: "operacion",
      nombre: "Agente de Operación",
      vigila: "Agenda, cupos, cancelaciones y respuesta",
      lee: ["calendario", "citas", "horario del negocio", "ausencias del equipo"],
      revisadoHaceMin: 4,
      pasos: 4,
      titular: `Quedaron ${CUPOS - CITAS} cupos sin usar. La capacidad está.`,
      estado: "atencion",
    },
    {
      id: "planilla",
      nombre: "Agente de Planilla",
      vigila: "Costo laboral, cargas, provisiones y ausencias",
      lee: ["planilla", "marcas de asistencia", "agenda", "reglamento interno"],
      revisadoHaceMin: 3,
      pasos: 6,
      titular: `La planilla pasó a ${pct(PLANILLA_SOBRE_INGRESOS)} de los ingresos.`,
      estado: "critico",
    },
    {
      id: "mercado",
      nombre: "Agente de Mercado",
      vigila: "Precios de la zona, qué anuncian, reseñas",
      lee: ["observaciones de competencia", "precios propios", "objeciones"],
      revisadoHaceMin: 21,
      pasos: 4,
      titular: "Estás 10% arriba de la mediana de Escazú.",
      estado: "atencion",
    },
    {
      id: "direccion",
      nombre: "Agente de Marketing",
      vigila: "Campañas activas, costo por cita, mensaje",
      lee: ["campañas", "interesados por fuente", "citas atribuidas"],
      revisadoHaceMin: 12,
      pasos: 3,
      titular: `Cada cita de mayo costó ${moneda(COSTO_POR_CITA)} en pauta.`,
      estado: "critico",
      // No tiene pestaña: su trabajo ya vive en el módulo de Marketing del
      // sitio. Mandarlo ahí desde el roster dice que el sistema es más grande
      // que estas seis pantallas.
      enlace: "/lucia/marketing",
    },
    {
      id: "documentos",
      nombre: "Agente de Documentos",
      vigila: "Contratos, reglamentos, CVs y políticas",
      lee: ["7 documentos de la empresa"],
      revisadoHaceMin: 9,
      pasos: 3,
      titular: "Listo para responder sobre los documentos cargados.",
      estado: "ok",
    },
  ],

  titulares: [
    {
      label: "Ingresos",
      valor: INGRESOS,
      antes: INGRESOS_ANTES,
      unidad: "colones",
      fuente: "suma de los 7 servicios del mes",
      serie: ultimos12(INGRESOS_MES),
    },
    {
      label: "Margen estimado",
      valor: INGRESOS - GASTOS,
      antes: INGRESOS_ANTES - GASTOS_ANTES,
      unidad: "colones",
      fuente: "ingresos − gastos",
      serie: ultimos12(MARGEN_MES),
    },
    {
      label: "Uso de la agenda",
      valor: USO_AGENDA,
      antes: USO_AGENDA_ANTES,
      unidad: "porcentaje",
      fuente: `${CITAS} citas de ${CUPOS} cupos`,
      serie: ultimos12(USO_AGENDA_MES),
    },
    {
      label: "Conversión de interesados",
      valor: CONVERSION,
      antes: CONVERSION_ANTES,
      unidad: "porcentaje",
      fuente: `${CONVERTIDOS} de ${LEADS} interesados`,
      serie: ultimos12(CONVERSION_MES),
    },
  ],

  /*
   * El gráfico de portada: ingresos contra gastos, catorce meses.
   *
   * Es el que un negocio ya reconoce —lo tiene igual en su Power BI, o querría
   * tenerlo— y por eso va primero. Todo lo que la IA dice después se apoya en
   * este dibujo: la caída de agosto se ve, la estacionalidad se ve, y que los
   * gastos no acompañaron también.
   */
  serieGeneral: {
    titulo: "Ingresos y gastos · últimos 14 meses",
    etiquetas: MESES,
    unidad: "colones",
    series: [
      { nombre: "Ingresos", puntos: INGRESOS_MES },
      { nombre: "Gastos", puntos: GASTOS_MES },
    ],
    marca: { indice: 5, texto: "aguinaldo" },
    pie:
      "Agosto siempre es de los meses bajos —se ve en agosto del 25— pero este bajó 19,4% " +
      "contra julio, más del doble de lo que bajó el año pasado. Los gastos, en cambio, " +
      "siguieron planos: el problema es de ingresos, no de costos.",
  },

  ingresoPorServicio: {
    titulo: "De dónde salió el ingreso de agosto",
    unidad: "colones",
    columnas: SERVICIOS.map((servicio) => ({
      etiqueta: servicio.nombre,
      valor: servicio.ingreso,
      destacada: servicio.nombre === "Blanqueamiento",
    })),
    pie: `Los 7 servicios suman ${moneda(INGRESOS)}, el ingreso del mes.`,
  },

  // -------------------------------------------------------------------------
  // La conclusión cruzada. La razón de ser de la pantalla.
  // -------------------------------------------------------------------------
  coordinacion: {
    titulo: "Blanqueamiento: el problema no es el precio",
    bajada:
      "Cuatro agentes miraron lo suyo y las cuatro piezas dicen lo mismo. " +
      "Ninguno de los cuatro llega a esto por su cuenta.",
    eslabones: [
      {
        agente: "Ventas",
        texto: `${BLANQ.consultas} personas preguntaron por blanqueamiento y ${BLANQ.citas} agendaron. El mes pasado fueron 17 de 25. La demanda sigue; se cayó el cierre.`,
      },
      {
        agente: "Mercado",
        texto: `El precio está ${moneda(BLANQ_PRECIO - BLANQ_MEDIANA_MERCADO)} arriba de la mediana de Escazú — pero solo 9 de las ${BLANQ.consultas} conversaciones mencionaron precio. 14 mencionaron miedo a la sensibilidad.`,
      },
      {
        agente: "Marketing",
        texto: `La campaña de mayo gastó ${moneda(CAMPANA.gasto)} y cerró ${CAMPANA.cierres} de ${CAMPANA.interesados}. El anuncio hablaba de precio. Cada cita costó ${moneda(COSTO_POR_CITA)} y el servicio se vende a ${moneda(BLANQ_PRECIO)}.`,
      },
      {
        agente: "Operación",
        texto: `Hay ${BLANQ.cupos - BLANQ.citas} cupos de blanqueamiento libres este mes. La capacidad para atender la demanda que ya existe está disponible.`,
      },
    ],
    cierre:
      "Bajar el precio atacaría la objeción número dos y regalaría margen en la " +
      "número uno. La clínica tiene un protocolo desensibilizante y no lo menciona " +
      "en ninguna parte: ni en la campaña, ni en el sitio, ni en las conversaciones.",
    supuestos: [
      "Que las etiquetas de objeción reflejan lo que la persona realmente pensó: las asigna Lucía al clasificar la conversación, no la persona.",
      "Que el precio observado de las otras clínicas es el que cobran y no un precio de lista con descuentos.",
    ],
    limitaciones: [
      "No puedo afirmar que bajar el precio no aumentaría las citas: no hay ninguna prueba con precio distinto en estos datos.",
      "Cuatro competidores no son el mercado de Escazú. Son los cuatro que se pudieron observar.",
    ],
    propuestas: [
      {
        id: "brief-sensibilidad",
        titulo: "Campaña centrada en el protocolo desensibilizante",
        detalle:
          "Pieza para Instagram y Facebook que responde la objeción de sensibilidad " +
          "con el protocolo que la clínica ya usa. Sin descuento.",
        queHace: "Crea una campaña en BORRADOR en el módulo de Marketing. No publica nada.",
        alEjecutar: "Campaña «Blanqueamiento sin sensibilidad» creada en borrador.",
        irA: { href: "/lucia/marketing", texto: "Abrir el estudio de marketing" },
      },
      {
        id: "directiva-sensibilidad",
        titulo: "Directiva para Lucía en las conversaciones",
        detalle:
          "Cuando alguien pregunte por blanqueamiento y mencione sensibilidad, " +
          "explicar el protocolo ANTES de dar el precio. Vence en 30 días.",
        queHace:
          "Le da a Lucía una indicación temporal que solo usa cuando el cliente muestra esa necesidad. No le da herramientas nuevas.",
        alEjecutar: "Directiva activa · vence en 30 días · Lucía ya la está aplicando.",
        irA: { href: "/lucia/chats", texto: "Ver las conversaciones" },
      },
      {
        id: "tarea-sabado",
        titulo: "Revisar el turno de recepción del sábado",
        detalle:
          "32 de las 52 horas extra del mes son de sábado, el día con menos citas confirmadas.",
        queHace: "Deja anotada una tarea para el equipo, con fecha.",
        alEjecutar: "Tarea creada para el 22 de agosto · asignada a Administración.",
      },
    ],
  },

  pestanas: {
    // -----------------------------------------------------------------------
    // VENTAS
    // -----------------------------------------------------------------------
    ventas: {
      id: "ventas",
      metricas: [
        {
          label: "Interesados recibidos",
          valor: LEADS,
          antes: LEADS_ANTES,
          unidad: "cantidad",
          fuente: "interesados registrados en agosto",
          serie: ultimos12(LEADS_MES),
        },
        {
          label: "Conversión",
          valor: CONVERSION,
          antes: CONVERSION_ANTES,
          unidad: "porcentaje",
          fuente: `${CONVERTIDOS} de ${LEADS} interesados`,
          serie: ultimos12(CONVERSION_MES),
        },
        {
          label: "Conversaciones",
          valor: 98,
          antes: 121,
          unidad: "cantidad",
          fuente: "WhatsApp + chat del sitio",
          nota: "11 quedaron sin cerrar",
        },
        {
          label: "Tiempo de respuesta",
          valor: 6,
          antes: 5,
          unidad: "minutos",
          menosEsMejor: true,
          fuente: "promedio hasta la primera respuesta",
        },
      ],
      /*
       * La gráfica más importante de toda la Sala.
       *
       * Dos líneas sobre el mismo servicio: cuánta gente preguntó y cuánta
       * agendó. Se ve que la de arriba no se movió y la de abajo se desplomó, y
       * eso es literalmente el argumento del mes — la demanda está, el cierre
       * se rompió. Un número solo no lo puede decir; dos líneas sí.
       */
      serie: {
        titulo: "Blanqueamiento · consultas contra citas",
        etiquetas: ["Mar", "Abr", "May", "Jun", "Jul", "Ago"],
        unidad: "cantidad",
        series: [
          { nombre: "Consultas", puntos: [26, 24, 25, 27, 25, BLANQ.consultas] },
          { nombre: "Citas agendadas", puntos: [18, 17, 17, 18, 17, BLANQ.citas] },
        ],
        pie:
          "Las consultas están planas desde marzo. Las citas se cayeron solo en agosto. " +
          "La distancia entre las dos líneas es lo que se está perdiendo.",
      },
      barras: {
        titulo: "Qué frenó a la gente este mes",
        pie: "28 objeciones registradas en 24 conversaciones de blanqueamiento. Algunas mencionaron más de una.",
        filas: [
          { etiqueta: "Miedo a que le dé sensibilidad", valor: 14, destacada: true },
          { etiqueta: "Le parece caro", valor: 9 },
          { etiqueta: "No sabe cuánto dura el resultado", valor: 5 },
        ],
      },
      hallazgos: [
        {
          id: "cierre-blanqueamiento",
          agente: "Agente de Ventas",
          titulo: "La demanda de blanqueamiento no cayó. Cayó el cierre.",
          cuerpo: `${BLANQ.consultas} personas preguntaron por blanqueamiento y solo ${BLANQ.citas} agendaron: un cierre de ${pct(BLANQ_CIERRE)} contra el ${pct(BLANQ_CIERRE_ANTES)} del mes pasado. Las consultas apenas bajaron (24 contra 25). Lo que se rompió está entre la pregunta y la cita, no antes.`,
          descarte:
            "Consideré que fuera estacionalidad y lo descarté: limpieza bajó 20% y ortodoncia 10%, mientras blanqueamiento bajó 59%. Una caída de temporada no elige un solo servicio.",
          confianza: 0.78,
          supuestos: [
            "Que las 24 consultas son intención real y no gente comparando precios sin pensar en tratarse.",
          ],
          limitaciones: [
            "No puedo saber qué se dijo en las conversaciones que no dejaron etiqueta: 11 quedaron sin cerrar.",
          ],
          evidencia: [
            { etiqueta: "Consultas de blanqueamiento", valor: "24 (antes 25)", fuente: "conversaciones · agosto" },
            { etiqueta: "Citas confirmadas", valor: "7 (antes 17)", fuente: "agenda · agosto" },
            { etiqueta: "Objeción más repetida", valor: "sensibilidad · 14", fuente: "etiquetas de conversación" },
          ],
          traza: [
            { paso: "Leí el resumen del mes", detalle: "7 servicios · 15 métricas" },
            { paso: "Busqué qué servicio explica la caída", detalle: "blanqueamiento −59%" },
            { paso: "Comparé consultas contra citas", detalle: "24 → 7" },
            { paso: "Revisé las objeciones etiquetadas", detalle: "sensibilidad 14 · precio 9" },
            { paso: "Descarté estacionalidad", detalle: "los otros 6 servicios no cayeron igual" },
          ],
          severidad: "critico",
        },
        {
          id: "respuesta-lenta",
          agente: "Agente de Ventas",
          titulo: "Once conversaciones quedaron sin cerrar",
          cuerpo:
            "El tiempo de respuesta subió de 5 a 6 minutos y 11 de 98 conversaciones no llegaron a ningún desenlace. Es poco movimiento para explicar la caída de interesados por sí solo, pero las 11 valen unos ₡340.000 al ticket promedio del mes.",
          descarte: null,
          confianza: 0.55,
          supuestos: [
            "Que una conversación sin desenlace equivale a una venta perdida, cuando algunas pueden volver el mes siguiente.",
          ],
          limitaciones: [
            "Un minuto más de respuesta promedio está dentro de la variación normal: esto no prueba causa, solo lo deja anotado.",
          ],
          evidencia: [
            { etiqueta: "Conversaciones sin cerrar", valor: "11 de 98", fuente: "bandeja de conversaciones" },
            { etiqueta: "Tiempo de respuesta", valor: "6 min (antes 5)", fuente: "promedio del mes" },
          ],
          traza: [
            { paso: "Revisé el embudo completo", detalle: "98 conversaciones · 71 interesados · 26 cierres" },
            { paso: "Aislé las que no llegaron a nada", detalle: "11" },
            { paso: "Las valoré al ticket promedio", detalle: "₡340.000" },
          ],
          severidad: "atencion",
        },
      ],
      propuestas: [],
    },

    // -----------------------------------------------------------------------
    // OPERACIÓN
    // -----------------------------------------------------------------------
    operacion: {
      id: "operacion",
      metricas: [
        {
          label: "Uso de la agenda",
          valor: USO_AGENDA,
          antes: USO_AGENDA_ANTES,
          unidad: "porcentaje",
          fuente: `${CITAS} citas de ${CUPOS} cupos`,
          serie: ultimos12(USO_AGENDA_MES),
        },
        {
          label: "Cupos sin usar",
          valor: CUPOS - CITAS,
          antes: CUPOS - CITAS_ANTES,
          unidad: "cantidad",
          menosEsMejor: true,
          fuente: `${CUPOS} cupos − ${CITAS} citas`,
        },
        {
          label: "Cancelaciones",
          valor: 12,
          antes: 9,
          unidad: "cantidad",
          menosEsMejor: true,
          fuente: "citas canceladas en agosto",
          nota: "6,5% de las reservas",
        },
        {
          label: "Horas de atención",
          valor: 520,
          antes: 520,
          unidad: "horas",
          fuente: "horario del negocio × días hábiles",
        },
      ],
      /*
       * El mapa de calor de la agenda.
       *
       * Es la gráfica que hace más trabajo de la pantalla: el 56,9% mensual
       * esconde martes llenos y jueves vacíos, y acá se ven los dos. Y es
       * además la prueba visual del cruce con Planilla — el sábado aparece casi
       * vacío en la misma pantalla donde se pagaron 32 horas extra de sábado.
       */
      mapa: {
        titulo: "Ocupación de la agenda por día y franja · agosto",
        dias: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
        franjas: ["8–10", "10–12", "12–14", "14–16", "16–18"],
        valores: [
          [0.72, 0.78, 0.7, 0.42, 0.75, 0.38],
          [0.8, 0.85, 0.76, 0.48, 0.82, 0.35],
          [0.45, 0.5, 0.44, 0.3, 0.48, 0.2],
          [0.68, 0.74, 0.66, 0.38, 0.7, null],
          [0.62, 0.66, 0.58, 0.34, 0.64, null],
        ],
        pie:
          "El jueves promedia 38% y el martes 70%. El sábado, que cierra a mediodía, " +
          "promedia 31%. Las celdas punteadas son horas en que la clínica no abre.",
      },
      barras: {
        titulo: "Uso de la agenda por servicio",
        pie: `${CITAS} citas confirmadas sobre ${CUPOS} cupos disponibles en agosto.`,
        filas: SERVICIOS.map((s) => ({
          etiqueta: s.nombre,
          valor: s.citas,
          total: s.cupos,
          nota: s.nombre === "Blanqueamiento" ? `${s.cupos - s.citas} cupos libres` : undefined,
          destacada: s.nombre === "Blanqueamiento",
        })),
      },
      hallazgos: [
        {
          id: "capacidad-disponible",
          agente: "Agente de Operación",
          titulo: "La capacidad no es el problema: sobran 132 cupos",
          cuerpo: `La agenda cerró agosto en ${pct(USO_AGENDA)}, contra ${pct(USO_AGENDA_ANTES)} en julio. Blanqueamiento es el más flojo con ${BLANQ.citas} de ${BLANQ.cupos} cupos usados. No hace falta abrir horarios ni contratar: hace falta llenar los que ya existen.`,
          descarte:
            "Consideré recomendar reducir cupos para subir el porcentaje y lo descarté: el indicador mejoraría sin que entrara un colón más. Es maquillar el número, no arreglar el mes.",
          confianza: 0.88,
          supuestos: [
            "Que los cupos declarados por servicio son reales y no una capacidad teórica que el equipo no puede sostener.",
          ],
          limitaciones: [
            "No veo la distribución por día ni por profesional: un 57% mensual puede esconder martes llenos y jueves vacíos.",
          ],
          evidencia: [
            { etiqueta: "Uso de la agenda", valor: `${pct(USO_AGENDA)} (antes ${pct(USO_AGENDA_ANTES)})`, fuente: "citas / cupos" },
            { etiqueta: "Cupos sin usar", valor: `${CUPOS - CITAS}`, fuente: "calendario · agosto" },
            { etiqueta: "Blanqueamiento", valor: `${BLANQ.citas} de ${BLANQ.cupos}`, fuente: "calendario · agosto" },
          ],
          traza: [
            { paso: "Sumé cupos y citas del mes", detalle: `${CITAS} de ${CUPOS}` },
            { paso: "Bajé al detalle por servicio", detalle: "7 servicios" },
            { paso: "Ordené por cupos libres", detalle: "blanqueamiento primero" },
            { paso: "Comparé contra julio", detalle: `${pct(USO_AGENDA_ANTES)} → ${pct(USO_AGENDA)}` },
          ],
          severidad: "atencion",
        },
      ],
      propuestas: [],
    },

    // -----------------------------------------------------------------------
    // PLANILLA
    // -----------------------------------------------------------------------
    planilla: {
      id: "planilla",
      metricas: [
        {
          label: "Costo de planilla",
          valor: PLANILLA,
          antes: PLANILLA_ANTES,
          unidad: "colones",
          menosEsMejor: true,
          fuente: "salarios + horas extra + cargas patronales",
          serie: ultimos12(PLANILLA_MES),
        },
        {
          label: "Planilla sobre ingresos",
          valor: PLANILLA_SOBRE_INGRESOS,
          antes: PLANILLA_SOBRE_INGRESOS_ANTES,
          unidad: "porcentaje",
          menosEsMejor: true,
          fuente: "planilla / ingresos del mes",
          serie: ultimos12(PLANILLA_SOBRE_INGRESOS_MES),
        },
        {
          label: "Horas extra",
          valor: EXTRAS,
          antes: EXTRAS_ANTES,
          unidad: "colones",
          menosEsMejor: true,
          fuente: "52 horas en agosto · 31 en julio",
          nota: "32 de las 52 son de sábado",
        },
        {
          label: "Pasivo por vacaciones",
          valor: 1_270_000,
          antes: 1_040_000,
          unidad: "colones",
          menosEsMejor: true,
          fuente: "47 días acumulados × salario diario",
        },
      ],
      /*
       * La planilla como porcentaje de los ingresos, contra el techo que la
       * propia clínica se puso en su plan de negocio.
       *
       * La línea punteada no es un dato: es una meta, y por eso se dibuja
       * distinto. Que salga del plan de negocio —un documento que además está
       * cargado en la pestaña de Documentos— es lo que convierte el gráfico en
       * algo del negocio y no en una métrica que trajo el panel.
       */
      serie: {
        titulo: "Planilla sobre ingresos · últimos 14 meses",
        etiquetas: MESES,
        unidad: "porcentaje",
        series: [
          { nombre: "Planilla / ingresos", puntos: PLANILLA_SOBRE_INGRESOS_MES },
          {
            nombre: `Techo del plan (${TECHO_PLANILLA}%)`,
            puntos: MESES.map(() => TECHO_PLANILLA),
            referencia: true,
          },
        ],
        pie:
          `El plan de negocio 2026 fija ${TECHO_PLANILLA}% como techo. Se venía cumpliendo todo el ` +
          "año; agosto es el primer mes que lo cruza, y lo cruza por 7,5 puntos.",
      },
      columnas: {
        titulo: "Ingreso generado por cada ₡1 de costo laboral",
        unidad: "cantidad",
        columnas: [
          { etiqueta: "Dra. Solís", valor: 4.2 },
          { etiqueta: "Dr. Vargas", valor: 3.6 },
          { etiqueta: "Dra. Méndez", valor: 2.2 },
        ],
        pie:
          "Ortodoncia se cobra por mensualidad y no por tratamiento, así que la Dra. Méndez " +
          "arrastra un ingreso que se reconoce a lo largo de dos años. El número es correcto " +
          "y comparar los tres entre sí NO lo es.",
      },
      tabla: {
        titulo: "La planilla de agosto",
        columnas: ["Concepto", "Monto"],
        filas: [
          { celdas: ["Salarios ordinarios · 6 personas", moneda(SALARIOS)] },
          { celdas: ["Horas extra · 52 h", moneda(EXTRAS)] },
          { celdas: ["Bruto", moneda(BRUTO)] },
          { celdas: [`Cargas patronales · ${pct(CARGA_PATRONAL * 100, 2)}`, moneda(CARGAS)] },
          { celdas: ["Costo total", moneda(PLANILLA)], destacada: true },
        ],
        pie: `${pct(PLANILLA_SOBRE_INGRESOS)} de los ingresos del mes · era ${pct(PLANILLA_SOBRE_INGRESOS_ANTES)} en julio.`,
      },
      hallazgos: [
        {
          id: "aguinaldo",
          agente: "Agente de Planilla",
          titulo: "La provisión de aguinaldo va ₡2.050.000 corta para diciembre",
          cuerpo:
            "Vienen apartando ₡300.000 al mes desde enero: ₡2.400.000 acumulados. Con la planilla de hoy, el aguinaldo de diciembre sale en ₡4.450.000. Faltan ₡2.050.000 y quedan cuatro meses, así que la provisión tendría que subir a ₡512.500 mensuales desde setiembre. Si no, el faltante se paga con el flujo de noviembre.",
          descarte:
            "Consideré que el aumento del bruto fuera puntual del mes y no lo di por hecho: las horas extra vienen subiendo tres meses seguidos, así que proyecté con el bruto actual y no con el promedio del año.",
          confianza: 0.82,
          supuestos: [
            "Que la planilla se mantiene como está de setiembre a diciembre, sin contrataciones ni salidas.",
            "Que las horas extra siguen en el nivel de agosto.",
          ],
          limitaciones: [
            "No conozco el saldo real de la cuenta de provisiones: leo lo que se apartó según la planilla, no lo que hay en el banco.",
          ],
          evidencia: [
            { etiqueta: "Provisión acumulada", valor: "₡2.400.000", fuente: "8 meses × ₡300.000" },
            { etiqueta: "Aguinaldo estimado", valor: "₡4.450.000", fuente: "promedio de brutos del año" },
            { etiqueta: "Faltante", valor: "₡2.050.000", fuente: "estimado − acumulado" },
          ],
          traza: [
            { paso: "Leí la planilla de los 8 meses", detalle: "6 personas" },
            { paso: "Calculé el bruto promedio del año", detalle: "₡4.450.000" },
            { paso: "Busqué la provisión apartada", detalle: "₡300.000/mes" },
            { paso: "Proyecté el aguinaldo de diciembre", detalle: "₡4.450.000" },
            { paso: "Repartí el faltante en los meses que quedan", detalle: "₡512.500/mes" },
            { paso: "Verifiqué el efecto en el flujo de noviembre", detalle: "−₡2.050.000" },
          ],
          severidad: "critico",
        },
        {
          id: "extras-con-agenda-floja",
          agente: "Agente de Planilla",
          titulo: "Se pagaron ₡347.000 en horas extra con la agenda al 57%",
          cuerpo: `Las horas extra subieron 64% contra julio (52 horas contra 31) mientras la agenda cerró en ${pct(USO_AGENDA)}. No es un problema de volumen de trabajo: 32 de las 52 horas son del sábado, que es el día con menos citas confirmadas del mes. Es distribución del turno, no carga.`,
          descarte:
            "Consideré que las extras vinieran de tratamientos largos que se corrieron de horario y lo descarté: las 32 horas de sábado son de recepción y administración, no de sillón.",
          confianza: 0.71,
          supuestos: [
            "Que las marcas de asistencia del sábado corresponden a atención y no a inventario o limpieza profunda.",
          ],
          limitaciones: [
            "No veo el motivo que cada persona anotó al marcar la hora extra: solo veo cuándo entró y cuándo salió.",
          ],
          evidencia: [
            { etiqueta: "Horas extra", valor: "52 h · ₡347.000", fuente: "marcas de asistencia · agosto" },
            { etiqueta: "Concentración en sábado", valor: "32 de 52 h", fuente: "marcas de asistencia" },
            { etiqueta: "Uso de la agenda", valor: `${pct(USO_AGENDA)}`, fuente: "calendario · agosto" },
          ],
          traza: [
            { paso: "Comparé extras contra julio", detalle: "31 h → 52 h" },
            { paso: "Las abrí por día de la semana", detalle: "sábado 32 h" },
            { paso: "Crucé con las citas de sábado", detalle: "el día más flojo" },
            { paso: "Las abrí por puesto", detalle: "recepción y administración" },
          ],
          severidad: "critico",
        },
      ],
      propuestas: [
        {
          id: "subir-provision",
          titulo: "Subir la provisión de aguinaldo a ₡512.500 mensuales",
          detalle: "Desde setiembre y hasta diciembre. Cubre el faltante sin tocar noviembre.",
          queHace: "Deja anotada una tarea para Administración, con fecha y monto.",
          alEjecutar: "Tarea creada para el 1 de setiembre · asignada a Administración.",
        },
      ],
    },

    // -----------------------------------------------------------------------
    // MERCADO
    // -----------------------------------------------------------------------
    mercado: {
      id: "mercado",
      metricas: [
        {
          label: "Precio de blanqueamiento",
          valor: BLANQ_PRECIO,
          antes: BLANQ_PRECIO,
          unidad: "colones",
          fuente: "lista de precios de la clínica",
          nota: `${moneda(BLANQ_PRECIO - BLANQ_MEDIANA_MERCADO)} arriba de la mediana`,
        },
        {
          label: "Mediana de la zona",
          valor: BLANQ_MEDIANA_MERCADO,
          antes: null,
          unidad: "colones",
          fuente: "4 clínicas observadas en Escazú",
        },
        {
          label: "Reseñas",
          valor: 4.6,
          antes: 4.6,
          unidad: "cantidad",
          fuente: "28 reseñas · la clínica líder tiene 204",
          nota: "La nota no es la brecha. El volumen sí.",
        },
        {
          label: "Costo por cita en pauta",
          valor: COSTO_POR_CITA,
          antes: null,
          unidad: "colones",
          menosEsMejor: true,
          fuente: `${moneda(CAMPANA.gasto)} / ${CAMPANA.cierres} cierres`,
          nota: `El servicio se vende a ${moneda(BLANQ_PRECIO)}`,
        },
      ],
      columnas: {
        titulo: "Reseñas publicadas · Sonrisa Pura contra la zona",
        unidad: "cantidad",
        columnas: [
          { etiqueta: "Dental Escazú Premium", valor: 204 },
          { etiqueta: "Clínica Momentum", valor: 96 },
          { etiqueta: "Sonrisa Real", valor: 71 },
          { etiqueta: "OdontoPlaza", valor: 43 },
          { etiqueta: "Sonrisa Pura", valor: 28, destacada: true },
        ],
        pie:
          "La calificación es comparable (4,6 contra 4,8 de la líder). La brecha está en el " +
          "volumen, y el plan de negocio 2026 ya lo tenía anotado como riesgo.",
      },
      rango: {
        titulo: "Blanqueamiento — dónde estás parado",
        nuestraEtiqueta: "Sonrisa Pura",
        nuestroValor: BLANQ_PRECIO,
        observaciones: [
          { nombre: "Dental Escazú Premium", valor: 145_000, fecha: "12 de agosto", fuente: "sitio web" },
          { nombre: "Clínica Momentum", valor: 124_000, fecha: "9 de agosto", fuente: "perfil de Instagram" },
          { nombre: "Sonrisa Real", valor: 112_000, fecha: "12 de agosto", fuente: "sitio web" },
          { nombre: "OdontoPlaza", valor: 95_000, fecha: "5 de agosto", fuente: "anuncio de Facebook" },
        ],
        nota: `Mediana ${moneda(BLANQ_MEDIANA_MERCADO)}. Sonrisa Pura está ${moneda(BLANQ_PRECIO - BLANQ_MEDIANA_MERCADO)} arriba, un 10%.`,
      },
      hallazgos: [
        {
          id: "precio-no-es-la-objecion",
          agente: "Agente de Mercado",
          titulo: "Estás caro, pero no es por eso que no cierran",
          cuerpo: `El blanqueamiento está ${moneda(BLANQ_PRECIO - BLANQ_MEDIANA_MERCADO)} arriba de la mediana de las cuatro clínicas observadas en Escazú. Al mismo tiempo, de las ${BLANQ.consultas} conversaciones del servicio, 9 mencionaron precio y 14 mencionaron miedo a la sensibilidad. Bajar el precio atacaría la objeción número dos y regalaría margen en la número uno.`,
          descarte:
            "Consideré recomendar igualar la mediana y lo descarté: son ₡12.000 menos por tratamiento sobre 7 citas, ₡84.000 al mes, contra una objeción que aparece en 9 de 24 conversaciones. El número no cierra ni si funcionara.",
          confianza: 0.69,
          supuestos: [
            "Que los precios publicados son los que cobran y no listas con descuentos que no se anuncian.",
            "Que las cuatro clínicas atienden al mismo tipo de paciente que Sonrisa Pura.",
          ],
          limitaciones: [
            "Cuatro clínicas no son el mercado de Escazú: son las cuatro que se pudieron observar, y la más vieja de las observaciones es del 5 de agosto.",
            "No sé qué incluye el precio de cada una: una sesión, dos, o mantenimiento.",
          ],
          evidencia: [
            { etiqueta: "Precio propio", valor: moneda(BLANQ_PRECIO), fuente: "lista de precios de la clínica" },
            { etiqueta: "Mediana observada", valor: moneda(BLANQ_MEDIANA_MERCADO), fuente: "4 clínicas · agosto" },
            { etiqueta: "Objeción de precio", valor: "9 de 24", fuente: "etiquetas de conversación" },
            { etiqueta: "Objeción de sensibilidad", valor: "14 de 24", fuente: "etiquetas de conversación" },
          ],
          traza: [
            { paso: "Junté los precios observados de la zona", detalle: "4 clínicas · con fecha" },
            { paso: "Calculé la mediana", detalle: moneda(BLANQ_MEDIANA_MERCADO) },
            { paso: "Comparé contra el precio propio", detalle: "+10%" },
            { paso: "Crucé con las objeciones registradas", detalle: "precio 9 · sensibilidad 14" },
          ],
          severidad: "atencion",
        },
        {
          id: "nadie-respalda-sensibilidad",
          agente: "Agente de Mercado",
          titulo: "Tres de las cuatro anuncian «sin sensibilidad». Ninguna lo respalda.",
          cuerpo:
            "Dental Escazú Premium, Clínica Momentum y OdontoPlaza usan la frase «sin sensibilidad» en su material, y ninguna de las tres explica con qué. Sonrisa Pura sí tiene un protocolo desensibilizante declarado en su conocimiento y no lo menciona en la campaña, ni en el sitio, ni en las conversaciones.",
          descarte: null,
          confianza: 0.64,
          supuestos: [
            "Que el protocolo declarado en el conocimiento de la clínica se aplica de verdad en cada tratamiento.",
          ],
          limitaciones: [
            "Reviso lo que las otras clínicas publican, no lo que hacen: pueden tener un protocolo y no contarlo, igual que Sonrisa Pura.",
          ],
          evidencia: [
            { etiqueta: "Anuncian «sin sensibilidad»", valor: "3 de 4", fuente: "sitios y perfiles · agosto" },
            { etiqueta: "Lo respaldan con un método", valor: "0 de 4", fuente: "sitios y perfiles · agosto" },
          ],
          traza: [
            { paso: "Leí el material publicado de las 4", detalle: "sitios, perfiles y anuncios" },
            { paso: "Busqué la promesa que más se repite", detalle: "«sin sensibilidad» · 3 de 4" },
            { paso: "Revisé si alguna la respalda", detalle: "ninguna" },
            { paso: "Contrasté con el conocimiento propio", detalle: "protocolo declarado, no comunicado" },
          ],
          severidad: "atencion",
        },
      ],
      propuestas: [],
    },
  },
};

/** Colones con separador de miles, para los textos escritos a mano de arriba. */
function moneda(valor: number): string {
  return `₡${Math.round(valor).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

/**
 * Un porcentaje con coma decimal.
 *
 * Existe porque interpolar el número pelado y pegarle un `%` escribe "56.9%"
 * con el punto que pone JavaScript, y en la misma pantalla las tarjetas de
 * métrica escriben "56,9%". Dos criterios de puntuación en un panel proyectado
 * es de las cosas que nadie sabe nombrar y todo el mundo nota.
 */
function pct(valor: number, decimales = 1): string {
  return `${valor.toFixed(decimales).replace(".", ",").replace(/,0$/, "")}%`;
}
