import type { Metadata } from "next";
import { AppointmentsExplorer } from "@/components/appointments/AppointmentsExplorer";

export const metadata: Metadata = {
  title: "Agenda de citas · Lucía",
  description:
    "Citas que Lucía dejó agendadas: quién viene, cuándo y desde qué conversación.",
};

export default function CitasPage() {
  return <AppointmentsExplorer />;
}
