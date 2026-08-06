"use client";

import { openLuciaChat } from "@/lib/chatEvents";

/**
 * Botón que abre el widget de Lucía desde cualquier parte de la página
 * (el widget escucha el evento; así el resto del sitio sigue siendo server).
 */
export function OpenChatButton({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button type="button" onClick={() => openLuciaChat()} className={className}>
      {children}
    </button>
  );
}
