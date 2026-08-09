"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  appointmentsOfDay,
  hourLabel,
  hourRange,
  isSameDay,
  minutesOfDay,
  patientName,
  placeOverlaps,
  startTime,
  STATUS_LABELS,
  weekDays,
  WEEKDAY_SHORT,
  type Appointment,
} from "@/lib/appointments";

/**
 * La semana como calendario.
 *
 * Una lista ordenada contesta "¿qué sigue?", pero no contesta las dos que se
 * hace quien administra la agenda: dónde quedan los huecos y qué días están
 * cargados. Eso solo se ve cuando el tiempo ocupa espacio en la pantalla, así
 * que cada cita se dibuja con la altura de lo que dura.
 */

/** Alto de una hora, en px. Con menos, una cita de 45 min no muestra el nombre. */
const HOUR_PX = 60;

/** A qué se redondea el clic en un espacio libre. Nadie agenda a las 9:07. */
const SNAP_MINUTES = 15;

interface Props {
  appointments: Appointment[];
  weekStart: Date;
  selectedId: string | null;
  onSelect: (appointment: Appointment) => void;
  /** Tocaron un espacio libre: acá arrancaría la cita nueva. */
  onPickSlot: (start: Date) => void;
}

function blockTone(status: string): string {
  if (status === "conflict") return "border-error-bd bg-error-bg text-error-tx";
  if (status === "cancelled")
    return "border-arena-300 bg-arena-100 text-tinta-500 line-through opacity-70";
  return "border-menta-200 bg-verde-50 text-verde-800";
}

export function WeekCalendar({
  appointments,
  weekStart,
  selectedId,
  onSelect,
  onPickSlot,
}: Props) {
  const days = useMemo(() => weekDays(weekStart), [weekStart]);
  const [fromHour, toHour] = useMemo(() => hourRange(appointments), [appointments]);
  const hours = useMemo(
    () => Array.from({ length: toHour - fromHour }, (_, i) => fromHour + i),
    [fromHour, toHour]
  );

  const gridHeight = hours.length * HOUR_PX;
  const scrollRef = useRef<HTMLDivElement>(null);

  // "Ahora" se recalcula cada minuto: la línea es la referencia de qué ya pasó
  // y una que se quedó pegada a la hora de carga miente en silencio.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    // Se arranca en null y se llena en el cliente: la hora del servidor y la
    // del navegador no coinciden, y pintarla en el HTML da un salto al hidratar.
    const tick = () => setNow(new Date());
    tick();
    const timer = setInterval(tick, 60_000);
    return () => clearInterval(timer);
  }, []);

  const todayIndex = now ? days.findIndex((d) => isSameDay(d, now)) : -1;
  const nowTop = now ? ((now.getHours() * 60 + now.getMinutes()) / 60 - fromHour) * HOUR_PX : 0;
  const nowVisible = todayIndex >= 0 && nowTop >= 0 && nowTop <= gridHeight;

  // Al abrir la semana de hoy, la vista arranca donde está la acción y no a las
  // 8 a.m. de un lunes que ya pasó.
  useEffect(() => {
    if (!nowVisible || !scrollRef.current) return;
    scrollRef.current.scrollTop = Math.max(0, nowTop - 120);
  }, [nowVisible, nowTop]);

  return (
    <div className="overflow-x-auto">
      {/* min-w fuerza el scroll horizontal en pantallas angostas: siete
          columnas legibles pesan más que caber sin desplazar. */}
      <div className="min-w-[820px]">
        <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))] border-b border-arena-200 bg-arena-50">
          <div aria-hidden />
          {days.map((day, i) => {
            const isToday = todayIndex === i;
            return (
              <div
                key={day.toISOString()}
                className={`border-l border-arena-200 px-2 py-2 text-center ${
                  isToday ? "bg-verde-50" : ""
                }`}
              >
                <div className="font-mono text-[10.5px] tracking-[0.08em] text-tinta-500 uppercase">
                  {WEEKDAY_SHORT[i]}
                </div>
                <div
                  className={`font-display text-[19px] font-bold ${
                    isToday ? "text-verde-800" : "text-tinta-900"
                  }`}
                >
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        <div ref={scrollRef} className="max-h-[calc(100dvh-260px)] overflow-y-auto">
          <div
            className="relative grid grid-cols-[56px_repeat(7,minmax(0,1fr))]"
            style={{ height: gridHeight }}
          >
            {/* Regleta de horas */}
            <div className="relative">
              {hours.map((hour, i) => (
                <div
                  key={hour}
                  // La primera no se centra sobre su línea: quedaría cortada
                  // contra el borde de arriba de la grilla.
                  className={`absolute right-2 font-mono text-[10.5px] text-tinta-500 tabular-nums ${
                    i === 0 ? "" : "-translate-y-1/2"
                  }`}
                  style={{ top: i * HOUR_PX + (i === 0 ? 2 : 0) }}
                >
                  {hourLabel(hour)}
                </div>
              ))}
            </div>

            {days.map((day, dayIndex) => {
              const placed = placeOverlaps(appointmentsOfDay(appointments, day));
              const isToday = todayIndex === dayIndex;

              return (
                <div
                  key={day.toISOString()}
                  className={`relative border-l border-arena-200 ${
                    isToday ? "bg-verde-50/40" : ""
                  }`}
                  // Tocar un espacio libre arranca una cita ahí. La hora sale de
                  // dónde cayó el clic dentro de la columna, redondeada al
                  // cuarto: es cómo se lee un calendario en papel, y ahorra
                  // escribir el día y la hora que ya se estaban señalando.
                  onClick={(e) => {
                    if (e.target !== e.currentTarget) return;
                    const box = e.currentTarget.getBoundingClientRect();
                    const minutos = ((e.clientY - box.top) / HOUR_PX) * 60 + fromHour * 60;
                    const snapped = Math.round(minutos / SNAP_MINUTES) * SNAP_MINUTES;
                    const start = new Date(day);
                    start.setHours(0, snapped, 0, 0);
                    onPickSlot(start);
                  }}
                >
                  {hours.map((hour, i) => (
                    <div
                      key={hour}
                      // Sin esto, un clic que cae justo en la línea no cuenta
                      // como clic en el espacio libre.
                      className="pointer-events-none absolute inset-x-0 border-t border-arena-200/70"
                      style={{ top: i * HOUR_PX }}
                    />
                  ))}

                  {isToday && nowVisible && (
                    <div
                      className="pointer-events-none absolute inset-x-0 z-20 border-t-2 border-verde-600"
                      style={{ top: nowTop }}
                    >
                      <span className="absolute -top-[5px] -left-[4px] block h-2 w-2 rounded-full bg-verde-600" />
                    </div>
                  )}

                  {placed.map(({ appointment, lane, lanes }) => {
                    const start = minutesOfDay(appointment.startsAt);
                    const end = Math.max(minutesOfDay(appointment.endsAt), start + 15);
                    const top = (start / 60 - fromHour) * HOUR_PX;
                    const height = ((end - start) / 60) * HOUR_PX;
                    const selected = selectedId === appointment.id;
                    // Una cita de 30 min o menos solo tiene sitio para el nombre.
                    const compact = height < 44;

                    return (
                      <button
                        key={appointment.id}
                        type="button"
                        onClick={() => onSelect(appointment)}
                        aria-pressed={selected}
                        // El contenido visible del bloque se recorta según el
                        // alto, así que como nombre accesible no sirve: quien
                        // lo escucha necesita la cita entera, no lo que cupo.
                        aria-label={`${patientName(appointment)}, ${startTime(
                          appointment.startsAt
                        )}${appointment.notes ? `, ${appointment.notes}` : ""}${
                          STATUS_LABELS[appointment.status]
                            ? `, ${STATUS_LABELS[appointment.status]}`
                            : ""
                        }`}
                        style={{
                          top,
                          height,
                          left: `calc(${(lane / lanes) * 100}% + 2px)`,
                          width: `calc(${100 / lanes}% - 4px)`,
                        }}
                        className={`absolute z-10 overflow-hidden rounded-[8px] border px-1.5 py-1 text-left transition-shadow ${blockTone(
                          appointment.status
                        )} ${
                          selected
                            ? "shadow-media ring-2 ring-verde-600 ring-offset-1"
                            : "hover:shadow-suave"
                        }`}
                      >
                        {/* En un bloque corto entra una sola línea, y ahí gana
                            el nombre: la hora ya la dice la posición. */}
                        {!compact && (
                          <span className="block truncate font-mono text-[10px] tabular-nums opacity-80">
                            {startTime(appointment.startsAt)}
                          </span>
                        )}
                        <span className="block truncate text-[12.5px] leading-[1.3] font-semibold">
                          {patientName(appointment)}
                        </span>
                        {height >= 76 && appointment.notes && (
                          <span className="block truncate text-[11.5px] opacity-80">
                            {appointment.notes}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
