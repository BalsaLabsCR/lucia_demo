import type { Metadata } from "next";
import { LeadsExplorer } from "@/components/leads/LeadsExplorer";

export const metadata: Metadata = {
  // El encabezado cambia según el objetivo del negocio ("Interesados" cuando
  // agenda), pero el título del navegador se queda fijo para no marear.
  title: "Interesados · Lucía",
  description:
    "Personas que preguntaron por un servicio, con las que no agendaron destacadas para darles seguimiento.",
};

export default function LeadsPage() {
  return <LeadsExplorer />;
}
