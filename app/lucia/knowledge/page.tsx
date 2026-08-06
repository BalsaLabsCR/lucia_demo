import type { Metadata } from "next";
import { KnowledgeEditor } from "@/components/knowledge/KnowledgeEditor";

export const metadata: Metadata = {
  title: "Conocimiento de Lucía — configuración",
  description:
    "Panel de configuración del conocimiento de Lucía: servicios, precios, horarios, personal y reglas de comportamiento del asistente.",
};

export default function KnowledgePage() {
  return <KnowledgeEditor />;
}
