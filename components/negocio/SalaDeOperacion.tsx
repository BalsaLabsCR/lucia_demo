"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { NEGOCIO } from "@/lib/negocio/datos";
import { DOMINIOS, ETIQUETAS } from "@/lib/negocio/dominios";
import { type Tema } from "@/lib/negocio/tema";
import type { DominioId, Pestana } from "@/lib/negocio/types";
import { IdentidadAgente, Roster } from "./Agentes";
import { TarjetaCoordinacion } from "./Coordinacion";
import { Documentos } from "./Documentos";
import { HallazgoCard } from "./HallazgoCard";
import { Metricas } from "./Metricas";
import { BloqueDePropuestas } from "./Propuestas";
import { Columnas, MapaDeCalor, SerieTemporal } from "./Graficas";
import { BarrasHorizontales, RangoDePrecios, TablaSimple } from "./Visuales";
import { Rotulo } from "./ui";

/**
 * La Sala de Operación: seis agentes mirando seis cosas del mismo negocio.
 *
 * **Es una maqueta.** Todo lo que se ve sale de `lib/negocio/datos.ts`, un
 * archivo escrito a mano. No corre ningún agente, no se llama a ningún modelo y
 * no se consulta ninguna base — lo que se demuestra es cómo SE VERÍA un negocio
 * operado con IA como capa central. La única pestaña que va a consultar de
 * verdad es Documentos, y todavía no está conectada.
 *
 * Por qué es una página aparte de `/lucia/copiloto` y no una reforma de esa:
 * porque corre sin backend. En una charla, una pantalla que no depende de nada
 * es una pantalla que no se cae.
 *
 * Tres decisiones pensadas para el vivo y no para el navegador:
 *
 *   - **la pestaña va en la URL** (`?tab=planilla`), así se puede ensayar, dejar
 *     un enlace preparado y —sobre todo— recuperarse recargando si algo se
 *     traba, sin volver al principio;
 *   - **teclas 1 a 6**, porque buscar el mouse en un proyector es la diferencia
 *     entre fluido y torpe;
 *   - **nada persiste.** Aprobar y ejecutar viven en memoria: recargar deja la
 *     maqueta lista para la charla siguiente, sin botón de reinicio.
 */

const PESTANAS = DOMINIOS.map((id) => ({ id, etiqueta: ETIQUETAS[id] }));

export function SalaDeOperacion({
  inicial,
  temaInicial,
}: {
  inicial: DominioId;
  temaInicial: Tema;
}) {
  const [activa, setActiva] = useState<DominioId>(inicial);
  /**
   * Claro o oscuro. El claro es el default porque es el que se ve en un
   * proyector con las luces prendidas; el oscuro está para una sala a oscuras.
   * Cuál conviene lo decide el cuarto, así que se cambia con una tecla.
   */
  const [tema, setTema] = useState<Tema>(temaInicial);
  const [presentacion, setPresentacion] = useState(false);
  /**
   * El disparador de la revisión. 0 = en reposo, y en reposo se ve TODO.
   *
   * Una pantalla que arranca vacía y se llena sola es un riesgo en vivo: si el
   * proyector tarda en enganchar, la sala ve el final y se pierde el proceso.
   * Con el botón, el orador elige el momento.
   */
  const [token, setToken] = useState(0);

  // La pestaña ENTRA por prop —la lee el servidor de `?tab=`— y SALE por
  // `replaceState`, que no dispara navegación ni vuelve a montar nada. Leerla
  // acá con un efecto pintaría primero Dirección y después la correcta: un
  // parpadeo al abrir el enlace que uno dejó preparado para la charla.
  const ir = useCallback((id: DominioId) => {
    setActiva(id);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", id);
    window.history.replaceState(null, "", url);
  }, []);

  /**
   * El siguiente tema se calcula ANTES de tocar el estado, no adentro del
   * updater de `setTema`.
   *
   * React puede correr esa función durante el render, y `replaceState` avisa al
   * router de Next: eso es actualizar un componente mientras se renderiza otro,
   * que es exactamente el error que React reporta. Leer `tema` de la clausura
   * cuesta una dependencia en el `useCallback` y deja el efecto donde
   * corresponde — en el manejador, no en el render.
   */
  const alternarTema = useCallback(() => {
    const siguiente: Tema = tema === "claro" ? "oscuro" : "claro";
    setTema(siguiente);

    const url = new URL(window.location.href);
    url.searchParams.set("tema", siguiente);
    window.history.replaceState(null, "", url);
  }, [tema]);

  // Teclas 1–6 para las pestañas y "r" para revisar. Se ignoran mientras se
  // escribe: la pestaña de Documentos tiene una caja de texto y un "4" ahí
  // adentro tiene que escribir un 4.
  useEffect(() => {
    const enUnCampo = (destino: EventTarget | null) =>
      destino instanceof HTMLElement &&
      (destino.tagName === "INPUT" ||
        destino.tagName === "TEXTAREA" ||
        destino.isContentEditable);

    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.metaKey || evento.ctrlKey || evento.altKey || enUnCampo(evento.target)) return;

      const indice = Number(evento.key);
      if (indice >= 1 && indice <= PESTANAS.length) {
        ir(PESTANAS[indice - 1].id);
        return;
      }
      if (evento.key.toLowerCase() === "r") setToken((t) => t + 1);
      if (evento.key.toLowerCase() === "p") setPresentacion((v) => !v);
      if (evento.key.toLowerCase() === "t") alternarTema();
    };

    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [ir, alternarTema]);

  const agente = NEGOCIO.agentes.find((a) => a.id === activa) ?? NEGOCIO.agentes[0];

  return (
    // `sala-tema-*` hace dos cosas: redefine los tokens de color para todo lo
    // que cuelga de acá, y es la marca que `globals.css` busca con `:has()` para
    // teñir también el documento y la barra de scroll. Ver el comentario allá.
    <div
      className={`sala-tema-${tema} min-h-screen bg-sala-1000 text-sala-tx ${
        presentacion ? "sala-presentacion" : ""
      }`}
    >
      <Encabezado
        presentacion={presentacion}
        tema={tema}
        onPresentacion={() => setPresentacion((v) => !v)}
        onTema={alternarTema}
        onRevisar={() => setToken((t) => t + 1)}
      />

      <Nav activa={activa} onIr={ir} presentacion={presentacion} />

      <main className="mx-auto max-w-[1180px] px-4 pt-6 pb-16 dk:px-8">
        {activa === "direccion" && <VistaDireccion presentacion={presentacion} token={token} ir={ir} />}

        {activa === "documentos" && (
          <div className="flex flex-col gap-5">
            <IdentidadAgente
              agente={agente}
              hallazgos={0}
              propuestas={0}
              presentacion={presentacion}
              corriendo={false}
              // No produce hallazgos: contesta preguntas. Decir "0 hallazgos"
              // lo haría ver averiado justo en la pestaña donde se le va a
              // pedir algo al público.
              estado="Listo para consultar"
            />
            <Documentos presentacion={presentacion} />
          </div>
        )}

        {activa !== "direccion" && activa !== "documentos" && (
          <VistaDeArea
            pestana={NEGOCIO.pestanas[activa as keyof typeof NEGOCIO.pestanas]}
            presentacion={presentacion}
            token={token}
          />
        )}
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------

function Encabezado({
  presentacion,
  tema,
  onPresentacion,
  onTema,
  onRevisar,
}: {
  presentacion: boolean;
  tema: Tema;
  onPresentacion: () => void;
  onTema: () => void;
  onRevisar: () => void;
}) {
  return (
    <header className="border-b border-sala-bd bg-sala-900">
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-4 px-4 py-4 dk:px-8">
        <div className="min-w-0">
          <Link
            href="/"
            className="font-mono text-[11px] text-sala-tx3 transition-colors hover:text-sala-tx"
          >
            ← Volver al sitio
          </Link>
          <h1
            className={`mt-1 font-display leading-tight text-sala-tx ${
              presentacion ? "text-[38px]" : "text-[26px]"
            }`}
          >
            Sala de Operación
          </h1>
          <p className={`text-sala-tx3 ${presentacion ? "text-[16px]" : "text-[13px]"}`}>
            {NEGOCIO.meta.nombre} · {NEGOCIO.meta.periodo} · comparado contra{" "}
            {NEGOCIO.meta.periodoAnterior}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/*
            El aviso de datos de ejemplo va SIEMPRE visible, también en modo
            presentación — sobre todo en modo presentación. Es una clínica
            ficticia y nadie que vea la pantalla proyectada debería dudarlo.
          */}
          <span className="rounded-full border border-sala-tx/50 px-3 py-1.5 font-mono text-[10px] tracking-[0.1em] text-sala-tx uppercase">
            Datos de ejemplo · clínica ficticia
          </span>

          <button
            type="button"
            onClick={onRevisar}
            className="rounded-lg bg-sala-tx px-4 py-2 text-[13.5px] font-semibold text-sala-1000 transition-colors hover:bg-sala-tx2"
          >
            Revisar ahora
          </button>
          <button
            type="button"
            onClick={onPresentacion}
            aria-pressed={presentacion}
            className="rounded-lg border border-sala-bd px-4 py-2 text-[13.5px] font-semibold text-sala-tx2 transition-colors hover:border-sala-tx hover:text-sala-tx"
          >
            {presentacion ? "Salir de presentación" : "Modo presentación"}
          </button>
          {/*
            El tema va acá y no escondido en una tecla nada más porque hay que
            poder probarlo en el proyector cinco minutos antes de empezar, con la
            sala llenándose y sin acordarse de ningún atajo. La tecla `t` hace lo
            mismo para cuando ya se sabe.
          */}
          <button
            type="button"
            onClick={onTema}
            title="Cambiar el tema (tecla t)"
            className="rounded-lg border border-sala-bd px-3 py-2 font-mono text-[11px] tracking-[0.08em] text-sala-tx2 uppercase transition-colors hover:border-sala-tx hover:text-sala-tx"
          >
            {tema === "claro" ? "Oscuro" : "Claro"}
          </button>
        </div>
      </div>
    </header>
  );
}

function Nav({
  activa,
  onIr,
  presentacion,
}: {
  activa: DominioId;
  onIr: (id: DominioId) => void;
  presentacion: boolean;
}) {
  return (
    <nav
      aria-label="Áreas del negocio"
      className="sticky top-0 z-10 border-b border-sala-bd bg-sala-1000/95 backdrop-blur"
    >
      <ul className="mx-auto flex max-w-[1180px] gap-1 overflow-x-auto px-4 dk:px-8">
        {PESTANAS.map((pestana, i) => {
          const seleccionada = pestana.id === activa;
          return (
            <li key={pestana.id}>
              <button
                type="button"
                onClick={() => onIr(pestana.id)}
                aria-current={seleccionada ? "page" : undefined}
                className={`relative -mb-px whitespace-nowrap border-b-2 px-4 py-3 font-semibold transition-colors ${
                  presentacion ? "text-[18px]" : "text-[14px]"
                } ${
                  seleccionada
                    ? "border-sala-tx text-sala-tx"
                    : "border-transparent text-sala-tx3 hover:text-sala-tx2"
                }`}
              >
                {pestana.etiqueta}
                {!presentacion && (
                  <span className="ml-2 font-mono text-[10px] text-sala-tx3">{i + 1}</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// ---------------------------------------------------------------------------

/**
 * Dirección: el roster primero, después los números, después la conclusión.
 *
 * El orden es el relato de la charla. Primero "acá hay un equipo", después "así
 * viene el mes", y recién entonces lo que sale de cruzar las cuatro áreas —que
 * es lo único de esta pantalla que ninguna herramienta suelta podría producir.
 */
function VistaDireccion({
  presentacion,
  token,
  ir,
}: {
  presentacion: boolean;
  token: number;
  ir: (id: DominioId) => void;
}) {
  return (
    <div className="flex flex-col gap-8">
      <section>
        <Rotulo className="mb-3">
          {NEGOCIO.agentes.length} agentes vigilando el negocio
        </Rotulo>
        <Roster
          agentes={NEGOCIO.agentes}
          token={token}
          presentacion={presentacion}
          onIr={ir}
        />
      </section>

      {/*
        El tablero primero y la lectura después, y con el corte anunciado.
        
        Es el argumento de la charla puesto en el orden de la página: arriba va
        lo que un negocio YA tiene —o querría tener— en su Power BI, y abajo lo
        único que ninguna herramienta de BI le da. Sin la primera mitad, la
        segunda parece magia; con ella, parece el paso siguiente.
      */}
      <section className="flex flex-col gap-4">
        <Rotulo>Cómo viene el mes</Rotulo>
        <Metricas metricas={NEGOCIO.titulares} presentacion={presentacion} destacadas />
        <SerieTemporal grafica={NEGOCIO.serieGeneral} presentacion={presentacion} />
        <Columnas grafica={NEGOCIO.ingresoPorServicio} presentacion={presentacion} />
      </section>

      <section className="flex flex-col gap-3">
        <Corte>Lo que la IA vio en estos números</Corte>
        <TarjetaCoordinacion
          coordinacion={NEGOCIO.coordinacion}
          presentacion={presentacion}
          token={token}
        />
      </section>
    </div>
  );
}

/**
 * El corte entre el tablero y la lectura.
 *
 * Es una línea con un rótulo y hace más por la demostración que cualquier
 * gráfica: marca dónde termina lo que el gerente ya conoce y dónde empieza lo
 * que vino a ver. Sin este corte, los hallazgos parecen otro widget del panel.
 */
function Corte({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 flex items-center gap-4">
      <Rotulo className="shrink-0 !text-sala-tx">{children}</Rotulo>
      <span aria-hidden className="h-px flex-1 bg-sala-bd" />
    </div>
  );
}

function VistaDeArea({
  pestana,
  presentacion,
  token,
}: {
  pestana: Pestana;
  presentacion: boolean;
  token: number;
}) {
  const agente = NEGOCIO.agentes.find((a) => a.id === pestana.id)!;

  return (
    <div className="flex flex-col gap-5">
      <IdentidadAgente
        agente={agente}
        hallazgos={pestana.hallazgos.length}
        propuestas={pestana.propuestas.length}
        presentacion={presentacion}
        corriendo={false}
      />

      {/* La capa de BI: los números del área, como en cualquier tablero. */}
      <Metricas metricas={pestana.metricas} presentacion={presentacion} />

      {pestana.serie && <SerieTemporal grafica={pestana.serie} presentacion={presentacion} />}
      {pestana.mapa && <MapaDeCalor mapa={pestana.mapa} presentacion={presentacion} />}
      {pestana.barras && (
        <BarrasHorizontales barras={pestana.barras} presentacion={presentacion} />
      )}
      {pestana.columnas && <Columnas grafica={pestana.columnas} presentacion={presentacion} />}
      {pestana.tabla && <TablaSimple tabla={pestana.tabla} presentacion={presentacion} />}
      {pestana.rango && <RangoDePrecios rango={pestana.rango} presentacion={presentacion} />}

      {/* Y acá abajo, lo que un tablero no hace. */}
      <section className="flex flex-col gap-4">
        <Corte>
          Lo que la IA vio en estos números · {pestana.hallazgos.length} hallazgo
          {pestana.hallazgos.length === 1 ? "" : "s"}
        </Corte>
        {pestana.hallazgos.map((hallazgo, i) => (
          <HallazgoCard
            key={hallazgo.id}
            hallazgo={hallazgo}
            presentacion={presentacion}
            token={token}
            retrasoMs={i * 500}
          />
        ))}
      </section>

      <BloqueDePropuestas propuestas={pestana.propuestas} presentacion={presentacion} />
    </div>
  );
}
