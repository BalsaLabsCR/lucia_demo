"use client";

import Link from "next/link";
import { useState } from "react";
import {
  groupByDay,
  patientName,
  STATUS_LABELS,
  timeRange,
  type Appointment,
} from "@/lib/appointments";
import { CHANNEL_LABELS } from "@/lib/chats";

interface Props {
  appointments: Appointment[];
  busyId: string | null;
  onCancel: (appointment: Appointment) => void;
}

function StatusBadge({ status }: { status: string }) {
  const label = STATUS_LABELS[status] ?? status;

  const cls =
    status === "cancelled"
      ? "border-arena-300 bg-arena-100 text-tinta-500"
      : "border-menta-200 bg-verde-50 text-verde-800";

  return (
    <span
      className={`rounded-full border px-2.5 py-0.5 font-mono text-[10.5px] tracking-[0.06em] ${cls}`}
    >
      {label}
    </span>
  );
}

function AppointmentRow({
  appointment,
  busy,
  confirming,
  onAskConfirm,
  onDismiss,
  onCancel,
}: {
  appointment: Appointment;
  busy: boolean;
  confirming: boolean;
  onAskConfirm: () => void;
  onDismiss: () => void;
  onCancel: () => void;
}) {
  const cancelled = appointment.status === "cancelled";

  return (
    <li
      className={`border-b border-arena-200 px-4 py-3.5 transition-colors dk:px-6 ${
        cancelled ? "opacity-60" : "hover:bg-arena-50"
      }`}
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-mono text-[13px] font-semibold text-tinta-900 tabular-nums">
          {timeRange(appointment.startsAt, appointment.endsAt)}
        </span>
        <h3
          className={`text-[15px] font-semibold text-tinta-900 ${
            cancelled ? "line-through" : ""
          }`}
        >
          {patientName(appointment)}
        </h3>
        <StatusBadge status={appointment.status} />
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

        {!cancelled && (
          // Confirmación en la misma fila, no en un diálogo del navegador:
          // cancelar le quita el espacio a alguien que ya lo tenía, así que
          // conviene un segundo clic — pero sin sacar a la persona de la lista.
          <span className="ml-auto flex items-center gap-2">
            {confirming ? (
              <>
                <span className="text-[12.5px] text-tinta-600">¿Seguro?</span>
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={busy}
                  className="rounded-full border border-error-bd bg-error-bg px-3 py-1 text-[12.5px] font-semibold text-error-tx transition-colors hover:brightness-95 disabled:opacity-50"
                >
                  {busy ? "Cancelando…" : "Sí, cancelar"}
                </button>
                <button
                  type="button"
                  onClick={onDismiss}
                  disabled={busy}
                  className="rounded-full border border-arena-200 bg-blanco px-3 py-1 text-[12.5px] font-semibold text-tinta-600 transition-colors hover:bg-arena-100 disabled:opacity-50"
                >
                  No
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onAskConfirm}
                className="rounded-full border border-arena-200 bg-blanco px-3 py-1 text-[12.5px] font-semibold text-tinta-600 transition-colors hover:border-error-bd hover:bg-error-bg hover:text-error-tx"
              >
                Cancelar cita
              </button>
            )}
          </span>
        )}
      </div>
    </li>
  );
}

export function AppointmentsList({ appointments, busyId, onCancel }: Props) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  if (appointments.length === 0) {
    return (
      <p className="px-6 py-14 text-center text-[14px] text-tinta-500">
        No hay citas que coincidan con los filtros.
      </p>
    );
  }

  return (
    <div>
      {groupByDay(appointments).map((group) => (
        <section key={group.key}>
          <h2 className="sticky top-0 z-10 border-y border-arena-200 bg-arena-100 px-4 py-1.5 font-mono text-[11px] tracking-[0.08em] text-tinta-600 uppercase dk:px-6">
            {group.heading}
          </h2>
          <ul>
            {group.appointments.map((appointment) => (
              <AppointmentRow
                key={appointment.id}
                appointment={appointment}
                busy={busyId === appointment.id}
                confirming={confirmingId === appointment.id}
                onAskConfirm={() => setConfirmingId(appointment.id)}
                onDismiss={() => setConfirmingId(null)}
                onCancel={() => {
                  setConfirmingId(null);
                  onCancel(appointment);
                }}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
