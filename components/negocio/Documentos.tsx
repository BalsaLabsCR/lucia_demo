"use client";

import { useEffect, useState } from "react";
import {
  leerCatalogo,
  preguntar,
  type CatalogoDocumentos,
  type RespuestaDocumental,
} from "@/lib/negocio/documentos";
import { Panel, Rotulo } from "./ui";

/**
 * La pestaña de Documentos: la única con caja de texto, y hay que decir por qué
 * en voz alta.
 *
 *   "Las otras cinco no tienen dónde escribir. Un panel donde todo se pregunta
 *    es un chatbot con pestañas. Acá los agentes ya hicieron el trabajo; lo que
 *    se pregunta son los documentos."
 *
 * Es también la única que consulta de verdad: los PDFs están ingeridos con sus
 * embeddings y la respuesta se arma con búsqueda semántica. Por eso es la única
 * que puede fallar en vivo, y por eso tiene tres redes:
 *
 *   - las preguntas sugeridas, para no depender de que a alguien se le ocurra una;
 *   - el estado del catálogo, que dice si falta correr la ingesta en vez de
 *     contestar mal;
 *   - y el mensaje del backend tal cual, que dice qué falta hacer.
 */
export function Documentos({ presentacion }: { presentacion: boolean }) {
  const [catalogo, setCatalogo] = useState<CatalogoDocumentos | null>(null);
  const [errorCatalogo, setErrorCatalogo] = useState<string | null>(null);

  const [texto, setTexto] = useState("");
  const [consultando, setConsultando] = useState(false);
  const [respuesta, setRespuesta] = useState<RespuestaDocumental | null>(null);
  const [error, setError] = useState<string | null>(null);

  // El catálogo se lee una vez al abrir la pestaña. Si el backend no está, se
  // dice y la pantalla sigue en pie: la lista de documentos es lo accesorio,
  // preguntar es lo que importa.
  useEffect(() => {
    let cancelado = false;
    void leerCatalogo().then(
      (datos) => {
        if (!cancelado) setCatalogo(datos);
      },
      (err: unknown) => {
        if (!cancelado) {
          setErrorCatalogo(err instanceof Error ? err.message : "No se pudo leer el catálogo");
        }
      }
    );
    return () => {
      cancelado = true;
    };
  }, []);

  const consultar = (pregunta: string) => {
    const limpia = pregunta.trim();
    if (limpia === "" || consultando) return;

    setTexto(limpia);
    setConsultando(true);
    setError(null);
    setRespuesta(null);

    void preguntar(limpia).then(
      (datos) => {
        setRespuesta(datos);
        setConsultando(false);
      },
      (err: unknown) => {
        setError(err instanceof Error ? err.message : "No se pudo consultar");
        setConsultando(false);
      }
    );
  };

  const documentos = catalogo?.documentos ?? [];
  const sugeridas = catalogo?.preguntasSugeridas ?? [];

  return (
    <div className="grid gap-4 dk:grid-cols-[320px_1fr] dk:items-start">
      <Panel as="section" className="p-4">
        <Rotulo>
          {catalogo
            ? `${documentos.filter((d) => d.ingerido).length} documentos · ${catalogo.fragmentos} fragmentos`
            : "Documentos cargados"}
        </Rotulo>

        {errorCatalogo && (
          <p className="mt-3 rounded-lg border border-sala-error/40 px-3 py-2 text-[12.5px] text-sala-error">
            {errorCatalogo}
          </p>
        )}

        {!catalogo && !errorCatalogo && (
          <p className="mt-3 text-[13px] text-sala-tx3">Leyendo el catálogo…</p>
        )}

        <ul className="mt-3 flex flex-col gap-2.5">
          {documentos.map((documento) => (
            <li
              key={documento.archivo}
              className={`rounded-lg border bg-sala-800 px-3 py-2.5 ${
                documento.ingerido ? "border-sala-bd" : "border-sala-alerta/40"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p
                  className={`font-semibold text-sala-tx ${
                    presentacion ? "text-[15px]" : "text-[13px]"
                  }`}
                >
                  {documento.titulo}
                </p>
                <span className="rotulo shrink-0 rounded-full border border-sala-bd px-2 py-0.5 font-mono text-[9.5px] tracking-[0.08em] text-sala-tx3 uppercase">
                  {documento.categoria}
                </span>
              </div>
              <p className="mt-1 text-[12px] leading-snug text-sala-tx2">{documento.detalle}</p>

              {!presentacion && (
                <p className="mt-1 font-mono text-[10px] text-sala-tx3">
                  {documento.archivo}
                  {documento.ingerido ? ` · ${documento.fragmentos} fragmentos` : ""}
                </p>
              )}

              {/*
                Un documento del catálogo que nadie ingirió se marca en vez de
                desaparecer. La diferencia entre "no está" y "está pero no se
                cargó" es la diferencia entre arreglarlo en dos minutos y no
                entender qué pasa.
              */}
              {!documento.ingerido && (
                <p className="mt-1.5 font-mono text-[10.5px] text-sala-alerta">
                  sin ingerir · corré npm run ingest
                </p>
              )}
            </li>
          ))}
        </ul>
      </Panel>

      <div className="flex flex-col gap-4">
        <Panel as="section" className="p-5">
          <Rotulo>Preguntale a los documentos</Rotulo>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              consultar(texto);
            }}
            className="mt-3 flex gap-2"
          >
            <input
              type="text"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="¿Qué querés saber?"
              disabled={consultando}
              className={`min-w-0 flex-1 rounded-lg border border-sala-bd bg-sala-1000 px-4 py-3 text-sala-tx placeholder:text-sala-tx3 focus:border-sala-tx focus:outline-none disabled:opacity-60 ${
                presentacion ? "text-[17px]" : "text-[14px]"
              }`}
            />
            <button
              type="submit"
              disabled={consultando}
              className="shrink-0 rounded-lg bg-sala-tx px-5 py-3 text-[14px] font-semibold text-sala-1000 transition-colors hover:bg-sala-tx2 disabled:opacity-60"
            >
              {consultando ? "Buscando…" : "Preguntar"}
            </button>
          </form>

          {sugeridas.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {sugeridas.map((sugerida) => (
                <li key={sugerida}>
                  <button
                    type="button"
                    onClick={() => consultar(sugerida)}
                    disabled={consultando}
                    className="rounded-full border border-sala-bd bg-sala-800 px-3 py-1.5 text-left text-[12px] text-sala-tx2 transition-colors hover:border-sala-tx hover:text-sala-tx disabled:opacity-60"
                  >
                    {sugerida}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {consultando && <Buscando presentacion={presentacion} />}

        {error && (
          <Panel as="section" className="border-sala-error/45 px-5 py-4">
            <Rotulo className="!text-sala-error">No se pudo consultar</Rotulo>
            <p className="mt-2 text-[13.5px] leading-relaxed text-sala-tx2">{error}</p>
          </Panel>
        )}

        {respuesta && !consultando && (
          <Respuesta respuesta={respuesta} presentacion={presentacion} />
        )}
      </div>
    </div>
  );
}

/**
 * El estado de espera.
 *
 * Dice los dos pasos que están ocurriendo de verdad —buscar y redactar— en vez
 * de un spinner mudo. En una demostración eso hace dos cosas: llena los tres
 * segundos con algo que mirar, y explica el mecanismo sin que el orador tenga
 * que narrarlo.
 */
function Buscando({ presentacion }: { presentacion: boolean }) {
  return (
    <Panel as="section" className="px-5 py-4" >
      <p className="flex items-center gap-2 font-mono text-[11px] tracking-[0.14em] text-sala-tx uppercase">
        <span className="typing-dot">·</span>
        <span className="typing-dot" style={{ animationDelay: "0.15s" }}>
          ·
        </span>
        <span className="typing-dot" style={{ animationDelay: "0.3s" }}>
          ·
        </span>
        Consultando los documentos
      </p>
      <ol className="mt-3 flex flex-col gap-1.5">
        {["Buscando los fragmentos más parecidos", "Redactando con lo que encontró"].map(
          (paso, i) => (
            <li
              key={paso}
              className={`flex items-baseline gap-3 font-mono text-sala-tx2 ${
                presentacion ? "text-[13px]" : "text-[12px]"
              }`}
            >
              <span className="w-4 shrink-0 text-right text-sala-tx3">{i + 1}</span>
              <span>{paso}</span>
            </li>
          )
        )}
      </ol>
    </Panel>
  );
}

/**
 * Una respuesta con sus citas.
 *
 * Las citas son lo que separa esto de un chatbot: sin ellas hay que creerle, y
 * con ellas se puede ir a verificar. Las arma el backend con los fragmentos que
 * de verdad se recuperaron —el modelo elige cuáles usó, pero no puede agregar
 * uno— así que un chip nunca puede apuntar a un documento que no existe.
 */
function Respuesta({
  respuesta,
  presentacion,
}: {
  respuesta: RespuestaDocumental;
  presentacion: boolean;
}) {
  const [abierta, setAbierta] = useState<number | null>(null);

  return (
    <Panel as="section" className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Rotulo>Respuesta</Rotulo>
        {!presentacion && respuesta.modelo && (
          <span className="rotulo rounded-full border border-sala-tx/30 px-2.5 py-1 font-mono text-[9.5px] tracking-[0.1em] text-sala-tx uppercase">
            Consulta real · {respuesta.modelo}
          </span>
        )}
      </div>

      <p className={`mt-1 text-sala-tx3 ${presentacion ? "text-[16px]" : "text-[13px]"}`}>
        {respuesta.pregunta}
      </p>

      {respuesta.respuesta.split("\n").filter(Boolean).map((parrafo, i) => (
        <p
          key={i}
          className={`mt-3 leading-relaxed text-sala-tx ${
            presentacion ? "text-[18px]" : "text-[14.5px]"
          }`}
        >
          {parrafo}
        </p>
      ))}

      <div className="mt-5 border-t border-sala-bd pt-4">
        {respuesta.citas.length === 0 ? (
          /*
            Cero citas debajo de "esto no está en los documentos" es coherente, y
            decirlo es mejor que dejar el bloque vacío: quien mira tiene que
            entender que no encontró, no que se rompió algo.
          */
          <p className="font-mono text-[11px] text-sala-tx3">
            Sin fragmentos que respalden una respuesta. Los documentos cargados no cubren esto.
          </p>
        ) : (
          <>
            <Rotulo>De dónde salió · {respuesta.citas.length} fragmentos</Rotulo>
            <ul className="mt-2 flex flex-wrap gap-2">
              {respuesta.citas.map((cita, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => setAbierta(abierta === i ? null : i)}
                    aria-expanded={abierta === i}
                    className={`rounded-lg border px-3 py-1.5 font-mono text-[11px] transition-colors ${
                      abierta === i
                        ? "border-sala-tx text-sala-tx"
                        : "border-sala-bd text-sala-tx2 hover:border-sala-tx hover:text-sala-tx"
                    }`}
                  >
                    {abierta === i ? "▾" : "▸"} {cita.archivo}{" "}
                    <span className="text-sala-tx3">· fragmento {i + 1}</span>
                  </button>
                </li>
              ))}
            </ul>

            {abierta !== null && (
              <blockquote className="mt-3 rounded-lg border border-sala-bd bg-sala-1000 px-4 py-3 text-[13px] leading-relaxed whitespace-pre-line text-sala-tx2 italic">
                {respuesta.citas[abierta].fragmento}
              </blockquote>
            )}
          </>
        )}
      </div>
    </Panel>
  );
}
