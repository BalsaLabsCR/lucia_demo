import type { Metadata } from "next";
import { Suspense } from "react";
import { ChatsExplorer } from "@/components/chats/ChatsExplorer";

export const metadata: Metadata = {
  title: "Chats de Lucía",
  description:
    "Bandeja de conversaciones de Lucía: chats de WhatsApp y del sitio web, con los que requieren atención humana destacados.",
};

export default function ChatsPage() {
  // ChatsExplorer lee ?chat=<id> con useSearchParams (deep link desde /lucia/leads),
  // y eso obliga a un límite de Suspense para que la página pueda prerenderizarse.
  return (
    <Suspense
      fallback={
        <p className="grid h-dvh place-items-center text-[14px] text-tinta-500">
          Cargando bandeja…
        </p>
      }
    >
      <ChatsExplorer />
    </Suspense>
  );
}
