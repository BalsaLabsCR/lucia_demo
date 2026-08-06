"use client";

import { newId, WEEKDAY_LABELS, type Knowledge, type SpecialDay } from "@/lib/knowledge";
import { AddButton, Checkbox, RemoveButton, SectionCard, inputCls } from "./fields";

interface Props {
  value: Knowledge["schedule"];
  onChange: (schedule: Knowledge["schedule"]) => void;
}

const timeCls = `${inputCls} w-auto px-2 py-1.5 font-mono text-[13px]`;

export function ScheduleSection({ value, onChange }: Props) {
  const updateDay = (day: string, patch: Partial<Knowledge["schedule"]["weekly"][number]>) =>
    onChange({
      ...value,
      weekly: value.weekly.map((d) => (d.day === day ? { ...d, ...patch } : d)),
    });

  const updateSpecial = (id: string, patch: Partial<SpecialDay>) =>
    onChange({
      ...value,
      specialDays: value.specialDays.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });

  const addSpecial = () =>
    onChange({
      ...value,
      specialDays: [
        ...value.specialDays,
        { id: newId("dia"), date: "", reason: "", closed: true, open: "08:00", close: "12:00" },
      ],
    });

  return (
    <SectionCard
      id="horarios"
      title="Horarios"
      description="Horario semanal de la clínica y fechas especiales (feriados, jornadas cortas). Los horarios de cada doctor se configuran en la sección Personal."
    >
      <div className="flex flex-col divide-y divide-dotted divide-arena-300 rounded-[12px] border border-arena-200 bg-arena-50 px-4">
        {value.weekly.map((d) => (
          <div key={d.day} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-2.5">
            <span className="w-[92px] text-[14px] font-semibold">{WEEKDAY_LABELS[d.day]}</span>
            <Checkbox checked={d.closed} onChange={(closed) => updateDay(d.day, { closed })}>
              Cerrado
            </Checkbox>
            {!d.closed && (
              <span className="flex items-center gap-2 text-[13px] text-tinta-600">
                de
                <input
                  type="time"
                  className={timeCls}
                  value={d.open}
                  onChange={(e) => updateDay(d.day, { open: e.target.value })}
                />
                a
                <input
                  type="time"
                  className={timeCls}
                  value={d.close}
                  onChange={(e) => updateDay(d.day, { close: e.target.value })}
                />
              </span>
            )}
          </div>
        ))}
      </div>

      <h3 className="mt-6 text-[15px] font-bold">Fechas especiales</h3>
      <p className="mt-0.5 text-[13px] text-tinta-500">
        Feriados, cierres o jornadas con horario distinto. Tienen prioridad sobre el horario
        semanal.
      </p>

      <div className="mt-3 flex flex-col gap-2.5">
        {value.specialDays.map((s) => (
          <div
            key={s.id}
            className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[12px] border border-arena-200 bg-arena-50 px-4 py-3"
          >
            <input
              type="date"
              className={timeCls}
              value={s.date}
              onChange={(e) => updateSpecial(s.id, { date: e.target.value })}
            />
            <input
              className={`${inputCls} w-auto min-w-[180px] flex-1`}
              value={s.reason}
              onChange={(e) => updateSpecial(s.id, { reason: e.target.value })}
              placeholder="Motivo (feriado, jornada corta…)"
            />
            <Checkbox checked={s.closed} onChange={(closed) => updateSpecial(s.id, { closed })}>
              Cerrado
            </Checkbox>
            {!s.closed && (
              <span className="flex items-center gap-2 text-[13px] text-tinta-600">
                de
                <input
                  type="time"
                  className={timeCls}
                  value={s.open}
                  onChange={(e) => updateSpecial(s.id, { open: e.target.value })}
                />
                a
                <input
                  type="time"
                  className={timeCls}
                  value={s.close}
                  onChange={(e) => updateSpecial(s.id, { close: e.target.value })}
                />
              </span>
            )}
            <RemoveButton
              onClick={() =>
                onChange({
                  ...value,
                  specialDays: value.specialDays.filter((x) => x.id !== s.id),
                })
              }
              label={`Eliminar la fecha especial ${s.date || "nueva"}`}
            />
          </div>
        ))}
      </div>

      <div className="mt-4">
        <AddButton onClick={addSpecial}>Agregar fecha especial</AddButton>
      </div>
    </SectionCard>
  );
}
