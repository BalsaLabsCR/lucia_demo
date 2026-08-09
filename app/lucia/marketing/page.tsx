import type { Metadata } from "next";
import { Suspense } from "react";
import { MarketingExplorer } from "@/components/marketing/MarketingExplorer";

export const metadata: Metadata = {
  title: "Marketing · Lucía",
  description:
    "Campañas asistidas por Lucía: propuesta creativa, guion y material, con aprobación de la clínica en cada paso.",
};

export default function MarketingPage() {
  // Lee ?campaign=<id> para abrir una campaña, igual que la bandeja de chats lee
  // ?chat=. useSearchParams obliga a un límite de Suspense para poder
  // prerenderizar la página.
  return (
    <Suspense
      fallback={
        <p className="grid h-dvh place-items-center text-[14px] text-tinta-500">
          Cargando campañas…
        </p>
      }
    >
      <MarketingExplorer />
    </Suspense>
  );
}
