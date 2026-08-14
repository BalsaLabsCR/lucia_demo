import { toolLabel, type DemoActivity } from "@/lib/copilot";

/**
 * Lo que acaba de pasar, en vivo.
 *
 * La tarjeta existe para resolver un problema de honestidad, no de diseño: el
 * resto del panel muestra el histórico SIMULADO de una clínica ficticia, y esto
 * muestra filas que se crearon hace un minuto porque alguien del público le
 * escribió a Lucía. Si las dos cosas compartieran tarjeta, el público no podría
 * saber cuál es cuál — y el argumento de la demostración es justamente que estos
 * números son de verdad.
 *
 * Por eso el rótulo verde y no ámbar: el ámbar de "datos simulados" ya está
 * arriba, y estos son lo contrario. Que se distingan de un vistazo es el punto.
 *
 * No muestra ni un nombre, ni un teléfono, ni una línea de ningún mensaje. Eso
 * lo garantiza el backend —que ni siquiera los lee— pero conviene saberlo
 * mirando esta pantalla: se proyecta frente a gente que acaba de escribir cosas
 * suyas.
 */
export function ActivityCard({
  activity,
  presentacion,
}: {
  activity: DemoActivity;
  presentacion: boolean;
}) {
  const numeros: { etiqueta: string; valor: number }[] = [
    { etiqueta: "Conversaciones", valor: activity.conversations },
    { etiqueta: "Preguntas", valor: activity.questions },
    { etiqueta: "Respuestas", valor: activity.replies },
    { etiqueta: "Interesados", valor: activity.leads },
    { etiqueta: "Citas", valor: activity.appointments },
    { etiqueta: "Pasadas a una persona", valor: activity.handoffs },
  ];

  return (
    <section
      aria-label="Actividad desde que comenzó la demostración"
      className="rounded-xl border-[1.5px] border-menta-200 bg-verde-50 p-4 shadow-suave"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3
          className={`font-semibold text-verde-800 ${presentacion ? "text-[18px]" : "text-[15px]"}`}
        >
          Actividad desde que comenzó la demostración
        </h3>
        <span className="rounded-full border border-menta-200 bg-blanco px-3 py-1 font-mono text-[10.5px] tracking-[0.08em] text-verde-800 uppercase">
          En vivo · datos reales
        </span>
      </div>

      <p className={`mt-1 text-tinta-600 ${presentacion ? "text-[14px]" : "text-[12.5px]"}`}>
        Últimos {activity.windowMinutes} minutos. Sin nombres, teléfonos ni texto de los mensajes.
      </p>

      <dl
        className={`mt-4 grid gap-3 ${
          presentacion ? "grid-cols-2 dk:grid-cols-3" : "grid-cols-3 dk:grid-cols-6"
        }`}
      >
        {numeros.map((n) => (
          <div key={n.etiqueta} className="rounded-lg bg-blanco px-3 py-2.5">
            <dt
              className={`font-mono tracking-[0.08em] text-tinta-500 uppercase ${
                presentacion ? "text-[11px]" : "text-[10px]"
              }`}
            >
              {n.etiqueta}
            </dt>
            <dd
              className={`mt-0.5 font-semibold text-tinta-900 ${
                presentacion ? "text-[30px]" : "text-[22px]"
              }`}
            >
              {n.valor}
            </dd>
          </div>
        ))}
      </dl>

      {activity.actions.length > 0 && (
        <div className="mt-4">
          <p className="font-mono text-[10px] tracking-[0.08em] text-tinta-500 uppercase">
            Qué hizo Lucía
          </p>
          <ul className="mt-1.5 flex flex-wrap gap-2">
            {activity.actions.map((a) => (
              <li
                key={a.tool}
                className={`rounded-full border border-menta-200 bg-blanco px-3 py-1 text-tinta-900 ${
                  presentacion ? "text-[14px]" : "text-[12.5px]"
                }`}
              >
                {toolLabel(a.tool)} · {a.count}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/*
        El origen es el cierre del círculo: la conversación que acaba de pasar
        queda atada a la campaña que la trajo. Solo aparece cuando alguien llegó
        por una campaña — una sección vacía diciendo "sin origen" no informaría
        nada y ocuparía la mitad de la tarjeta.
      */}
      {activity.bySource.length > 0 && (
        <div className="mt-4">
          <p className="font-mono text-[10px] tracking-[0.08em] text-tinta-500 uppercase">
            De dónde llegaron
          </p>
          <ul className="mt-1.5 flex flex-wrap gap-2">
            {activity.bySource.map((s) => (
              <li
                key={`${s.source}-${s.campaignId ?? ""}`}
                className={`rounded-full border border-menta-200 bg-blanco px-3 py-1 text-tinta-900 ${
                  presentacion ? "text-[14px]" : "text-[12.5px]"
                }`}
              >
                {s.source}
                {s.campaignId ? ` · ${s.campaignId}` : ""} · {s.count}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
