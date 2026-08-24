"use client";

import { useEffect, useState } from "react";

/**
 * La revisión de un agente, mostrada paso por paso.
 *
 * Es la pieza que separa "una página que ya estaba ahí" de "algo que acaba de
 * pasar", y por dentro no es más que un contador con un intervalo. No hay
 * ninguna revisión ocurriendo: los pasos son texto de `datos.ts`.
 *
 * Tres decisiones que importan:
 *
 *   - **En reposo se muestra TODO.** Al cargar la página, el contenido está
 *     completo; la animación solo corre cuando alguien aprieta "Revisar ahora".
 *     Una pantalla que arranca vacía y se llena sola es un riesgo en vivo: si
 *     el proyector tarda en enganchar, la sala ve el final y no el proceso.
 *   - **`retrasoMs` escalona el arranque.** Seis agentes que empiezan y
 *     terminan juntos se ven como una barra de progreso; seis que se completan
 *     a distinto ritmo se ven como seis agentes.
 *   - **Con `prefers-reduced-motion` no anima**, salta al final. La animación
 *     es retórica, no información: nadie se pierde nada.
 */
export function useReplay(
  pasos: number,
  opciones: { token: number; msPaso?: number; retrasoMs?: number } = { token: 0 }
): { visibles: number; corriendo: boolean } {
  const { token, msPaso = 600, retrasoMs = 0 } = opciones;

  /**
   * El contador viaja junto al token que lo originó.
   *
   * Reiniciarlo en un efecto sería un render en cascada —React lo pinta
   * completo y después vacío— así que se ajusta DURANTE el render comparando
   * contra el token guardado, que es el patrón que React recomienda para estado
   * derivado de props. El intervalo, que sí es un sistema externo, va en el
   * efecto.
   */
  const [estado, setEstado] = useState({ token: 0, visibles: 0 });

  if (estado.token !== token) {
    setEstado({ token, visibles: sinAnimacion() ? pasos : 0 });
  }

  useEffect(() => {
    if (token === 0 || sinAnimacion()) return;

    let intervalo: ReturnType<typeof setInterval> | null = null;
    const arranque = setTimeout(() => {
      intervalo = setInterval(() => {
        setEstado((previo) => {
          if (previo.token !== token) return previo;
          if (previo.visibles >= pasos) {
            if (intervalo) clearInterval(intervalo);
            return previo;
          }
          return { token, visibles: previo.visibles + 1 };
        });
      }, msPaso);
    }, retrasoMs);

    return () => {
      clearTimeout(arranque);
      if (intervalo) clearInterval(intervalo);
    };
  }, [token, pasos, msPaso, retrasoMs]);

  // Token 0 es el reposo: se muestra todo sin depender del contador, así que
  // la pantalla está completa desde el primer render, también en el servidor.
  const visibles = token === 0 ? pasos : estado.visibles;
  return { visibles, corriendo: visibles < pasos };
}

/** true si el sistema pide no animar. En el servidor, siempre. */
function sinAnimacion(): boolean {
  return (
    typeof window === "undefined" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
