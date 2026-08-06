"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  RANGE_LABELS,
  STATUS_LABELS,
  type Appointment,
  type AppointmentCounts,
  type AppointmentRange,
} from "@/lib/appointments";
import { AppointmentsList } from "./AppointmentsList";

/** Cada cuánto se relee la agenda (ms). */
const POLL_MS = 15_000;

type ChannelFilter = "all" | "whatsapp" | "web";
type StatusFilter = "all" | "confirmed" | "conflict" | "cancelled";

const RANGE_OPTIONS: AppointmentRange[] = ["upcoming", "past", "all"];

const CHANNEL_OPTIONS: Array<{ value: ChannelFilter; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "web", label: "Sitio web" },
];

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "Todas" },
  { value: "confirmed", label: STATUS_LABELS.confirmed },
  { value: "conflict", label: STATUS_LABELS.conflict },
  { value: "cancelled", label: STATUS_LABELS.cancelled },
];

const EMPTY_COUNTS: AppointmentCounts = {
  upcoming: 0,
  today: 0,
  conflicts: 0,
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

  const query = new URLSearchParams({
    range,
    ...(channel !== "all" && { channel }),
    ...(status !== "all" && { status }),
    ...(debouncedSearch && { q: debouncedSearch }),
  }).toString();

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
              Las citas que Lucía dejó agendadas, de la más próxima en adelante.
            </p>
          </div>
          <div className="flex gap-2">
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
          <Stat label="Sin confirmar" value={counts.conflicts} alert={counts.conflicts > 0} />
          <Stat label="Canceladas" value={counts.cancelled} />
        </dl>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, teléfono o motivo…"
            className="min-w-[200px] flex-1 rounded-[10px] border border-arena-200 bg-blanco px-3 py-2 text-[14px] placeholder:text-tinta-500/60 focus:border-verde-600 focus:outline-none dk:max-w-[300px]"
          />
          <FilterGroup
            label="Cuándo"
            options={RANGE_OPTIONS.map((value) => ({ value, label: RANGE_LABELS[value] }))}
            value={range}
            onChange={setRange}
          />
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

      {counts.conflicts > 0 && status !== "conflict" && (
        <p className="border-b border-ambar-bd bg-ambar-bg px-4 py-2.5 text-[13.5px] text-ambar-tx dk:px-6">
          Hay {counts.conflicts} cita{counts.conflicts === 1 ? "" : "s"} que no se pudo
          agendar porque el horario estaba ocupado.{" "}
          <button
            type="button"
            onClick={() => {
              setStatus("conflict");
              setRange("all");
            }}
            className="font-semibold underline"
          >
            Verlas
          </button>
        </p>
      )}

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
      ) : (
        <AppointmentsList
          appointments={appointments}
          busyId={busyId}
          onCancel={cancel}
        />
      )}
    </div>
  );
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
