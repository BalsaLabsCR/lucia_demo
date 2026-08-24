import type { Severidad } from "@/lib/negocio/types";
import { COLOR_SEVERIDAD, ETIQUETA_SEVERIDAD } from "@/lib/negocio/formato";

/**
 * Las piezas chicas que se repiten en toda la Sala de Operación.
 *
 * Viven juntas para que el rótulo de una sección, el chip de una etiqueta y el
 * punto de estado se vean IGUAL en las seis pestañas. Seis variantes de lo
 * mismo, cada una con su tamaño de letra, es lo que hace que un panel se lea
 * como seis pantallas pegadas en vez de como un sistema.
 */

/** El rótulo en versalitas que abre cada bloque. */
export function Rotulo({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    // `rotulo` no es una clase de estilo de Tailwind: es el gancho que usa
    // `globals.css` para agrandar TODOS los rótulos de golpe en modo
    // presentación. Pasarles la bandera uno por uno serían quince props
    // atravesando componentes que no necesitan saber nada del proyector.
    <p
      className={`rotulo font-mono text-[10.5px] tracking-[0.16em] text-sala-tx3 uppercase ${className}`}
    >
      {children}
    </p>
  );
}

/** La caja base de todo: mismo fondo, mismo borde, mismo radio. */
export function Panel({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
}) {
  return (
    <Tag className={`rounded-xl border border-sala-bd bg-sala-900 ${className}`}>{children}</Tag>
  );
}

/**
 * El punto de estado.
 *
 * Pulsa solo cuando el agente está "revisando". Un punto que late siempre es
 * ruido; uno que late justo cuando algo pasa dirige la mirada.
 */
export function Punto({ severidad, activo = false }: { severidad: Severidad; activo?: boolean }) {
  return (
    <span
      aria-hidden
      className={`inline-block size-2 shrink-0 rounded-full ${COLOR_SEVERIDAD[severidad].punto} ${
        activo ? "pulse-ring" : ""
      }`}
    />
  );
}

/**
 * El chip de severidad.
 *
 * Lo crítico va INVERTIDO —fondo blanco, letra negra— y es el único elemento de
 * toda la pantalla que se pinta así. En una paleta de un solo color no queda
 * nada más fuerte que el blanco sobre negro, salvo darlo vuelta: por eso se
 * reserva para lo único que de verdad no puede pasar desapercibido, y por eso
 * no se usa en ningún otro lado.
 */
export function ChipSeveridad({ severidad }: { severidad: Severidad }) {
  const color = COLOR_SEVERIDAD[severidad];

  if (severidad === "critico") {
    return (
      <span className="rotulo inline-flex items-center gap-1.5 rounded-full bg-sala-tx px-2.5 py-1 font-mono text-[10px] font-semibold tracking-[0.1em] text-sala-1000 uppercase">
        {ETIQUETA_SEVERIDAD[severidad]}
      </span>
    );
  }

  return (
    <span
      className={`rotulo inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] tracking-[0.1em] uppercase ${color.borde} ${color.texto}`}
    >
      <Punto severidad={severidad} />
      {ETIQUETA_SEVERIDAD[severidad]}
    </span>
  );
}

/** Un dato suelto del encabezado: etiqueta arriba, valor abajo. */
export function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <Rotulo>{etiqueta}</Rotulo>
      <p className="mt-0.5 text-[14px] font-semibold text-sala-tx">{valor}</p>
    </div>
  );
}
