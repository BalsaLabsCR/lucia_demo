import type { Metadata } from "next";
import { CopilotExplorer } from "@/components/copilot/CopilotExplorer";

export const metadata: Metadata = {
  title: "Copiloto de Negocio · Lucía",
  description:
    "Lucía mira los números de la clínica, detecta lo que se salió de lo normal y propone qué hacer. Cada acción la aprueba una persona.",
};

export default function CopilotoPage() {
  return <CopilotExplorer />;
}
