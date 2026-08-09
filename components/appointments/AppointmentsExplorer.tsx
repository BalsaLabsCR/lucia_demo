"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  addDays,
  isSameDay,
  RANGE_LABELS,
  startOfWeek,
  STATUS_LABELS,
  toLocalDateValue,
  weekLabel,
  type Appointment,
  type AppointmentCounts,
  type AppointmentRange,
} from "@/lib/appointments";
import { AppointmentDetail } from "./AppointmentDetail";
import { AppointmentsList } from "./AppointmentsList";
import { NewAppointmentDialog, type NewAppointmentDraft } from "./NewAppointmentDialog";
import { WeekCalendar } from "./WeekCalendar";

/** Cada cuánto se relee la agenda (ms). */
const POLL_MS = 15_000;

type ChannelFilter = "all" | "whatsapp" | "web";
type StatusFilter = "all" | "confirmed" | "cancelled";
type View = "week" | "list";

const RANGE_OPTIONS: AppointmentRange[] = ["upcoming", "past", "all"];

const CHANNEL_OPTIONS: Array<{ value: ChannelFilter; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "web", label: "Sitio web" },
];

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "Todas" },
  { value: "confirmed", label: STATUS_LABELS.confirmed },
  { value: "cancelled", label: STATUS_LABELS.cancelled },
];

const EMPTY_COUNTS: AppointmentCounts = {
  upcoming: 0,
  today: 0,
  cancelled: 0,
  total: 0,
};

/** Fetcher puro: devuelve datos o lanza. Sin estado de React adentro. */
async function fetchAppointments(
  query: string
): Promise<{ appointments: Appointment[]; counts: AppointmentCounts }> {
  const res = await fetch(`/api/lucia/appointments?${query}`);
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error ?? `El servidor respondió ${res.status}`);
  return {
    appointments: body.appointments ?? [],
    counts: body.counts ?? EMPTY_COUNTS,
  };
}

export function AppointmentsExplorer() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [counts, setCounts] = useState<AppointmentCounts>(EMPTY_COUNTS);

  const [view, setView] = useState<View>("week");
  /**
   * Lunes de la semana visible.
   *
   * Se calcula con el reloj de quien mira, que en el servidor es otro: un
   * domingo por la noche en Costa Rica ya es lunes en UTC, y serían semanas
   * distintas. No hace falta un efecto para arreglarlo — nada que dependa de
   * esta fecha se pinta hasta que llegan los datos, y eso solo pasa en el
   * cliente, que corre este inicializador con su propia hora.
   */
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [selectedId, setSelectedId] = useState<string | null>(null);

  /** Espacio donde se tocó la grilla: abre el formulario de cita nueva. */
  const [newSlot, setNewSlot] = useState<Date | null>(null);
  const [creating, setCreating] = useState(false);
  const [newError, setNewError] = useState<string | null>(null);
  const [conflictsWith, setConflictsWith] = useState<Appointment | null>(null);

  const [range, setRange] = useState<AppointmentRange>("upcoming");
  const [channel, setChannel] = useState<ChannelFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  /** Se incrementa tras cancelar, para releer del servidor. */
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // El calendario pide SU semana al backend, no todo el historial recortado
  // acá: una agenda vieja se lleva el `limit` entero y la semana que se quiere
  // ver es justo la que se queda afuera. La ventana es la paginación natural
  // de una agenda — cada semana es una página.
  const query = new URLSearchParams(
    view === "week"
      ? {
          from: weekStart.toISOString(),
          to: addDays(weekStart, 7).toISOString(),
          ...(channel !== "all" && { channel }),
          ...(status !== "all" && { status }),
          ...(debouncedSearch && { q: debouncedSearch }),
        }
      : {
          range,
          ...(channel !== "all" && { channel }),
          ...(status !== "all" && { status }),
          ...(debouncedSearch && { q: debouncedSearch }),
        }
  ).toString();

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await fetchAppointments(query);
        if (cancelled) return;
        setAppointments(data.appointments);
        setCounts(data.counts);
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "No se pudo cargar la agenda");
        }
      } finally {
        if (!cancelled) setLoaded(true);
      }
    };

    void load();
    const timer = setInterval(load, POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [query, refreshKey]);

  // En la vista de semana el backend ya devolvió solo esa ventana; el filtro
  // de acá es el que sostiene la lista mientras llega la respuesta del cambio
  // de semana, para que no se vea un parpadeo con las citas de la anterior.
  const weekAppointments = useMemo(() => {
    const end = addDays(weekStart, 7);
    return appointments.filter((a) => {
      const start = new Date(a.startsAt);
      return start >= weekStart && start < end;
    });
  }, [appointments, weekStart]);

  // Si la cita seleccionada dejó de estar a la vista (cambió la semana o un
  // filtro), el panel de detalle se cierra solo en vez de quedar mostrando algo
  // que ya no está en la grilla.
  const selected = weekAppointments.find((a) => a.id === selectedId) ?? null;

  // La confirmación de "¿seguro?" vive en la fila (AppointmentsList); acá solo
  // se ejecuta la cancelación ya confirmada.
  const cancel = async (appointment: Appointment) => {
    setBusyId(appointment.id);
    setNotice(null);
    try {
      const res = await fetch(`/api/lucia/appointments/${appointment.id}/cancel`, {
        method: "POST",
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? `El servidor respondió ${res.status}`);
      // El backend avisa si el evento del calendario no se pudo borrar: es una
      // cancelación parcial y quien la hizo tiene que enterarse.
      if (body?.warning) setNotice(body.warning);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cancelar la cita");
    } finally {
      setBusyId(null);
    }
  };

  /** Borra una cita agendada a mano. El backend rechaza las que vienen de un chat. */
  const remove = async (appointment: Appointment) => {
    setBusyId(appointment.id);
    setNotice(null);
    try {
      const res = await fetch(`/api/lucia/appointments/${appointment.id}`, {
        method: "DELETE",
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? `El servidor respondió ${res.status}`);
      if (body?.warning) setNotice(body.warning);
      setSelectedId(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo borrar la cita");
    } finally {
      setBusyId(null);
    }
  };

  const create = async (draft: NewAppointmentDraft) => {
    setCreating(true);
    setNewError(null);
    setConflictsWith(null);
    try {
      const endsAt = new Date(draft.startsAt.getTime() + draft.durationMinutes * 60_000);
      const res = await fetch("/api/lucia/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name.trim(),
          phone: draft.phone.trim() || null,
          notes: draft.notes.trim() || null,
          startsAt: draft.startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          force: draft.force ?? false,
        }),
      });
      const body = await res.json().catch(() => null);

      // 409 = el espacio choca. No es un error del formulario: se muestra con
      // quién choca y se deja decidir, porque quien agenda está viendo la
      // agenda y puede saber algo que el sistema no.
      if (res.status === 409 && body?.conflictsWith) {
        setConflictsWith(body.conflictsWith as Appointment);
        setNewError(body.error ?? null);
        return;
      }
      if (!res.ok) throw new Error(body?.error ?? `El servidor respondió ${res.status}`);

      if (body?.warning) setNotice(body.warning);
      // La semana visible salta a la de la cita nueva: si se agendó para otro
      // día desde el formulario, quedarse mirando esta semana la esconde.
      setWeekStart(startOfWeek(draft.startsAt));
      setNewSlot(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setNewError(err instanceof Error ? err.message : "No se pudo agendar la cita");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-dvh bg-blanco">
      <header className="border-b border-arena-200 bg-arena-50 px-4 pt-3 pb-3 dk:px-6">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div>
            <Link href="/" className="text-[13px] font-semibold text-verde-800 hover:underline">
              ← Volver al sitio
            </Link>
            <h1 className="font-display text-[24px] font-bold tracking-[-0.01em]">
              Agenda de citas
            </h1>
            <p className="text-[13px] text-tinta-500">
              {view === "week"
                ? "Las citas que Lucía dejó agendadas, semana por semana."
                : "Las citas que Lucía dejó agendadas, de la más próxima en adelante."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setNewError(null);
                setConflictsWith(null);
                setNewSlot(defaultSlot(weekStart));
              }}
              className="rounded-full bg-verde-950 px-4 py-2 text-[13px] font-semibold text-crema-100 transition-opacity hover:opacity-90"
            >
              + Agendar
            </button>
            <Link
              href="/lucia/chats"
              className="rounded-full border-[1.5px] border-menta-200 bg-blanco px-4 py-2 text-[13px] font-semibold text-verde-800 transition-colors hover:bg-verde-50"
            >
              Chats
            </Link>
            <Link
              href="/lucia/leads"
              className="rounded-full border-[1.5px] border-menta-200 bg-blanco px-4 py-2 text-[13px] font-semibold text-verde-800 transition-colors hover:bg-verde-50"
            >
              Interesados
            </Link>
            <Link
              href="/lucia/knowledge"
              className="rounded-full border-[1.5px] border-menta-200 bg-blanco px-4 py-2 text-[13px] font-semibold text-verde-800 transition-colors hover:bg-verde-50"
            >
              Conocimiento
            </Link>
          </div>
        </div>

        <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
          <Stat label="Hoy" value={counts.today} highlight={counts.today > 0} />
          <Stat label="Próximas" value={counts.upcoming} />
          <Stat label="Canceladas" value={counts.cancelled} />
        </dl>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <FilterGroup
            label="Vista"
            options={[
              { value: "week" as View, label: "Semana" },
              { value: "list" as View, label: "Lista" },
            ]}
            value={view}
            onChange={setView}
          />

          {/* Hasta que no lleguen los datos no se pinta: la semana sale del
              reloj del cliente y el HTML del servidor diría otra. */}
          {view === "week" && loaded && (
            <WeekNav
              weekStart={weekStart}
              onChange={setWeekStart}
              count={weekAppointments.length}
            />
          )}

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, teléfono o motivo…"
            className="min-w-[200px] flex-1 rounded-[10px] border border-arena-200 bg-blanco px-3 py-2 text-[14px] placeholder:text-tinta-500/60 focus:border-verde-600 focus:outline-none dk:max-w-[300px]"
          />
          {/* En el calendario, "cuándo" lo decide la semana que se está viendo. */}
          {view === "list" && (
            <FilterGroup
              label="Cuándo"
              options={RANGE_OPTIONS.map((value) => ({ value, label: RANGE_LABELS[value] }))}
              value={range}
              onChange={setRange}
            />
          )}
          <FilterGroup
            label="Estado"
            options={STATUS_OPTIONS}
            value={status}
            onChange={setStatus}
          />
          <FilterGroup
            label="Canal"
            options={CHANNEL_OPTIONS}
            value={channel}
            onChange={setChannel}
          />
        </div>
      </header>

      {notice && (
        <p className="m-4 rounded-[12px] border border-ambar-bd bg-ambar-bg px-4 py-3 text-[13.5px] text-ambar-tx">
          {notice}
        </p>
      )}

      {error && (
        <p className="m-4 rounded-[12px] border border-error-bd bg-error-bg px-4 py-3 text-[13.5px] text-error-tx">
          {error}
        </p>
      )}

      {!loaded && !error ? (
        <p className="px-6 py-14 text-center text-[13.5px] text-tinta-500">Cargando agenda…</p>
      ) : view === "list" ? (
        <AppointmentsList appointments={appointments} busyId={busyId} onCancel={cancel} />
      ) : (
        <>
          <WeekCalendar
            appointments={weekAppointments}
            weekStart={weekStart}
            selectedId={selected?.id ?? null}
            onSelect={(appointment) =>
              setSelectedId((current) => (current === appointment.id ? null : appointment.id))
            }
            onPickSlot={(start) => {
              setNewError(null);
              setConflictsWith(null);
              setNewSlot(start);
            }}
          />
          {selected ? (
            <AppointmentDetail
              appointment={selected}
              busy={busyId === selected.id}
              onCancel={cancel}
              onDelete={remove}
              onClose={() => setSelectedId(null)}
            />
          ) : (
            <p className="border-t border-arena-200 px-4 py-2.5 text-[12.5px] text-tinta-500 dk:px-6">
              Tocá una cita para ver el teléfono y poder cancelarla, o un espacio libre para
              agendar una a mano.
            </p>
          )}
        </>
      )}

      {newSlot && (
        <NewAppointmentDialog
          initialStart={newSlot}
          busy={creating}
          conflictsWith={conflictsWith}
          error={newError}
          onSubmit={create}
          onClose={() => setNewSlot(null)}
        />
      )}
    </div>
  );
}

/** Ir y venir entre semanas, con "Hoy" para volver sin contar hacia atrás. */
function WeekNav({
  weekStart,
  onChange,
  count,
}: {
  weekStart: Date;
  onChange: (date: Date) => void;
  count: number;
}) {
  const thisWeek = startOfWeek(new Date());
  const isCurrent = isSameDay(weekStart, thisWeek);

  const arrow =
    "rounded-full border border-arena-200 bg-blanco px-2.5 py-1.5 text-[13px] font-semibold text-tinta-600 transition-colors hover:bg-arena-100";

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(addDays(weekStart, -7))}
          aria-label="Semana anterior"
          className={arrow}
        >
          ←
        </button>
        <button
          type="button"
          onClick={() => onChange(thisWeek)}
          disabled={isCurrent}
          className={`rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${
            isCurrent
              ? "border border-arena-200 bg-arena-100 text-tinta-500"
              : "bg-verde-950 text-crema-100"
          }`}
        >
          Hoy
        </button>
        <button
          type="button"
          onClick={() => onChange(addDays(weekStart, 7))}
          aria-label="Semana siguiente"
          className={arrow}
        >
          →
        </button>
      </div>

      <div className="leading-tight">
        {/* El texto de la semana ES el selector: se toca y sale el calendario
            nativo del sistema. Saltar a una semana de dentro de tres meses con
            las flechas son doce clics; acá son dos, y en el móvil sale la
            ruedita de fechas del teléfono sin cargar ninguna librería. */}
        <label className="relative block cursor-pointer">
          <span className="text-[13px] font-semibold text-tinta-900 hover:underline">
            {weekLabel(weekStart)}
          </span>
          <input
            type="date"
            aria-label="Ir a la semana de una fecha"
            value={toLocalDateValue(weekStart)}
            onChange={(e) => {
              const picked = new Date(`${e.target.value}T12:00:00`);
              if (!Number.isNaN(picked.getTime())) onChange(startOfWeek(picked));
            }}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
        <div className="font-mono text-[10.5px] tracking-[0.06em] text-tinta-500 uppercase">
          {count === 0 ? "sin citas" : `${count} cita${count === 1 ? "" : "s"}`}
        </div>
      </div>
    </div>
  );
}

/**
 * Dónde arranca una cita nueva cuando se pide desde el botón y no tocando la
 * grilla: la próxima hora en punto si la semana visible es la de hoy, y si no,
 * las 9 del lunes de esa semana.
 */
function defaultSlot(weekStart: Date): Date {
  const now = new Date();
  if (isSameDay(startOfWeek(now), weekStart)) {
    const next = new Date(now);
    next.setHours(now.getHours() + 1, 0, 0, 0);
    return next;
  }
  const monday = new Date(weekStart);
  monday.setHours(9, 0, 0, 0);
  return monday;
}

function Stat({
  label,
  value,
  highlight = false,
  alert = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  alert?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="font-mono text-[10.5px] tracking-[0.08em] text-tinta-500 uppercase">
        {label}
      </dt>
      <dd
        className={`font-display text-[17px] font-bold ${
          alert ? "text-error-tx" : highlight ? "text-verde-800" : "text-tinta-900"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function FilterGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-[10.5px] tracking-[0.08em] text-tinta-500 uppercase">
        {label}
      </span>
      <div className="flex gap-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={value === option.value}
            className={`rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${
              value === option.value
                ? "bg-verde-950 text-crema-100"
                : "border border-arena-200 bg-blanco text-tinta-600 hover:bg-arena-100"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
