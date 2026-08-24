import type { Metadata } from "next";
import { SalaDeOperacion } from "@/components/negocio/SalaDeOperacion";
import { esDominio } from "@/lib/negocio/dominios";
import { esTema, TEMA_POR_DEFECTO } from "@/lib/negocio/tema";

export const metadata: Metadata = {
  title: "Sala de Operación · Lucía",
  description:
    "Maqueta: seis agentes vigilando distintas áreas de una clínica ficticia. Datos de ejemplo.",
};

/**
 * La pestaña y el tema se leen acá, en el servidor, y bajan como props.
 *
 * Leerlos en el cliente con un efecto pintaría primero Dirección en claro y un
 * instante después lo pedido. Ese parpadeo no se nota en un monitor y se nota
 * muchísimo proyectado, justo al abrir el enlace que uno dejó preparado — y en
 * el caso del tema sería un fogonazo blanco antes de que entre el oscuro.
 */
export default async function NegocioPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { tab, tema } = await searchParams;
  const pedida = Array.isArray(tab) ? tab[0] : tab;
  const pedido = Array.isArray(tema) ? tema[0] : tema;

  return (
    <SalaDeOperacion
      inicial={esDominio(pedida) ? pedida : "direccion"}
      temaInicial={esTema(pedido) ? pedido : TEMA_POR_DEFECTO}
    />
  );
}
