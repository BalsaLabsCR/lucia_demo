"use client";

import { newId, type StaffMember } from "@/lib/knowledge";
import {
  AddButton,
  Field,
  RemoveButton,
  SectionCard,
  inputCls,
  textareaCls,
} from "./fields";

interface Props {
  value: StaffMember[];
  onChange: (staff: StaffMember[]) => void;
}

const dateCls = `${inputCls} w-auto px-2 py-1.5 font-mono text-[13px]`;

export function StaffSection({ value, onChange }: Props) {
  const update = (id: string, patch: Partial<StaffMember>) =>
    onChange(value.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const add = () =>
    onChange([
      ...value,
      { id: newId("dr"), name: "", role: "", bio: "", schedule: "", vacations: [] },
    ]);

  return (
    <SectionCard
      id="personal"
      title="Personal"
      description="El equipo de la clínica: bio pública, horario de cada profesional y sus vacaciones. Nada confidencial — Lucía puede compartir esta información con los clientes."
    >
      <div className="flex flex-col gap-3">
        {value.map((member) => (
          <details
            key={member.id}
            open={member.name === ""}
            className="group rounded-[12px] border border-arena-200 bg-arena-50"
          >
            <summary className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
              <span className="text-tinta-500 transition-transform group-open:rotate-90">▸</span>
              <span className="font-semibold">{member.name || "Profesional nuevo"}</span>
              {member.role && <span className="text-[13px] text-tinta-500">{member.role}</span>}
              {member.vacations.length > 0 && (
                <span className="rounded-full border border-ambar-bd bg-ambar-bg px-2 py-0.5 text-[11px] font-semibold text-ambar-tx">
                  vacaciones programadas
                </span>
              )}
            </summary>

            <div className="grid gap-4 border-t border-arena-200 p-4 dk:grid-cols-2">
              <Field label="Nombre">
                <input
                  className={inputCls}
                  value={member.name}
                  onChange={(e) => update(member.id, { name: e.target.value })}
                  placeholder="Dra. Mariana Solís"
                />
              </Field>
              <Field label="Especialidad o rol">
                <input
                  className={inputCls}
                  value={member.role}
                  onChange={(e) => update(member.id, { role: e.target.value })}
                  placeholder="Especialista en Ortodoncia"
                />
              </Field>
              <Field
                label="Bio pública"
                hint="Contexto que Lucía puede dar si le preguntan por el/la profesional."
                className="dk:col-span-2"
              >
                <textarea
                  className={textareaCls}
                  value={member.bio}
                  onChange={(e) => update(member.id, { bio: e.target.value })}
                />
              </Field>
              <Field
                label="Horario de atención"
                hint='Texto libre: "Lunes a viernes de 8:00 a.m. a 4:00 p.m.".'
                className="dk:col-span-2"
              >
                <input
                  className={inputCls}
                  value={member.schedule}
                  onChange={(e) => update(member.id, { schedule: e.target.value })}
                />
              </Field>

              <div className="dk:col-span-2">
                <span className="mb-1 block text-[13px] font-semibold text-tinta-600">
                  Vacaciones y ausencias
                </span>
                <div className="flex flex-col gap-2">
                  {member.vacations.map((v) => (
                    <div key={v.id} className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      <span className="text-[13px] text-tinta-600">del</span>
                      <input
                        type="date"
                        className={dateCls}
                        value={v.start}
                        onChange={(e) =>
                          update(member.id, {
                            vacations: member.vacations.map((x) =>
                              x.id === v.id ? { ...x, start: e.target.value } : x
                            ),
                          })
                        }
                      />
                      <span className="text-[13px] text-tinta-600">al</span>
                      <input
                        type="date"
                        className={dateCls}
                        value={v.end}
                        onChange={(e) =>
                          update(member.id, {
                            vacations: member.vacations.map((x) =>
                              x.id === v.id ? { ...x, end: e.target.value } : x
                            ),
                          })
                        }
                      />
                      <input
                        className={`${inputCls} w-auto min-w-[140px] flex-1`}
                        value={v.note}
                        onChange={(e) =>
                          update(member.id, {
                            vacations: member.vacations.map((x) =>
                              x.id === v.id ? { ...x, note: e.target.value } : x
                            ),
                          })
                        }
                        placeholder="Nota (opcional)"
                      />
                      <RemoveButton
                        onClick={() =>
                          update(member.id, {
                            vacations: member.vacations.filter((x) => x.id !== v.id),
                          })
                        }
                        label="Eliminar ausencia"
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-2.5">
                  <AddButton
                    onClick={() =>
                      update(member.id, {
                        vacations: [
                          ...member.vacations,
                          { id: newId("vac"), start: "", end: "", note: "" },
                        ],
                      })
                    }
                  >
                    Agregar ausencia
                  </AddButton>
                </div>
              </div>

              <div className="flex justify-end dk:col-span-2">
                <RemoveButton
                  onClick={() => onChange(value.filter((s) => s.id !== member.id))}
                  label={`Eliminar a ${member.name || "profesional nuevo"}`}
                />
              </div>
            </div>
          </details>
        ))}
      </div>

      <div className="mt-4">
        <AddButton onClick={add}>Agregar profesional</AddButton>
      </div>
    </SectionCard>
  );
}
