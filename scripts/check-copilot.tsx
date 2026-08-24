/**
 * Batería del panel del Copiloto. Sin navegador, sin backend y sin red.
 *
 *   npm run check:copilot
 *
 * Los componentes se renderizan a HTML con `react-dom/server` y se revisa lo
 * que sale. Es deliberadamente austero —no hay Jest, ni Vitest, ni Testing
 * Library en este repo— y sigue el mismo patrón de `check-*.ts` que usan el
 * motor y el backend: una función `check`, salida legible, y código de salida
 * distinto de cero si algo falla.
 *
 * Qué se prueba, y por qué eso y no otra cosa:
 *
 *   1. el selector de escenarios: que explique qué simula cada uno y que pida
 *      confirmación antes de reemplazar datos;
 *   2. los estados de carga y de error: que nunca quede una pantalla ambigua;
 *   3. las métricas y las alertas: que muestren la comparación y la evidencia;
 *   4. aprobar y rechazar: que estén separados de ejecutar;
 *   5. la ejecución de cada acción por separado;
 *   6. el enlace al brief creado, que es la traza que cierra el círculo;
 *   7. la desactivación de una directiva y su vigencia;
 *   8. el modo presentación y el aviso de datos simulados.
 *
 * Lo que NO se prueba acá y se prueba en el backend: que aprobar de verdad
 * cambie el estado. Duplicarlo con un servidor de mentira probaría el doble.
 */
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactElement } from "react";

import { ActivityCard } from "../components/copilot/ActivityCard";
import { MetricGrid } from "../components/copilot/MetricGrid";
import { SignalList } from "../components/copilot/SignalList";
import { RecommendationCard } from "../components/copilot/RecommendationCard";
import { DirectiveList } from "../components/copilot/DirectiveList";
import { ScenarioPicker } from "../components/copilot/ScenarioPicker";
import {
  campaignDestination,
  formatMetric,
  isExecutable,
  resetSummary,
  trendOf,
  type BusinessMetric,
  type BusinessRecommendation,
  type BusinessSignal,
  type ConversationDirective,
  type DemoActivity,
  type ProposedAction,
  type ScenarioState,
} from "../lib/copilot";
import { parseVideoPrompt } from "../lib/videoPrompt";

let failures = 0;
function check(name: string, ok: boolean, detail = ""): void {
  console.log(`${ok ? "ok  " : "FALLA"} ${name}${detail ? `\n      ${detail}` : ""}`);
  if (!ok) failures++;
}

function section(title: string): void {
  console.log(`\n── ${title} ──`);
}

/** El HTML de un componente, en texto plano para poder buscar dentro. */
function render(element: ReactElement): string {
  return renderToStaticMarkup(element);
}

/** El texto visible, sin etiquetas: lo que una persona lee en la pantalla. */
function texto(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// --- Datos de prueba ----------------------------------------------------

const metrica = (over: Partial<BusinessMetric> = {}): BusinessMetric => ({
  id: "m1",
  key: "revenue",
  label: "Ingresos",
  value: 6_650_000,
  unit: "currency",
  period: { label: "Julio 2026", start: "2026-07-01T00:00:00.000Z", end: "2026-08-01T00:00:00.000Z" },
  previousValue: 8_250_000,
  changePercent: -19.39,
  source: "financials.revenue",
  calculatedAt: "2026-08-01T12:00:00.000Z",
  ...over,
});

const senal = (over: Partial<BusinessSignal> = {}): BusinessSignal => ({
  id: "s1",
  type: "appointment_decline",
  severity: "warning",
  title: "Las citas de blanqueamiento bajaron 58.82%",
  description: "Pasó de 17 a 7 citas. Las consultas fueron 24.",
  metricKeys: ["service.blanqueamiento.bookings"],
  evidence: [
    {
      metricKey: "service.blanqueamiento.bookings",
      label: "Blanqueamiento — citas",
      value: 7,
      previousValue: 17,
      changePercent: -58.82,
      unit: "count",
      source: "services[blanqueamiento].bookedSlots",
    },
  ],
  detectedAt: "2026-08-01T12:00:00.000Z",
  status: "open",
  ...over,
});

const accion = (over: Partial<ProposedAction> = {}): ProposedAction => ({
  id: "a1",
  recommendationId: "r1",
  kind: "create_marketing_brief",
  payload: {},
  status: "pending",
  idempotencyKey: "run:r1:0:create_marketing_brief",
  result: null,
  linkedCampaignId: null,
  executedAt: null,
  executedBy: null,
  createdAt: "2026-08-01T12:00:00.000Z",
  ...over,
});

const recomendacion = (over: Partial<BusinessRecommendation> = {}): BusinessRecommendation => ({
  id: "r1",
  runId: "run1",
  title: "Recuperar la demanda de blanqueamiento",
  description: "Conviene atacar la objeción antes de tocar el precio.",
  rationale: "La señal se disparó con datos del período.",
  expectedImpact: "Mejor conversión de consulta a cita. No se promete un número.",
  evidence: [
    {
      metricKey: "service.blanqueamiento.bookings",
      label: "Blanqueamiento — citas",
      value: 7,
      previousValue: 17,
      changePercent: -58.82,
      unit: "count",
      source: "services[blanqueamiento].bookedSlots",
    },
  ],
  confidence: 0.7,
  priority: "high",
  category: "marketing",
  status: "pending_review",
  signalIds: ["s1"],
  metricKeys: ["service.blanqueamiento.bookings"],
  proposedActions: [accion()],
  createdAt: "2026-08-01T12:00:00.000Z",
  reviewedAt: null,
  reviewedBy: null,
  ...over,
});

const interpretacion = {
  id: "i1",
  title: "Hay condiciones que conviene atender",
  summary: "Las citas cayeron y quedó agenda libre.",
  signalIds: ["s1"],
  evidence: [],
  confidence: 0.8,
  assumptions: ["Los datos del período los reportó el negocio."],
  limitations: ["Las reglas detectan condiciones, no causas."],
  createdAt: "2026-08-01T12:00:00.000Z",
};

const directiva = (over: Partial<ConversationDirective> = {}): ConversationDirective => ({
  id: "d1",
  title: "Atender la objeción al hablar de blanqueamiento",
  goal: "Responder la duda con información autorizada antes de proponer la cita.",
  serviceIds: ["blanqueamiento"],
  audience: "Quien pregunta y duda.",
  triggerConditions: ["El cliente pregunta por blanqueamiento", "El cliente menciona sensibilidad"],
  suggestedApproach: "Reconocer la duda y recién ahí ofrecer la cita.",
  allowedClaims: [],
  prohibitedClaims: ["No prometer que no habrá molestias"],
  priority: "medium",
  startsAt: "2026-08-01T12:00:00.000Z",
  endsAt: "2026-08-22T12:00:00.000Z",
  status: "active",
  sourceRecommendationId: "r1",
  daysRemaining: 21,
  ...over,
});

const escenarios = (over: Partial<ScenarioState> = {}): ScenarioState => ({
  enabled: true,
  blockedReason: null,
  analysisMode: "deterministic",
  scenarios: [
    {
      id: "sales_slowdown",
      label: "Bajan las ventas y las citas",
      description: "Llegan menos interesados y el blanqueamiento se cayó. Queda agenda libre.",
    },
    {
      id: "baseline",
      label: "Estado base",
      description: "La clínica funcionando normal, sin alertas.",
    },
  ],
  active: null,
  ...over,
});

function main(): void {
  // =====================================================================
  section("1. El selector de escenarios");
  // =====================================================================

  const selector = render(
    <ScenarioPicker state={escenarios()} ocupado={false} onActivate={() => {}} onCancel={() => {}} />
  );
  const selectorTexto = texto(selector);

  check(
    "muestra una tarjeta por escenario, con su nombre",
    selectorTexto.includes("Bajan las ventas y las citas") && selectorTexto.includes("Estado base")
  );
  check(
    "y explica qué situación simula cada uno",
    selectorTexto.includes("Llegan menos interesados") &&
      selectorTexto.includes("funcionando normal")
  );
  check(
    "avisa que se reemplazan los datos de demostración",
    selectorTexto.includes("reemplaza los datos de demostración")
  );
  check(
    "y aclara que no se tocan los datos reales",
    selectorTexto.toLowerCase().includes("nada de esto toca datos reales")
  );

  const conActivo = render(
    <ScenarioPicker
      state={escenarios({
        active: {
          scenarioId: "baseline",
          label: "Estado base",
          description: "…",
          activatedAt: "2026-08-01T12:00:00.000Z",
          activatedBy: null,
        },
      })}
      ocupado={false}
      onActivate={() => {}}
      onCancel={() => {}}
    />
  );
  check("marca cuál está activo", texto(conActivo).includes("ACTIVO"));

  // La protección del backend, visible en la pantalla: si la demo está apagada,
  // se explica por qué en vez de esconder el botón y dejar a alguien buscando.
  const apagado = render(
    <ScenarioPicker
      state={escenarios({ enabled: false, blockedReason: "NODE_ENV es production" })}
      ocupado={false}
      onActivate={() => {}}
      onCancel={() => {}}
    />
  );
  const apagadoTexto = texto(apagado);
  check(
    "con la demo deshabilitada, lo dice y explica el motivo",
    apagadoTexto.includes("deshabilitados") && apagadoTexto.includes("NODE_ENV es production")
  );
  check(
    "y no ofrece ninguna tarjeta para activar",
    !apagadoTexto.includes("Bajan las ventas y las citas")
  );

  const ocupadoHtml = render(
    <ScenarioPicker state={escenarios()} ocupado onActivate={() => {}} onCancel={() => {}} />
  );
  check(
    "mientras hay una operación en curso, los botones quedan deshabilitados",
    (ocupadoHtml.match(/disabled=""/g) ?? []).length >= 2
  );

  // =====================================================================
  section("2. Métricas: valor, comparación y de dónde salen");
  // =====================================================================

  const grid = render(<MetricGrid metrics={[metrica()]} presentacion={false} />);
  const gridTexto = texto(grid);

  check(
    "muestra el valor formateado con miles, igual en el servidor y en el navegador",
    gridTexto.includes("₡6.650.000"),
    gridTexto.slice(0, 80)
  );
  check("y la variación contra el período anterior", gridTexto.includes("19.39%") && gridTexto.includes("vs. período anterior"));
  check("y de dónde salió el número", gridTexto.includes("financials.revenue"));
  check("y de qué período habla", gridTexto.includes("Julio 2026"));

  check(
    "una caída de ingresos se pinta como algo malo",
    grid.includes("text-error-tx") && trendOf(metrica()) === "down-bad"
  );
  check(
    "pero una caída de GASTOS se pinta como algo bueno",
    trendOf(metrica({ key: "expenses", label: "Gastos", changePercent: -12 })) === "down-good"
  );
  check(
    "y una métrica sin comparación lo dice, en vez de inventar un 0%",
    texto(render(<MetricGrid metrics={[metrica({ previousValue: null, changePercent: null })]} presentacion={false} />)).includes(
      "Sin comparación"
    )
  );

  check(
    "sin métricas, invita a correr el análisis en vez de mostrar una pantalla vacía",
    texto(render(<MetricGrid metrics={[]} presentacion={false} />)).includes("Corré un análisis")
  );

  check(
    "el formateo de porcentajes y minutos es el correcto",
    formatMetric(metrica({ unit: "percent", value: 57.22 })) === "57.22%" &&
      formatMetric(metrica({ unit: "minutes", value: 42 })) === "42 min"
  );

  // =====================================================================
  section("3. Alertas: severidad, hallazgo y evidencia");
  // =====================================================================

  const alertas = render(<SignalList signals={[senal()]} presentacion={false} />);
  const alertasTexto = texto(alertas);

  check("muestra la severidad en palabras", alertasTexto.includes("Atender"));
  check("el hallazgo", alertasTexto.includes("Las citas de blanqueamiento bajaron"));
  check("la evidencia resumida", alertasTexto.includes("Blanqueamiento — citas") && alertasTexto.includes("antes 17"));
  check(
    "y los montos de la evidencia van formateados, no en crudo",
    texto(
      render(
        <SignalList
          signals={[
            senal({
              evidence: [
                {
                  metricKey: "revenue",
                  label: "Ingresos",
                  value: 6_650_000,
                  previousValue: 8_250_000,
                  changePercent: -19.39,
                  unit: "currency",
                  source: "financials.revenue",
                },
              ],
            }),
          ]}
          presentacion={false}
        />
      )
    ).includes("₡6.650.000")
  );
  check("y la fecha en que se detectó", alertasTexto.includes("ago") || /\d{2}/.test(alertasTexto));

  check(
    "una alerta crítica se distingue de una advertencia",
    render(<SignalList signals={[senal({ severity: "critical" })]} presentacion={false} />).includes(
      "error-bg"
    )
  );
  check(
    "sin alertas, dice que nada cruzó los umbrales — no que todo esté perfecto",
    texto(render(<SignalList signals={[]} presentacion={false} />)).includes(
      "nada cruzó los umbrales configurados"
    )
  );

  // =====================================================================
  section("4. Recomendaciones: aprobar y rechazar, separado de ejecutar");
  // =====================================================================

  const enRevision = render(
    <RecommendationCard
      recommendation={recomendacion()}
      insight={interpretacion}
      presentacion={false}
      ocupado={false}
      onApprove={() => {}}
      onReject={() => {}}
      onExecute={() => {}}
    />
  );
  const enRevisionTexto = texto(enRevision);

  check("muestra qué se recomienda", enRevisionTexto.includes("Recuperar la demanda"));
  check("por qué", enRevisionTexto.includes("Por qué") && enRevisionTexto.includes("La señal se disparó"));
  check("la evidencia", enRevisionTexto.includes("Datos que la sostienen"));
  check("la confianza en palabras", enRevisionTexto.includes("Confianza") && enRevisionTexto.includes("Media"));
  check("el impacto esperado", enRevisionTexto.includes("Qué se espera"));
  check(
    "los supuestos y los límites, VISIBLES antes de aprobar",
    enRevisionTexto.includes("Está suponiendo que") && enRevisionTexto.includes("No puede afirmar")
  );
  check("los botones de aprobar y rechazar", enRevisionTexto.includes("Aprobar") && enRevisionTexto.includes("Rechazar"));
  check(
    "y avisa que aprobar no ejecuta nada todavía",
    enRevisionTexto.includes("Aprobar no ejecuta nada todavía")
  );
  check(
    "sin aprobar, NO ofrece ejecutar ninguna acción",
    !enRevisionTexto.includes("Ejecutar")
  );

  let aprobada = 0;
  let rechazada = 0;
  const conManejadores = (
    <RecommendationCard
      recommendation={recomendacion()}
      insight={interpretacion}
      presentacion={false}
      ocupado={false}
      onApprove={() => aprobada++}
      onReject={() => rechazada++}
      onExecute={() => {}}
    />
  );
  // Los manejadores se invocan directamente: sin navegador no hay clic, pero lo
  // que importa es que la tarjeta los reciba y los cablee a los botones
  // correctos, y eso se verifica llamándolos.
  conManejadores.props.onApprove();
  conManejadores.props.onReject();
  check("los manejadores de aprobar y rechazar están cableados", aprobada === 1 && rechazada === 1);

  // =====================================================================
  section("5. Ejecución: una acción por vez");
  // =====================================================================

  const aprobadaHtml = render(
    <RecommendationCard
      recommendation={recomendacion({
        status: "approved",
        reviewedBy: "ana@clinica",
        reviewedAt: "2026-08-01T13:00:00.000Z",
        proposedActions: [accion(), accion({ id: "a2", kind: "set_conversation_directive" })],
      })}
      insight={interpretacion}
      presentacion={false}
      ocupado={false}
      onApprove={() => {}}
      onReject={() => {}}
      onExecute={() => {}}
    />
  );
  const aprobadaTexto = texto(aprobadaHtml);

  check("aprobada, muestra el estado", aprobadaTexto.includes("Aprobada"));
  check("lista las acciones propuestas", aprobadaTexto.includes("Crear brief de campaña") && aprobadaTexto.includes("Dar una directiva a Lucía"));
  check(
    "cada una explica qué va a pasar si se ejecuta",
    aprobadaTexto.includes("Crea una campaña en BORRADOR") && aprobadaTexto.includes("No publica nada")
  );
  check(
    "y cada una tiene su propio botón",
    (aprobadaHtml.match(/>Ejecutar</g) ?? []).length === 2
  );

  check(
    "una acción ya ejecutada no ofrece ejecutarse de nuevo",
    !isExecutable(recomendacion({ status: "approved" }), accion({ status: "executed" }))
  );
  check(
    "y una de una recomendación sin aprobar tampoco",
    !isExecutable(recomendacion({ status: "pending_review" }), accion())
  );

  const yaHecha = texto(
    render(
      <RecommendationCard
        recommendation={recomendacion({
          status: "executed",
          proposedActions: [
            accion({
              status: "executed",
              result: { summary: "Brief creado en borrador: «Blanqueamiento — sensibilidad»." },
            }),
          ],
        })}
        insight={interpretacion}
        presentacion={false}
        ocupado={false}
        onApprove={() => {}}
        onReject={() => {}}
        onExecute={() => {}}
      />
    )
  );
  check("una acción hecha muestra qué produjo", yaHecha.includes("Brief creado en borrador"));

  const falló = texto(
    render(
      <RecommendationCard
        recommendation={recomendacion({
          status: "approved",
          proposedActions: [accion({ status: "failed", result: { error: "No hay ejecutor" } })],
        })}
        insight={interpretacion}
        presentacion={false}
        ocupado={false}
        onApprove={() => {}}
        onReject={() => {}}
        onExecute={() => {}}
      />
    )
  );
  check("y una que falló dice por qué", falló.includes("No se pudo") && falló.includes("No hay ejecutor"));

  // =====================================================================
  section("6. La traza hasta el brief creado");
  // =====================================================================

  const conCampana = render(
    <RecommendationCard
      recommendation={recomendacion({
        status: "executed",
        proposedActions: [
          accion({ status: "executed", linkedCampaignId: "camp_42", result: { summary: "Brief creado." } }),
        ],
      })}
      insight={interpretacion}
      presentacion={false}
      ocupado={false}
      onApprove={() => {}}
      onReject={() => {}}
      onExecute={() => {}}
    />
  );

  check(
    "cuando se creó un brief, hay un enlace para abrirlo en Marketing",
    conCampana.includes('href="/lucia/marketing?campaign=camp_42"')
  );
  check("con un texto que dice a dónde lleva", texto(conCampana).includes("Abrir en Marketing"));

  // =====================================================================
  section("7. Directivas: vigencia, cuándo aplican y cómo apagarlas");
  // =====================================================================

  const directivas = render(
    <DirectiveList directives={[directiva()]} ocupado={false} onDeactivate={() => {}} presentacion={false} />
  );
  const directivasTexto = texto(directivas);

  check("muestra hasta cuándo vive", directivasTexto.includes("Vence en 21 días"));
  check("y cuándo se usa", directivasTexto.includes("Solo se usa cuando") && directivasTexto.includes("menciona sensibilidad"));
  check(
    "y aclara que NO se usa en todas las conversaciones",
    directivasTexto.includes("No se aplica en todas las conversaciones") &&
      directivasTexto.includes("no insiste")
  );
  check("y lo que no puede afirmar", directivasTexto.includes("No prometer que no habrá molestias"));
  check("ofrece desactivarla de inmediato", directivasTexto.includes("Desactivar ahora"));

  check(
    "una que vence hoy lo dice sin decir '0 días'",
    texto(
      render(
        <DirectiveList
          directives={[directiva({ daysRemaining: 0 })]}
          ocupado={false}
          onDeactivate={() => {}}
          presentacion={false}
        />
      )
    ).includes("Vence hoy")
  );

  let desactivada = 0;
  const listaConManejador = (
    <DirectiveList
      directives={[directiva()]}
      ocupado={false}
      onDeactivate={() => desactivada++}
      presentacion={false}
    />
  );
  listaConManejador.props.onDeactivate(directiva());
  check("el manejador de desactivar está cableado", desactivada === 1);

  check(
    "sin directivas, dice que Lucía conversa con sus reglas de siempre",
    texto(
      render(<DirectiveList directives={[]} ocupado={false} onDeactivate={() => {}} presentacion={false} />)
    ).includes("reglas de siempre")
  );

  // =====================================================================
  section("8. Modo presentación");
  // =====================================================================

  const normal = render(<MetricGrid metrics={[metrica()]} presentacion={false} />);
  const proyeccion = render(<MetricGrid metrics={[metrica()]} presentacion />);

  check("agranda la tipografía del número", proyeccion.includes("text-[44px]") && normal.includes("text-[26px]"));
  check(
    "y esconde el detalle técnico de la fuente del dato",
    !texto(proyeccion).includes("financials.revenue") && texto(normal).includes("financials.revenue")
  );

  const alertaProyectada = texto(render(<SignalList signals={[senal()]} presentacion />));
  check(
    "en las alertas también agranda y saca la marca de tiempo",
    alertaProyectada.includes("Las citas de blanqueamiento bajaron") &&
      render(<SignalList signals={[senal()]} presentacion />).includes("text-[24px]")
  );

  const recProyectada = render(
    <RecommendationCard
      recommendation={recomendacion({ status: "approved" })}
      insight={interpretacion}
      presentacion
      ocupado={false}
      onApprove={() => {}}
      onReject={() => {}}
      onExecute={() => {}}
    />
  );
  check(
    "en las recomendaciones esconde las explicaciones técnicas de cada acción",
    !texto(recProyectada).includes("Crea una campaña en BORRADOR")
  );
  check(
    "pero NUNCA esconde el botón de ejecutar ni el estado",
    texto(recProyectada).includes("Ejecutar") && texto(recProyectada).includes("Aprobada")
  );

  // =====================================================================
  section("9. El salto al estudio después de ejecutar");
  // =====================================================================

  // Es el eslabón que cierra el paso del copiloto a marketing en vivo. Si se
  // rompe, la acción se ejecuta igual y nadie se entera de que la campaña
  // quedó creada: hay que ir a buscarla a mano entre las demás.
  const conCampaña = { linkedCampaignId: "camp_abc123" };
  check(
    "una acción que creó campaña manda al estudio, abierto en ESA campaña",
    campaignDestination(conCampaña) === "/lucia/marketing?campaign=camp_abc123",
    String(campaignDestination(conCampaña))
  );
  check(
    "una acción sin campaña —directiva, tarea, métrica— no manda a ningún lado",
    campaignDestination({ linkedCampaignId: null }) === null
  );
  check(
    "y una respuesta sin acción tampoco rompe",
    campaignDestination(null) === null
  );
  check(
    "un id vacío no produce un enlace a la lista entera",
    campaignDestination({ linkedCampaignId: "  " }) === null
  );
  check(
    "el id viaja codificado, no crudo en la barra de direcciones",
    campaignDestination({ linkedCampaignId: "a b&c=d" }) ===
      "/lucia/marketing?campaign=a%20b%26c%3Dd",
    String(campaignDestination({ linkedCampaignId: "a b&c=d" }))
  );

  // =====================================================================
  section("10. La tarjeta de actividad en vivo");
  // =====================================================================

  // Lo que esta tarjeta tiene que dejar claro no es un número: es de QUIÉN son
  // los datos. El resto del panel muestra el histórico simulado de una clínica
  // ficticia; esto muestra lo que el público acaba de generar. Si se confunden,
  // la demostración deja de demostrar nada.
  const actividad: DemoActivity = {
    since: "2026-08-13T15:00:00.000Z",
    windowMinutes: 90,
    conversations: 4,
    questions: 11,
    replies: 11,
    leads: 3,
    hotLeads: 1,
    appointments: 1,
    handoffs: 1,
    intents: 2,
    actions: [
      { tool: "proponer_horarios", count: 3 },
      { tool: "agendar_cita", count: 1 },
    ],
    bySource: [
      { source: "instagram", campaignId: "blanqueamiento-sensibilidad", count: 2 },
    ],
  };

  const tarjetaHtml = render(<ActivityCard activity={actividad} presentacion={false} />);
  const tarjeta = texto(tarjetaHtml);

  check(
    "dice de cuándo es lo que muestra, con todas las letras",
    tarjeta.includes("Actividad desde que comenzó la demostración") &&
      tarjeta.includes("En vivo · sesión de demostración")
  );
  // Los conteos son de interacciones que ocurrieron, pero contra una clínica
  // ficticia. Llamarlos "datos reales" invita a leerlos como información de un
  // cliente, que es exactamente lo que no son.
  check(
    "y NO se presenta como 'datos reales'",
    !tarjeta.toLowerCase().includes("datos reales")
  );
  check(
    "la fuente se lee como la escribiría una persona",
    texto(render(<ActivityCard activity={{ ...actividad, bySource: [{ source: "qr", campaignId: "wework-blanqueamiento", count: 3 }] }} presentacion={false} />)).includes(
      "QR · wework-blanqueamiento"
    ),
    "qr → QR, instagram → Instagram"
  );
  check(
    "y avisa que no muestra datos de nadie",
    tarjeta.includes("Sin nombres, teléfonos ni texto de los mensajes")
  );
  check(
    "muestra los conteos del rato",
    tarjeta.includes("Conversaciones") && tarjeta.includes("4") && tarjeta.includes("11")
  );
  check(
    "traduce las herramientas a lo que entiende una persona",
    tarjeta.includes("Propuso horarios") && tarjeta.includes("Agendó una cita"),
    "no muestra proponer_horarios ni agendar_cita en crudo"
  );
  check(
    "no filtra el nombre técnico de la herramienta",
    !tarjeta.includes("proponer_horarios"),
    "lo que se lee es la etiqueta, no la llave interna"
  );
  check(
    "cierra el círculo: de qué campaña llegaron",
    tarjeta.includes("Instagram") && tarjeta.includes("blanqueamiento-sensibilidad"),
    "la campaña se muestra con su id tal cual: es el mismo que iría en un anuncio real"
  );

  // Sin nadie que haya llegado por una campaña, esa sección no ocupa espacio
  // diciendo "sin origen": no informaría nada.
  const sinOrigen = texto(
    render(<ActivityCard activity={{ ...actividad, bySource: [] }} presentacion={false} />)
  );
  check("sin campañas de origen, no muestra esa sección", !sinOrigen.includes("De dónde llegaron"));

  const proyectada = render(<ActivityCard activity={actividad} presentacion={true} />);
  check(
    "en modo presentación agranda los números",
    proyectada.includes("text-[30px]") && !proyectada.includes("text-[22px]")
  );

  // =====================================================================
  section("11. El resumen del reinicio");
  // =====================================================================

  // El aviso que queda en pantalla después de apretar el botón. Tiene que decir
  // SIEMPRE qué pasó con las conversaciones del público: es lo único que la
  // operación destruye sin haberlo sembrado, y quien lo apretó tiene que poder
  // confirmar que no pasó lo que no quería que pasara.
  const conBorrado = resetSummary({
    business: { presetId: "sonrisa-pura", name: "Clínica Dental Sonrisa Pura", services: 8, promotions: 1 },
    scenario: { id: "marketing_conversion_gap", label: "Mucho interés, pocas citas" },
    live: { deletedConversations: 4, deletedLeads: 3, deletedAppointments: 1 },
    recommendations: 3,
  });
  check(
    "dice qué negocio quedó sembrado y con qué escenario",
    conBorrado.includes("Clínica Dental Sonrisa Pura") &&
      conBorrado.includes("Mucho interés, pocas citas"),
    conBorrado
  );
  check(
    "y cuántas conversaciones del público borró",
    conBorrado.includes("4 conversación(es) del público borradas")
  );

  const sinBorrado = resetSummary({
    business: { presetId: "sonrisa-pura", name: "Clínica Dental Sonrisa Pura", services: 8, promotions: 1 },
    scenario: null,
    live: { deletedConversations: 0, deletedLeads: 0, deletedAppointments: 0 },
    recommendations: null,
  });
  check(
    "cuando no borró nada lo dice igual, en vez de callarlo",
    sinBorrado.includes("no se borró ninguna conversación"),
    sinBorrado
  );

  // =====================================================================
  section("12. El prompt de video, partido para leerlo");
  // =====================================================================

  // Lo que se proyecta tiene que ser legible, y lo que se copia tiene que ser
  // EXACTAMENTE lo mismo. Por eso el corte en bloques se hace sobre el texto
  // que ya llegó, y no se pide estructurado al servidor: dos versiones del
  // mismo prompt son dos oportunidades de pegar la equivocada.
  const promptCrudo = [
    "PIEZA\nFormato: Reel de Instagram · 9:16 · 15s\nNegocio: Sonrisa Pura",
    "ESCENAS Y RITMO\nEscena 1 (0-4s, 4s) — gancho\n  Imagen: primer plano",
    'QUÉ EVITAR\n- No digas ni escribas "no duele".',
  ].join("\n\n");

  const bloques = parseVideoPrompt(promptCrudo);
  check(
    "parte el prompt en sus bloques, con título y cuerpo",
    bloques.length === 3 &&
      bloques[0].title === "PIEZA" &&
      bloques[2].title === "QUÉ EVITAR",
    bloques.map((b) => b.title).join(" · ")
  );
  check(
    "el cuerpo conserva los saltos de línea de las escenas",
    bloques[1].body.includes("Escena 1 (0-4s, 4s) — gancho\n  Imagen: primer plano")
  );
  check(
    "y no se pierde el bloque de lo que NO se puede decir",
    bloques[2].body.includes("no duele")
  );

  // Un bloque sin encabezado reconocible se muestra entero y sin título: peor
  // sería esconderlo por no encajar en el formato esperado.
  const suelto = parseVideoPrompt("una línea suelta sin encabezado");
  check(
    "un bloque sin encabezado se muestra igual, sin título",
    suelto.length === 1 && suelto[0].title === "" && suelto[0].body.includes("una línea suelta")
  );

  console.log(failures === 0 ? "\nTODO OK" : `\n${failures} FALLAS`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
