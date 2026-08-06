"use client";

import Link from "next/link";
import { CHANNEL_LABELS, fullDateTime, relativeTime } from "@/lib/chats";
import { contactPhone, leadName, TYPE_LABELS, type Lead } from "@/lib/leads";

/** Un lead por fila: quién es, qué quiere, y cómo llegarle. */
function LeadRow({ lead }: { lead: Lead }) {
  const hot = lead.type === "hot_lead";
  const phone = contactPhone(lead);
  const name = leadName(lead);

  return (
    <li className="border-b border-arena-200 px-4 py-3.5 transition-colors hover:bg-arena-50 dk:px-6">
      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <span
          className={`rounded-full px-2.5 py-0.5 font-mono text-[10.5px] tracking-[0.06em] ${
            hot
              ? "border border-ambar-bd bg-ambar-bg text-ambar-tx"
              : "border border-menta-200 bg-verde-50 text-verde-800"
          }`}
        >
          {TYPE_LABELS[lead.type] ?? lead.type}
        </span>

        <h3 className="text-[15px] font-semibold text-tinta-900">{name}</h3>

        {lead.booked && (
          // Ya agendó: no hay nada que perseguir acá. Se marca en vez de
          // esconderlo, para que se note que el interés terminó en cita.
          <span className="rounded-full border border-menta-200 bg-verde-50 px-2.5 py-0.5 font-mono text-[10.5px] tracking-[0.06em] text-verde-800">
            Agendó
          </span>
        )}

        <span className="ml-auto text-[12.5px] text-tinta-500" title={fullDateTime(lead.createdAt)}>
          {relativeTime(lead.createdAt)}
        </span>
      </div>

      {lead.notes && (
        <p className="mt-1.5 text-[14px] leading-[1.5] text-tinta-600">{lead.notes}</p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12.5px]">
        <span className="text-tinta-500">
          {CHANNEL_LABELS[lead.channel] ?? lead.channel}
        </span>

        {phone ? (
          <>
            <a
              href={`tel:${phone.replace(/[^\d+]/g, "")}`}
              className="font-semibold text-verde-800 hover:underline"
            >
              {phone}
            </a>
            <a
              href={`https://wa.me/${phone.replace(/[^\d]/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-verde-800 hover:underline"
            >
              WhatsApp ↗
            </a>
          </>
        ) : (
          // Sin teléfono el lead no es accionable: hay que decirlo, no esconderlo.
          <span className="text-tinta-500 italic">Sin teléfono — respondele por el chat</span>
        )}

        {lead.conversation ? (
          <Link
            href={`/lucia/chats?chat=${lead.conversation.id}`}
            className="font-semibold text-verde-800 hover:underline"
          >
            Ver conversación ({lead.conversation.messageCount})
          </Link>
        ) : (
          <span className="text-tinta-500 italic">Conversación borrada</span>
        )}
      </div>
    </li>
  );
}

export function LeadsList({ leads }: { leads: Lead[] }) {
  if (leads.length === 0) {
    return (
      <p className="px-6 py-14 text-center text-[14px] text-tinta-500">
        No hay leads que coincidan con los filtros.
      </p>
    );
  }

  return (
    <ul className="border-t border-arena-200">
      {leads.map((lead) => (
        <LeadRow key={lead.id} lead={lead} />
      ))}
    </ul>
  );
}
