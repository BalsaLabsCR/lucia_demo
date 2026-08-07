"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  SORT_LABELS,
  TYPE_LABELS,
  type Lead,
  type LeadCounts,
  type LeadSort,
} from "@/lib/leads";
import { LeadsList } from "./LeadsList";

/** Cada cuánto se relee el listado (ms). */
const POLL_MS = 15_000;

type ChannelFilter = "all" | "whatsapp" | "web";
type TypeFilter = "all" | "hot_lead" | "lead";

const CHANNEL_OPTIONS: Array<{ value: ChannelFilter; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "web", label: "Sitio web" },
];

const TYPE_OPTIONS: Array<{ value: TypeFilter; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "hot_lead", label: TYPE_LABELS.hot_lead },
  { value: "lead", label: TYPE_LABELS.lead },
];

const SORT_OPTIONS: LeadSort[] = ["recent", "oldest", "name"];

/**
 * Por defecto se muestran los que NO agendaron. Es la única vista accionable:
 * quien ya tiene cita no necesita seguimiento, y mezclarlos convierte la lista
 * en un registro histórico en vez de una lista de trabajo.
 */
type StatusFilter = "pending" | "booked" | "all";

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: "pending", label: "Sin cita" },
  { value: "booked", label: "Ya agendaron" },
  { value: "all", label: "Todos" },
];

const EMPTY_COUNTS: LeadCounts = {
  all: 0,
  hot: 0,
  normal: 0,
  pending: 0,
  lastDay: 0,
  lastWeek: 0,
};

/** Fetcher puro: devuelve datos o lanza. Sin estado de React adentro. */
async function fetchLeads(query: string): Promise<{
  leads: Lead[];
  counts: LeadCounts;
}> {
  const res = await fetch(`/api/lucia/leads?${query}`);
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error ?? `El servidor respondió ${res.status}`);
  return {
    leads: body.leads ?? [],
    counts: body.counts ?? EMPTY_COUNTS,
  };
}

/**
 * La estrategia del deploy: qué es ganar una conversación en este negocio.
 *
 * Ya no viene con el listado de interesados. Ese endpoint lo sirve el plugin de
 * leads, y la meta del negocio no es asunto suyo: un negocio puede tener leads
 * y agenda y querer, ante todo, vender producto. La estrategia la reporta el
 * core, que es quien la conoce.
 */
async function fetchStrategy(): Promise<string> {
  const res = await fetch("/api/lucia/business-context");
  if (!res.ok) return "";
  const body = await res.json().catch(() => null);
  return typeof body?.strategy === "string" ? body.strategy : "";
}

export function LeadsExplorer() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [counts, setCounts] = useState<LeadCounts>(EMPTY_COUNTS);
  const [strategy, setStrategy] = useState("");

  const [channel, setChannel] = useState<ChannelFilter>("all");
  const [type, setType] = useState<TypeFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("pending");
  const [sort, setSort] = useState<LeadSort>("recent");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // La estrategia no cambia mientras el panel está abierto: se lee una vez.
  useEffect(() => {
    let cancelled = false;
    void fetchStrategy().then((s) => {
      if (!cancelled) setStrategy(s);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const query = new URLSearchParams({
    ...(channel !== "all" && { channel }),
    ...(type !== "all" && { type }),
    ...(status !== "all" && { status }),
    ...(debouncedSearch && { q: debouncedSearch }),
    sort,
  }).toString();

  // Carga inicial + sondeo. Se reinicia al cambiar cualquier filtro.
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await fetchLeads(query);
        if (cancelled) return;
        setLeads(data.leads);
        setCounts(data.counts);
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "No se pudieron cargar los leads");
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
  }, [query]);

  /** El negocio agenda por sí mismo: hay algo que "cerrar" además del contacto. */
  // Con la agenda como meta, la vista distingue quién ya agendó de quién no.
  const books = strategy === "appointment-first";

  return (
    <div className="min-h-dvh bg-blanco">
      <header className="border-b border-arena-200 bg-arena-50 px-4 pt-3 pb-3 dk:px-6">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div>
            <Link href="/" className="text-[13px] font-semibold text-verde-800 hover:underline">
              ← Volver al sitio
            </Link>
            <h1 className="font-display text-[24px] font-bold tracking-[-0.01em]">
              {books ? "Interesados" : "Leads de Lucía"}
            </h1>
            <p className="text-[13px] text-tinta-500">
              {books
                ? "Personas que preguntaron por un servicio. Las que no agendaron son las que vale la pena perseguir."
                : "Personas que mostraron interés y dejaron sus datos para que el equipo las contacte."}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/lucia/citas"
              className="rounded-full border-[1.5px] border-menta-200 bg-blanco px-4 py-2 text-[13px] font-semibold text-verde-800 transition-colors hover:bg-verde-50"
            >
              Citas
            </Link>
            <Link
              href="/lucia/chats"
              className="rounded-full border-[1.5px] border-menta-200 bg-blanco px-4 py-2 text-[13px] font-semibold text-verde-800 transition-colors hover:bg-verde-50"
            >
              Chats
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
          {books && (
            <Stat label="Sin cita" value={counts.pending} highlight={counts.pending > 0} />
          )}
          <Stat label="Total" value={counts.all} />
          <Stat label="Quieren contratar" value={counts.hot} highlight={counts.hot > 0} />
          <Stat label="Últimas 24 h" value={counts.lastDay} />
          <Stat label="Últimos 7 días" value={counts.lastWeek} />
        </dl>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, teléfono o interés…"
            className="min-w-[200px] flex-1 rounded-[10px] border border-arena-200 bg-blanco px-3 py-2 text-[14px] placeholder:text-tinta-500/60 focus:border-verde-600 focus:outline-none dk:max-w-[320px]"
          />
          {/* Solo tiene sentido donde hay citas que agendar: si el negocio
              captura leads y nada más, nadie "agenda" nunca. */}
          {books && (
            <FilterGroup
              label="Seguimiento"
              options={STATUS_OPTIONS}
              value={status}
              onChange={setStatus}
            />
          )}
          <FilterGroup label="Tipo" options={TYPE_OPTIONS} value={type} onChange={setType} />
          <FilterGroup
            label="Canal"
            options={CHANNEL_OPTIONS}
            value={channel}
            onChange={setChannel}
          />
          <label className="flex items-center gap-1.5">
            <span className="font-mono text-[10.5px] tracking-[0.08em] text-tinta-500 uppercase">
              Orden
            </span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as LeadSort)}
              className="rounded-full border border-arena-200 bg-blanco px-3 py-1.5 text-[12.5px] font-semibold text-tinta-600 focus:border-verde-600 focus:outline-none"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {SORT_LABELS[option]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      {error && (
        <p className="m-4 rounded-[12px] border border-error-bd bg-error-bg px-4 py-3 text-[13.5px] text-error-tx">
          {error}
        </p>
      )}

      {!loaded && !error ? (
        <p className="px-6 py-14 text-center text-[13.5px] text-tinta-500">Cargando leads…</p>
      ) : (
        <LeadsList leads={leads} />
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  // En línea, no apilado: en móvil el encabezado ya es alto y la lista es lo
  // que importa. "TOTAL 6" se lee igual de bien y ahorra media pantalla.
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="font-mono text-[10.5px] tracking-[0.08em] text-tinta-500 uppercase">
        {label}
      </dt>
      <dd
        className={`font-display text-[17px] font-bold ${
          highlight ? "text-ambar-tx" : "text-tinta-900"
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
