"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  campaignDestination,
  copilotApi,
  dateTime,
  resetSummary,
  type DemoActivity,
  type DemoResetResult,
  type BusinessRecommendation,
  type ConversationDirective,
  type CopilotSummary,
  type ProposedAction,
  type ScenarioState,
} from "@/lib/copilot";
import { ActivityCard } from "./ActivityCard";
import { DirectiveList } from "./DirectiveList";
import { MetricGrid } from "./MetricGrid";
import { RecommendationCard } from "./RecommendationCard";
import { ScenarioPicker } from "./ScenarioPicker";
import { SignalList } from "./SignalList";

/**
 * El Copiloto de Negocio: un centro de decisión, no otro chat.
 *
 * La pantalla está ordenada como se toma una decisión: primero en qué estado
 * está el negocio, después qué se detectó, después qué se recomienda hacer, y
 * al final qué quedó activo. No hay una caja de texto para preguntarle nada al
 * modelo, y es a propósito — lo que se demuestra no es que la IA sepa
 * conversar, es que puede conectar datos, detectar algo y coordinar acciones
 * que una persona aprueba.
 *
 * Todo el estado de red vive acá y los componentes de abajo son de
 * presentación: es el mismo reparto que usan el panel de marketing y el de
 * interesados, y permite que cada vista se pruebe pasándole props.
 */

/** Una lectura completa. Devuelve datos o lanza, sin estado de React adentro. */
async function leerTodo(): Promise<{
  summary: CopilotSummary;
  scenarios: ScenarioState;
  activity: DemoActivity | null;
}> {
  const [summary, scenarios, activity] = await Promise.all([
    copilotApi<CopilotSummary>("summary"),
    copilotApi<ScenarioState>("scenarios"),
    // La actividad en vivo NO puede tumbar el panel: es lo accesorio del
    // relato, y el copiloto tiene que poder mostrarse aunque esa consulta
    // falle. Un backend viejo, sin esta ruta, devuelve 404 y acá queda `null`.
    copilotApi<DemoActivity>("demo/activity").catch(() => null),
  ]);
  return { summary, scenarios, activity };
}

type Vista = "panel" | "escenarios";

export function CopilotExplorer() {
  const router = useRouter();
  const [summary, setSummary] = useState<CopilotSummary | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioState | null>(null);
  const [activity, setActivity] = useState<DemoActivity | null>(null);
  const [vista, setVista] = useState<Vista>("panel");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** Qué está pasando ahora mismo, para el aviso de progreso. */
  const [trabajando, setTrabajando] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  /** Modo proyección: tipografía grande y sin detalle técnico. */
  const [presentacion, setPresentacion] = useState(false);
  const [version, setVersion] = useState(0);

  // El estado se toca solo en las devoluciones de la promesa, nunca de forma
  // síncrona en el cuerpo del efecto: es lo que evita el render en cascada, y
  // es el mismo reparto que usa el panel de marketing. Para las relecturas no
  // hace falta volver a "cargando": el aviso de progreso ya dice qué pasa.
  useEffect(() => {
    let cancelled = false;

    void leerTodo().then(
      (datos) => {
        if (cancelled) return;
        setSummary(datos.summary);
        setScenarios(datos.scenarios);
        setActivity(datos.activity);
        setError(null);
        setCargando(false);
      },
      (err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "No se pudo cargar el copiloto");
        setCargando(false);
      }
    );

    return () => {
      cancelled = true;
    };
  }, [version]);

  /**
   * Corre una operación mostrando progreso y refrescando al terminar.
   *
   * El error se muestra y la vista NO se queda a medias: si algo falla, se
   * vuelve a leer igual, porque el backend pudo haber hecho parte del trabajo y
   * mostrar datos viejos sería peor que mostrar el error.
   */
  const operar = useCallback(async (etiqueta: string, work: () => Promise<string | null>) => {
    setTrabajando(etiqueta);
    setError(null);
    setAviso(null);
    try {
      const mensaje = await work();
      if (mensaje) setAviso(mensaje);
    } catch (err) {
      setError(err instanceof Error ? err.message : "La operación no se pudo completar");
    } finally {
      setTrabajando(null);
      setVersion((v) => v + 1);
    }
  }, []);

  const analizar = () =>
    operar("Analizando el negocio…", async () => {
      await copilotApi("analyze", { method: "POST", body: {} });
      return "Análisis terminado.";
    });

  const activar = (scenarioId: string, analizarDespues: boolean) =>
    operar("Activando el escenario…", async () => {
      await copilotApi("scenarios/activate", {
        method: "POST",
        body: { scenarioId, analyze: analizarDespues },
      });
      setVista("panel");
      return analizarDespues
        ? "Escenario activado y análisis corrido."
        : "Escenario activado. Ya podés analizar el negocio.";
    });

  const resetear = () =>
    operar("Reiniciando el escenario…", async () => {
      await copilotApi("scenarios/reset", { method: "POST", body: {} });
      return "Escenario reiniciado: los datos volvieron al punto de partida.";
    });

  /**
   * Dejar todo listo para dar la demostración de nuevo.
   *
   * Pide confirmación y lo hace nombrando lo que se va a borrar. Es el único
   * botón del panel que destruye algo que la demostración no sembró —las
   * conversaciones que dejó el público— y esa parte no puede pasar de
   * incógnito detrás de un "¿seguro?".
   */
  const reiniciarTodo = () => {
    const ok = window.confirm(
      "Esto deja todo listo para dar la demostración otra vez:\n\n" +
        "· vuelve a sembrar los servicios y precios del negocio\n" +
        "· vuelve a sembrar los datos del escenario\n" +
        "· BORRA las conversaciones del chat del sitio de las últimas 3 horas,\n" +
        "  con sus interesados y sus citas\n\n" +
        "Las conversaciones de WhatsApp no se tocan.\n\n¿Reiniciar?"
    );
    if (!ok) return;

    void operar("Reiniciando la demostración…", async () => {
      const resultado = await copilotApi<DemoResetResult>("demo/reset", {
        method: "POST",
        // Tres horas: cubre una charla con su montaje y su sobremesa, y no
        // llega al día anterior.
        body: { clearLiveMinutes: 180 },
      });
      return resetSummary(resultado);
    });
  };

  const aprobar = (recommendation: BusinessRecommendation) =>
    operar("Aprobando…", async () => {
      await copilotApi(`recommendations/${recommendation.id}/approve`, {
        method: "POST",
        body: {},
      });
      return "Aprobada. Ahora podés ejecutar cada acción por separado.";
    });

  const rechazar = (recommendation: BusinessRecommendation) =>
    operar("Rechazando…", async () => {
      await copilotApi(`recommendations/${recommendation.id}/reject`, { method: "POST", body: {} });
      return "Rechazada.";
    });

  /**
   * Ejecuta una acción y, si creó una campaña, abre el estudio en ella.
   *
   * El salto importa: sin él, quien aprueba un brief lee "se creó la campaña X"
   * y tiene que ir a buscarla a mano entre las demás. La acción ya devuelve
   * `linkedCampaignId` —lo llenó `marketingBridge` al crearla— así que el
   * destino es exacto y no una lista donde adivinar cuál es la nueva.
   *
   * Se navega también cuando la acción YA estaba ejecutada: apretar dos veces
   * tiene que llevar al mismo lugar, no quedarse con un aviso y sin campaña.
   */
  const ejecutar = (recommendation: BusinessRecommendation, action: ProposedAction) =>
    operar("Ejecutando la acción…", async () => {
      const resultado = await copilotApi<{
        action: ProposedAction;
        summary: string;
        alreadyExecuted: boolean;
      }>(
        `recommendations/${recommendation.id}/actions/${action.id}/execute`,
        // La llave de idempotencia viaja para que un reintento no ejecute dos
        // veces: si el pedido llegó y la respuesta se perdió, el segundo
        // devuelve lo que produjo el primero en vez de crear otra campaña.
        { method: "POST", body: { idempotencyKey: action.idempotencyKey } }
      );

      const destino = campaignDestination(resultado.action ?? null);
      if (destino) {
        router.push(destino);
        return resultado.alreadyExecuted
          ? "Esa acción ya estaba hecha. Abriendo la campaña…"
          : `${resultado.summary} Abriendo el estudio…`;
      }

      return resultado.alreadyExecuted ? "Esa acción ya estaba hecha." : resultado.summary;
    });

  const desactivar = (directive: ConversationDirective) =>
    operar("Desactivando la directiva…", async () => {
      await copilotApi(`directives/${directive.id}/deactivate`, { method: "POST", body: {} });
      return "Directiva desactivada. Lucía deja de usarla de inmediato.";
    });

  if (cargando && !summary) {
    return (
      <main className="mx-auto max-w-[1100px] px-4 py-8 dk:px-8">
        <p className="text-[14px] text-tinta-500">Cargando el copiloto…</p>
      </main>
    );
  }

  const ocupado = trabajando !== null;
  const pendientes = (summary?.recommendations ?? []).filter((r) => r.status === "pending_review");
  const resueltas = (summary?.recommendations ?? []).filter(
    (r) => r.status !== "pending_review" && r.status !== "superseded"
  );
  const insightPara = (recommendation: BusinessRecommendation) =>
    (summary?.insights ?? []).find((i) =>
      i.signalIds.some((id) => recommendation.signalIds.includes(id))
    ) ??
    summary?.insights[0] ??
    null;

  return (
    <main
      className={`mx-auto max-w-[1100px] px-4 py-8 dk:px-8 ${presentacion ? "text-[17px]" : ""}`}
    >
      <Encabezado
        summary={summary}
        scenarios={scenarios}
        presentacion={presentacion}
        ocupado={ocupado}
        onTogglePresentacion={() => setPresentacion((v) => !v)}
        onCambiarEscenario={() => setVista("escenarios")}
        onResetear={resetear}
        onReiniciarTodo={reiniciarTodo}
        onAnalizar={analizar}
      />

      {/* Progreso, error y aviso. Los tres pueden convivir; ninguno reemplaza
          a la pantalla, para que nada quede en un estado ambiguo. */}
      {trabajando && (
        <p
          role="status"
          className="mb-4 rounded-lg border border-menta-200 bg-verde-50 px-4 py-3 text-[13.5px] text-verde-800"
        >
          {trabajando}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-error-bd bg-error-bg px-4 py-3 text-[13.5px] text-error-tx"
        >
          {error}
        </p>
      )}
      {aviso && !error && (
        <p className="mb-4 rounded-lg border border-arena-200 bg-blanco px-4 py-3 text-[13.5px] text-tinta-600">
          {aviso}
        </p>
      )}

      {vista === "escenarios" && scenarios ? (
        <ScenarioPicker
          state={scenarios}
          ocupado={ocupado}
          onActivate={activar}
          onCancel={() => setVista("panel")}
        />
      ) : (
        <div className="flex flex-col gap-8">
          {/*
            Va PRIMERO, arriba de las métricas del mes. Es el orden del relato:
            el público acaba de conversar con Lucía y lo primero que tiene que
            ver es lo que él mismo generó. Después viene el histórico, que es
            simulado y está rotulado como tal.

            Si nadie escribió todavía, la tarjeta no aparece: una fila de ceros
            no informa nada y le quita el efecto al momento en que sí aparece.
          */}
          {activity && activity.conversations > 0 && (
            <ActivityCard activity={activity} presentacion={presentacion} />
          )}

          <section>
            <SeccionTitulo>Cómo viene el negocio</SeccionTitulo>
            <MetricGrid metrics={summary?.metrics ?? []} presentacion={presentacion} />
          </section>

          <section>
            <SeccionTitulo>
              Qué se detectó
              {summary && summary.signals.length > 0 ? ` (${summary.signals.length})` : ""}
            </SeccionTitulo>
            <SignalList signals={summary?.signals ?? []} presentacion={presentacion} />
          </section>

          <section>
            <SeccionTitulo>
              Qué conviene hacer
              {pendientes.length > 0 ? ` · ${pendientes.length} esperando tu revisión` : ""}
            </SeccionTitulo>

            {(summary?.recommendations ?? []).length === 0 ? (
              <p className="rounded-xl border border-arena-200 bg-blanco px-4 py-6 text-center text-[14px] text-tinta-500">
                Todavía no hay recomendaciones. Analizá el negocio para generarlas.
              </p>
            ) : (
              <ul className="flex flex-col gap-4">
                {[...pendientes, ...resueltas].map((recommendation) => (
                  <RecommendationCard
                    key={recommendation.id}
                    recommendation={recommendation}
                    insight={insightPara(recommendation)}
                    presentacion={presentacion}
                    ocupado={ocupado}
                    onApprove={() => aprobar(recommendation)}
                    onReject={() => rechazar(recommendation)}
                    onExecute={(action) => ejecutar(recommendation, action)}
                  />
                ))}
              </ul>
            )}
          </section>

          <section>
            <SeccionTitulo>Qué está aplicando Lucía ahora</SeccionTitulo>
            <DirectiveList
              directives={summary?.directives ?? []}
              ocupado={ocupado}
              onDeactivate={desactivar}
              presentacion={presentacion}
            />
          </section>

          <nav className="flex flex-wrap gap-2 border-t border-arena-200 pt-5">
            <Enlace href="/lucia/marketing">Marketing</Enlace>
            <Enlace href="/lucia/citas">Citas</Enlace>
            <Enlace href="/lucia/leads">Interesados</Enlace>
            <Enlace href="/lucia/chats">Chats</Enlace>
          </nav>
        </div>
      )}
    </main>
  );
}

function Encabezado({
  summary,
  scenarios,
  presentacion,
  ocupado,
  onTogglePresentacion,
  onCambiarEscenario,
  onResetear,
  onReiniciarTodo,
  onAnalizar,
}: {
  summary: CopilotSummary | null;
  scenarios: ScenarioState | null;
  presentacion: boolean;
  ocupado: boolean;
  onTogglePresentacion: () => void;
  onCambiarEscenario: () => void;
  onResetear: () => void;
  onReiniciarTodo: () => void;
  onAnalizar: () => void;
}) {
  const run = summary?.run ?? null;
  const criticas = summary?.counts.criticalSignals ?? 0;
  const pendientes = summary?.counts.openRecommendations ?? 0;

  const estado =
    run === null
      ? "Sin analizar"
      : criticas > 0
        ? "Requiere atención"
        : pendientes > 0
          ? "Con propuestas por revisar"
          : "Sin alertas";

  return (
    <header className="mb-6">
      <Link href="/" className="text-[13px] font-semibold text-verde-800 hover:underline">
        ← Volver al sitio
      </Link>

      <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1
            className={`font-display leading-tight text-tinta-900 ${
              presentacion ? "text-[42px]" : "text-[30px]"
            }`}
          >
            Copiloto de Negocio
          </h1>
          <p className={`mt-1 text-tinta-600 ${presentacion ? "text-[17px]" : "text-[14.5px]"}`}>
            Mira los números de la clínica, detecta lo que se salió de lo normal y propone qué
            hacer. Nada se ejecuta sin que vos lo apruebes.
          </p>
        </div>

        <button
          type="button"
          onClick={onTogglePresentacion}
          aria-pressed={presentacion}
          className="rounded-full border-[1.5px] border-menta-200 bg-blanco px-4 py-2 text-[13px] font-semibold text-verde-800 transition-colors hover:bg-verde-50"
        >
          {presentacion ? "Salir de presentación" : "Modo presentación"}
        </button>
      </div>

      {/*
        El aviso de datos simulados va SIEMPRE visible, también en modo
        presentación —sobre todo en modo presentación—. Es una clínica ficticia
        y nadie que vea la pantalla proyectada debería dudarlo.
      */}
      <p className="mt-3 inline-block rounded-full border border-ambar-bd bg-ambar-bg px-3.5 py-1.5 font-mono text-[11px] tracking-[0.08em] text-ambar-tx uppercase">
        Datos simulados · clínica ficticia
      </p>

      <dl className="mt-4 flex flex-wrap gap-x-7 gap-y-2 border-y border-arena-200 py-3">
        <Dato etiqueta="Escenario" valor={scenarios?.active?.label ?? "Ninguno activo"} />
        <Dato
          etiqueta="Último análisis"
          valor={run ? dateTime(run.createdAt) : "Todavía no corrió"}
        />
        <Dato etiqueta="Estado" valor={estado} destacado={criticas > 0} />
        {!presentacion && (
          <Dato
            etiqueta="Modo"
            valor={
              summary?.analysis.deterministic
                ? "Determinista (sin IA)"
                : `IA · ${summary?.analysis.provider ?? ""}`
            }
          />
        )}
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={ocupado}
          onClick={onAnalizar}
          className="rounded-lg bg-verde-800 px-4 py-2.5 text-[14px] font-semibold text-crema-100 shadow-suave transition-colors hover:bg-verde-950 disabled:opacity-50"
        >
          Analizar el negocio
        </button>
        <button
          type="button"
          disabled={ocupado}
          onClick={onCambiarEscenario}
          className="rounded-lg border-[1.5px] border-menta-200 bg-blanco px-4 py-2.5 text-[14px] font-semibold text-verde-800 transition-colors hover:bg-verde-50 disabled:opacity-50"
        >
          Cambiar escenario
        </button>
        <button
          type="button"
          disabled={ocupado || !scenarios?.active || !scenarios.enabled}
          onClick={onResetear}
          className="rounded-lg border-[1.5px] border-arena-300 bg-blanco px-4 py-2.5 text-[14px] font-semibold text-tinta-600 transition-colors hover:bg-arena-50 disabled:opacity-50"
        >
          Reiniciar escenario
        </button>
        {/*
          El reinicio completo va al final y con borde de advertencia: es el
          único de los cuatro que borra algo que la demostración no sembró. En
          modo presentación se esconde — nadie quiere apretarlo por error con la
          pantalla proyectada y la sala mirando.
        */}
        {!presentacion && (
          <button
            type="button"
            disabled={ocupado || !scenarios?.enabled}
            onClick={onReiniciarTodo}
            className="rounded-lg border-[1.5px] border-ambar-bd bg-blanco px-4 py-2.5 text-[14px] font-semibold text-ambar-tx transition-colors hover:bg-ambar-bg disabled:opacity-50"
          >
            Dejar listo para otra demo
          </button>
        )}
      </div>
    </header>
  );
}

function Dato({
  etiqueta,
  valor,
  destacado,
}: {
  etiqueta: string;
  valor: string;
  destacado?: boolean;
}) {
  return (
    <div>
      <dt className="font-mono text-[10px] tracking-[0.08em] text-tinta-500 uppercase">
        {etiqueta}
      </dt>
      <dd className={`text-[14.5px] font-semibold ${destacado ? "text-error-tx" : "text-tinta-900"}`}>
        {valor}
      </dd>
    </div>
  );
}

function SeccionTitulo({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 font-mono text-[11px] tracking-[0.14em] text-verde-700 uppercase">
      {children}
    </h2>
  );
}

function Enlace({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-full border-[1.5px] border-menta-200 bg-blanco px-4 py-2 text-[13px] font-semibold text-verde-800 transition-colors hover:bg-verde-50"
    >
      {children}
    </Link>
  );
}
