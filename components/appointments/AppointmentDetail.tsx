"use client";

import Link from "next/link";
import { useState } from "react";
import {
  dayHeading,
  patientName,
  STATUS_LABELS,
  timeRange,
  type Appointment,
} from "@/lib/appointments";
import { CHANNEL_LABELS } from "@/lib/chats";

/**
 * La cita que se tocó en el calendario, con todo lo que el bloque no puede
 * mostrar: teléfono, motivo completo, de qué conversación salió y el botón de
 * cancelar.
 *
 * El calendario responde "cómo viene la semana"; esto responde "y esta quién
 * es". Separarlos es lo que permite que los bloques sean chiquitos.
 */

interface Props {
  appointment: Appointment;
  busy: boolean;
  onCancel: (appointment: Appointment) => void;
  onDelete: (appointment: Appointment) => void;
  onClose: () => void;
}

export function AppointmentDetail({
  appointment,
  busy,
  onCancel,
  onDelete,
  onClose,
}: Props) {
  const [confirming, setConfirming] = useState<"cancel" | "delete" | null>(null);
  const cancelled = appointment.status === "cancelled";

  /**
   * Las citas agendadas a mano se borran; las que salieron de un chat, no.
   *
   * Cancelar deja constancia de que alguien tenía una cita y no vino, que al
   * negocio le sirve. Borrar es para lo que nunca debió existir —un duplicado,
   * un nombre mal apuntado—, y una cita que salió de una conversación es parte
   * de la historia de ese chat: borrarla dejaría la conversación hablando de
   * algo que ya no está.
   */
  const borrable = appointment.conversationId === null;

  const tone = cancelled
    ? "border-arena-300 bg-arena-100 text-tinta-500"
    : "border-menta-200 bg-verde-50 text-verde-800";

  return (
    // Pegado abajo: se abre al tocar un bloque del calendario, y la grilla es
    // más alta que la pantalla. Sin esto, el detalle aparece fuera de la vista
    // y el clic no parece haber hecho nada.
    <aside className="sticky bottom-0 z-30 border-t border-arena-200 bg-blanco px-4 py-3.5 shadow-media dk:px-6">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-mono text-[13px] font-semibold text-tinta-900 tabular-nums">
          {dayHeading(appointment.startsAt)} ·{" "}
          {timeRange(appointment.startsAt, appointment.endsAt)}
        </span>
        <h3
          className={`text-[15px] font-semibold text-tinta-900 ${
            cancelled ? "line-through" : ""
          }`}
        >
          {patientName(appointment)}
        </h3>
        <span
          className={`rounded-full border px-2.5 py-0.5 font-mono text-[10.5px] tracking-[0.06em] ${tone}`}
        >
          {STATUS_LABELS[appointment.status] ?? appointment.status}
        </span>

        <button
          type="button"
          onClick={onClose}
          className="ml-auto rounded-full border border-arena-200 bg-blanco px-3 py-1 text-[12.5px] font-semibold text-tinta-600 transition-colors hover:bg-arena-100"
        >
          Cerrar
        </button>
      </div>

      {appointment.notes && (
        <p className="mt-1 text-[14px] leading-[1.5] text-tinta-600">{appointment.notes}</p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12.5px]">
        <span className="text-tinta-500">
          {CHANNEL_LABELS[appointment.channel] ?? appointment.channel}
        </span>

        {appointment.phone ? (
          <a
            href={`tel:${appointment.phone.replace(/[^\d+]/g, "")}`}
            className="font-semibold text-verde-800 hover:underline"
          >
            {appointment.phone}
          </a>
        ) : (
          <span className="text-tinta-500 italic">Sin teléfono</span>
        )}

        {appointment.conversation ? (
          <Link
            href={`/lucia/chats?chat=${appointment.conversation.id}`}
            className="font-semibold text-verde-800 hover:underline"
          >
            Ver conversación ({appointment.conversation.messageCount})
          </Link>
        ) : appointment.channel === "manual" ? (
          <span className="text-tinta-500 italic">Agendada a mano</span>
        ) : (
          <span className="text-tinta-500 italic">Conversación borrada</span>
        )}

        <span className="ml-auto flex items-center gap-2">
          {confirming ? (
            <>
              <span className="text-[12.5px] text-tinta-600">
                {confirming === "delete" ? "¿Borrar sin dejar rastro?" : "¿Seguro?"}
              </span>
              <button
                type="button"
                onClick={() => {
                  const accion = confirming;
                  setConfirming(null);
                  if (accion === "delete") onDelete(appointment);
                  else onCancel(appointment);
                }}
                disabled={busy}
                className="rounded-full border border-error-bd bg-error-bg px-3 py-1 text-[12.5px] font-semibold text-error-tx transition-colors hover:brightness-95 disabled:opacity-50"
              >
                {busy
                  ? "Un momento…"
                  : confirming === "delete"
                    ? "Sí, borrar"
                    : "Sí, cancelar"}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(null)}
                disabled={busy}
                className="rounded-full border border-arena-200 bg-blanco px-3 py-1 text-[12.5px] font-semibold text-tinta-600 transition-colors hover:bg-arena-100 disabled:opacity-50"
              >
                No
              </button>
            </>
          ) : (
            <>
              {borrable && (
                <button
                  type="button"
                  onClick={() => setConfirming("delete")}
                  className="rounded-full border border-arena-200 bg-blanco px-3 py-1 text-[12.5px] font-semibold text-tinta-600 transition-colors hover:border-error-bd hover:bg-error-bg hover:text-error-tx"
                >
                  Borrar
                </button>
              )}
              {!cancelled && (
                <button
                  type="button"
                  onClick={() => setConfirming("cancel")}
                  className="rounded-full border border-arena-200 bg-blanco px-3 py-1 text-[12.5px] font-semibold text-tinta-600 transition-colors hover:border-error-bd hover:bg-error-bg hover:text-error-tx"
                >
                  Cancelar cita
                </button>
              )}
            </>
          )}
        </span>
      </div>
    </aside>
  );
}
