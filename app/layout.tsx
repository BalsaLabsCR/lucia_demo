import type { Metadata } from "next";
import "./globals.css";
import { CLINIC } from "@/lib/clinic";

export const metadata: Metadata = {
  title: `${CLINIC.name} — sitio demo de Lucía AI`,
  description:
    "Sitio de demostración: clínica dental ficticia creada para mostrar a Lucía AI, la asistente virtual que atiende clientes por WhatsApp y por chat web.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // El diseño usa stacks de sistema (serif humanista para display, sans del SO
  // para UI): no se cargan webfonts.
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full flex flex-col text-[15px]">{children}</body>
    </html>
  );
}
