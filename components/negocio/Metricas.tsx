import type { Metrica } from "@/lib/negocio/types";
import { flecha, formatear, tendencia, variacion } from "@/lib/negocio/formato";
import { Sparkline } from "./Graficas";
import { Rotulo } from "./ui";

/**
 * La fila de números grandes.
 *
 * Cada uno lleva su comparación contra el mes anterior y de dónde salió. Lo
 * segundo parece un detalle y es lo que separa un panel de un adorno: quien
 * mira tiene que poder preguntar "¿de dónde sacaste eso?" y encontrar la
 * respuesta en la misma tarjeta, sin que nadie tenga que abrir nada.
 *
 * En modo presentación la fuente se esconde: es información técnica y en una
 * proyección solo compite con el número.
 */
export function Metricas({
  metricas,
  presentacion,
  destacadas = false,
}: {
  metricas: Metrica[];
  presentacion: boolean;
  /** true para los cuatro titulares de Dirección: más grandes todavía. */
  destacadas?: boolean;
}) {
  return (
    <div
      className={`grid gap-3 ${
        metricas.length === 4 ? "grid-cols-2 dk:grid-cols-4" : "grid-cols-2 dk:grid-cols-4"
      }`}
    >
      {metricas.map((metrica) => (
        <Tarjeta
          key={metrica.label}
          metrica={metrica}
          presentacion={presentacion}
          destacada={destacadas}
        />
      ))}
    </div>
  );
}

function Tarjeta({
  metrica,
  presentacion,
  destacada,
}: {
  metrica: Metrica;
  presentacion: boolean;
  destacada: boolean;
}) {
  const t = tendencia(metrica);
  const cambio = variacion(metrica);

  /*
   * Sin color, la jerarquía la lleva el brillo: lo que se movió para mal va en
   * blanco —es lo que hay que mirar— y lo que se movió para bien queda apagado.
   * Suena al revés y no lo es: un panel que ilumina las buenas noticias hace que
   * el ojo se pierda justo en la pantalla donde importa encontrar el problema.
   */
  const color =
    t === "sube-mal" || t === "baja-mal"
      ? "text-sala-tx"
      : t === "sube-bien" || t === "baja-bien"
        ? "text-sala-tx2"
        : "text-sala-tx3";

  const tamano = destacada
    ? presentacion
      ? "text-[46px]"
      : "text-[34px]"
    : presentacion
      ? "text-[36px]"
      : "text-[27px]";

  return (
    <article className="flex flex-col rounded-xl border border-sala-bd bg-sala-900 p-4">
      <Rotulo>{metrica.label}</Rotulo>

      <p className={`mt-2 font-display leading-none text-sala-tx ${tamano}`}>
        {formatear(metrica.valor, metrica.unidad)}
      </p>

      {/*
        La línea de los últimos doce meses, cuando la métrica la trae.
        
        El número grande dice cuánto y la flecha dice si subió; la línea dice si
        esto viene pasando. Es la pregunta que un gerente hace apenas ve las
        otras dos, y ocupa siete píxeles de alto.
      */}
      {metrica.serie && (
        <div className="mt-2.5">
          <Sparkline puntos={metrica.serie} />
        </div>
      )}

      <p
        className={`mt-2 font-semibold ${color} ${presentacion ? "text-[15px]" : "text-[12.5px]"}`}
      >
        {/*
          Una métrica quieta dice "Sin cambio" y no "→ 0%". Son lo mismo, pero
          el cero pintado como variación hace que el ojo lo lea como un dato y
          se detenga; la palabra se saltea sola, que es lo que corresponde a una
          métrica que no se movió.
        */}
        {t === "plana" ? (
          <span className="text-sala-tx3">Sin cambio</span>
        ) : cambio === null ? (
          <span className="text-sala-tx3">Sin comparación</span>
        ) : (
          <>
            {flecha(t)} {cambio}{" "}
            <span className="font-normal text-sala-tx3">vs. mes anterior</span>
          </>
        )}
      </p>

      {metrica.nota && (
        <p className={`mt-1.5 text-sala-tx2 ${presentacion ? "text-[14px]" : "text-[12px]"}`}>
          {metrica.nota}
        </p>
      )}

      {!presentacion && (
        <p className="mt-auto pt-3 font-mono text-[10px] leading-relaxed text-sala-tx3">
          {metrica.fuente}
        </p>
      )}
    </article>
  );
}
