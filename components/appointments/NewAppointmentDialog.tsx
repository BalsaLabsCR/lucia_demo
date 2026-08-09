"use client";

import { useEffect, useRef, useState } from "react";
import {
  patientName,
  timeRange,
  toLocalDateValue,
  toLocalTimeValue,
  type Appointment,
} from "@/lib/appointments";

/**
 * Agendar a mano desde el calendario.
 *
 * No todo el mundo escribe: llaman por teléfono, llegan al mostrador, o el
 * negocio viene de una agenda de papel. Sin esto el panel solo servía para
 * mirar lo que hizo Lucía, y media agenda no se puede usar como la agenda.
 *
 * Se abre tocando un espacio libre de la grilla, así que el día y la hora ya
 * vienen puestos: lo normal es escribir un nombre y darle guardar.
 */

/** Duraciones de uso corriente. La lista corta evita escribir minutos a mano. */
const DURACIONES = [30, 45, 60, 90, 120];

export interface NewAppointmentDraft {
  name: string;
  phone: string;
  notes: string;
  startsAt: Date;
  durationMinutes: number;
  force?: boolean;
}

interface Props {
  /** Fecha y hora donde se tocó la grilla. */
  initialStart: Date;
  busy: boolean;
  /** Cita que estorba, cuando el backend rechazó por choque de horario. */
  conflictsWith: Appointment | null;
  error: string | null;
  onSubmit: (draft: NewAppointmentDraft) => void;
  onClose: () => void;
}

export function NewAppointmentDialog({
  initialStart,
  busy,
  conflictsWith,
  error,
  onSubmit,
  onClose,
}: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(() => toLocalDateValue(initialStart));
  const [time, setTime] = useState(() => toLocalTimeValue(initialStart));
  const [durationMinutes, setDuration] = useState(45);

  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  // Escape cierra: es un diálogo modal y salir tiene que costar una tecla.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = (force: boolean) => {
    const startsAt = new Date(`${date}T${time}`);
    if (Number.isNaN(startsAt.getTime())) return;
    onSubmit({ name, phone, notes, startsAt, durationMinutes, force });
  };

  const field =
    "w-full rounded-[10px] border border-arena-200 bg-blanco px-3 py-2 text-[14px] placeholder:text-tinta-500/60 focus:border-verde-600 focus:outline-none";
  const label = "font-mono text-[10.5px] tracking-[0.08em] text-tinta-500 uppercase";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-tinta-900/30 p-0 dk:items-center dk:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="nueva-cita-titulo"
        onClick={(e) => e.stopPropagation()}
        className="max-h-dvh w-full max-w-[440px] overflow-y-auto rounded-t-[16px] border border-arena-200 bg-blanco p-5 shadow-media dk:rounded-[16px]"
      >
        <h2 id="nueva-cita-titulo" className="font-display text-[20px] font-bold">
          Agendar a mano
        </h2>
        <p className="mt-0.5 text-[13px] text-tinta-500">
          Para quien llamó o llegó al mostrador. No queda conversación asociada.
        </p>

        <form
          className="mt-4 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            submit(false);
          }}
        >
          <div>
            <label className={label} htmlFor="cita-nombre">
              Nombre
            </label>
            <input
              id="cita-nombre"
              ref={nameRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={120}
              placeholder="Nombre de la persona"
              className={`mt-1 ${field}`}
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className={label} htmlFor="cita-fecha">
                Día
              </label>
              <input
                id="cita-fecha"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className={`mt-1 ${field}`}
              />
            </div>
            <div className="w-[120px]">
              <label className={label} htmlFor="cita-hora">
                Hora
              </label>
              <input
                id="cita-hora"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className={`mt-1 ${field}`}
              />
            </div>
          </div>

          <div>
            <span className={label}>Duración</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {DURACIONES.map((min) => (
                <button
                  key={min}
                  type="button"
                  onClick={() => setDuration(min)}
                  aria-pressed={durationMinutes === min}
                  className={`rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${
                    durationMinutes === min
                      ? "bg-verde-950 text-crema-100"
                      : "border border-arena-200 bg-blanco text-tinta-600 hover:bg-arena-100"
                  }`}
                >
                  {min} min
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={label} htmlFor="cita-telefono">
              Teléfono (opcional)
            </label>
            <input
              id="cita-telefono"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={40}
              placeholder="8888-8888"
              className={`mt-1 ${field}`}
            />
          </div>

          <div>
            <label className={label} htmlFor="cita-motivo">
              Motivo (opcional)
            </label>
            <input
              id="cita-motivo"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              placeholder="Limpieza dental"
              className={`mt-1 ${field}`}
            />
          </div>

          {/* El choque no se decide por el cliente: se le muestra con quién es
              y se le deja elegir. Quien mira el calendario puede saber algo que
              el sistema no. */}
          {conflictsWith && (
            <div className="rounded-[12px] border border-ambar-bd bg-ambar-bg px-3 py-2.5 text-[13px] text-ambar-tx">
              {/* Sin punto final: `timeRange` ya termina en "a. m." */}
              Ese espacio choca con <strong>{patientName(conflictsWith)}</strong>,{" "}
              {timeRange(conflictsWith.startsAt, conflictsWith.endsAt)}
              <button
                type="button"
                onClick={() => submit(true)}
                disabled={busy}
                className="mt-2 block rounded-full border border-ambar-bd bg-blanco px-3 py-1 text-[12.5px] font-semibold text-ambar-tx transition-colors hover:brightness-95 disabled:opacity-50"
              >
                Agendar igual, encimadas
              </button>
            </div>
          )}

          {error && !conflictsWith && (
            <p className="rounded-[12px] border border-error-bd bg-error-bg px-3 py-2.5 text-[13px] text-error-tx">
              {error}
            </p>
          )}

          <div className="mt-1 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-arena-200 bg-blanco px-4 py-2 text-[13px] font-semibold text-tinta-600 transition-colors hover:bg-arena-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={busy || name.trim() === ""}
              className="rounded-full bg-verde-950 px-4 py-2 text-[13px] font-semibold text-crema-100 transition-opacity disabled:opacity-50"
            >
              {busy ? "Agendando…" : "Agendar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
