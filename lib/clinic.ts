import type { StaticImageData } from "next/image";
import andresVargas from "@/public/dr-andres-vargas.png";
import carolinaMendez from "@/public/dra-carolina-mendez.png";
import marianaSolis from "@/public/dra-mariana-solis.png";

/**
 * Datos de la clínica FICTICIA que usa este sitio de demostración.
 * Copy según la revisión de diseño "Sonrisa Pura".
 *
 * IMPORTANTE: precios, horarios, dirección y políticas deben coincidir con el
 * conocimiento de Lucía, que se edita en /lucia/knowledge (defaults en
 * `lucia-backend/src/knowledge/defaults.ts`). Si se cambian aquí sin cambiarlos
 * allá, el sitio y las respuestas de Lucía dejan de ser coherentes.
 */
export const CLINIC = {
  name: "Clínica Dental Sonrisa Pura",
  shortName: "Sonrisa Pura",
  region: "Escazú · San José, Costa Rica",
  headline: "Salud y estética dental con un trato",
  headlineAccent: "cercano y profesional",
  intro:
    "Atención personalizada, tecnología moderna y presupuestos por escrito antes de iniciar cualquier tratamiento. Con cita previa, en Plaza Vista, Escazú.",
  addressLines: [
    "Centro Comercial Plaza Vista, local 12, segundo piso",
    "Escazú, San José, Costa Rica",
  ],
  addressNote: "Frente al parqueo principal · parqueo gratuito",
  phone: "2288-4455",
  phoneHref: "tel:+50622884455",
  whatsappHref: "https://wa.me/50622884455",
  hours: [
    { days: "Lunes a viernes", time: "8:00 a.m. – 6:00 p.m." },
    { days: "Sábados", time: "8:00 a.m. – 12:00 m.d." },
    { days: "Domingos y feriados", time: "Cerrado", closed: true },
  ],
  policies:
    "Se atiende con cita previa · cancelaciones con 24 h de anticipación · SINPE Móvil, tarjeta y efectivo.",
} as const;

export const STATS = [
  { value: "12 años", label: "atendiendo en Escazú" },
  { value: "4.9 ★", label: "calificación promedio" },
  { value: "3.500+", label: "pacientes" },
] as const;

export const TRUST_CHIPS = [
  { text: "🅿 Parqueo gratis frente al local" },
  { text: "SINPE Móvil · Visa · Mastercard · efectivo" },
  { text: "Sábados 8:00 a.m.–12:00 m.d." },
  { text: "Profesionales colegiados · CCDCR", fictionalNote: "(ficticio)" },
] as const;

export interface Service {
  name: string;
  /** Prefijo en gris antes del monto ("desde"), si aplica. */
  pricePrefix?: string;
  price: string;
  /** true cuando el precio es texto y no un monto (se muestra en menor jerarquía). */
  priceIsText?: boolean;
  description: string;
}

export const SERVICES: Service[] = [
  {
    name: "Valoración inicial",
    price: "₡15.000",
    description: "Diagnóstico y plan de tratamiento, sin tecnicismos.",
  },
  {
    name: "Limpieza dental",
    price: "₡35.000",
    description: "Profilaxis y remoción de sarro.",
  },
  {
    name: "Blanqueamiento",
    pricePrefix: "desde",
    price: "₡120.000",
    description: "Aclaramiento gradual y controlado.",
  },
  {
    name: "Calzas (resina)",
    pricePrefix: "desde",
    price: "₡25.000",
    description: "Restauraciones del color natural del diente.",
  },
  {
    name: "Extracciones",
    pricePrefix: "desde",
    price: "₡30.000",
    description: "Extracción simple con anestesia local.",
  },
  {
    name: "Endodoncia",
    pricePrefix: "desde",
    price: "₡150.000",
    description: "Tratamiento de nervio.",
  },
  {
    name: "Ortodoncia",
    pricePrefix: "desde",
    price: "₡45.000/mes",
    description: "Brackets; la valoración inicial es gratuita.",
  },
  {
    name: "Prótesis y coronas",
    price: "según valoración",
    priceIsText: true,
    description: "Se cotiza en la valoración inicial, por escrito.",
  },
];

export const DIFFERENTIATORS = [
  {
    number: "01",
    title: "Atención sin dolor",
    body: "Le explicamos cada procedimiento antes de realizarlo y velamos por su comodidad en todo momento.",
  },
  {
    number: "02",
    title: "Presupuesto claro desde el inicio",
    body: "Recibe el costo de su tratamiento por escrito antes de comenzar, sin cargos inesperados.",
  },
  {
    number: "03",
    title: "Horarios convenientes",
    body: "Citas de lunes a viernes hasta las 6:00 p.m. y sábados por la mañana.",
  },
  {
    number: "04",
    title: "Respuesta a cualquier hora",
    body: "Nuestro asistente virtual le responde de inmediato, a cualquier hora, y puede agendar su cita en el momento.",
  },
] as const;

export interface TeamMember {
  name: string;
  role: string;
  bio: string;
  /**
   * Retrato generado con IA. La persona no existe: por eso las tarjetas del
   * equipo llevan la marca de imagen generada (ver components/Team.tsx).
   */
  photo: StaticImageData;
}

export const TEAM: TeamMember[] = [
  {
    name: "Dra. Mariana Solís",
    role: "Odontología general y estética · 15 años · COD 5471",
    bio: "Acompaña con especial cuidado a pacientes con ansiedad dental, explicando cada procedimiento con calma.",
    photo: marianaSolis,
  },
  {
    name: "Dr. Andrés Vargas",
    role: "Especialista en Endodoncia · COD 6083",
    bio: "Realiza tratamientos de nervio en una sola sesión cuando el caso lo permite.",
    photo: andresVargas,
  },
  {
    name: "Dra. Carolina Méndez",
    role: "Especialista en Ortodoncia · COD 6127",
    bio: "Tratamientos con brackets y alineadores, con controles mensuales incluidos.",
    photo: carolinaMendez,
  },
];

export const LUCIA_CAPABILITIES = [
  "Contesta al instante, a cualquier hora, todos los días.",
  "Agenda citas revisando el calendario real y detecta choques de horario.",
  "Registra cada lead con nombre y teléfono, sin perder consultas.",
  "Responde con la información del negocio, sin inventar datos.",
  "Le pasa el chat a una persona cuando el caso lo amerita.",
  "Funciona igual en WhatsApp y en el sitio web.",
] as const;

export const TESTIMONIALS = [
  {
    quote:
      "Escribí un sábado a las 10 de la noche preguntando por una limpieza y me contestaron al toque. Ya el lunes tenía la cita puesta.",
    author: "Paciente ficticia · Escazú",
  },
  {
    quote:
      "Le tenía pánico al dentista. Me explicaron cada paso antes de empezar y la verdad salí tranquilísima.",
    author: "Paciente ficticia · Escazú",
  },
  {
    quote: "Los precios me los dieron claritos desde el chat, sin sorpresas.",
    author: "Paciente ficticia · Escazú",
  },
] as const;

export const FAQS = [
  {
    question: "¿Atienden sin cita?",
    answer:
      "Atendemos con cita previa. En caso de emergencia dental, procuramos atenderle el mismo día según disponibilidad — escríbanos por el chat y Lucía consulta la agenda de inmediato.",
  },
  {
    question: "¿Cómo cancelo o cambio mi cita?",
    answer: "Por el chat o al 2288-4455, con al menos 24 horas de anticipación.",
  },
  {
    question: "¿Qué formas de pago aceptan?",
    answer: "SINPE Móvil, tarjeta (Visa y Mastercard) y efectivo.",
  },
  {
    question: "¿Qué necesito para agendar?",
    answer:
      "Únicamente su nombre completo y un número de teléfono. Lucía puede agendar su cita directamente desde el chat.",
  },
];

export interface NavLink {
  href: string;
  label: string;
  /** Lucía AI se resalta: es lo único real del sitio. */
  highlight?: boolean;
}

export const NAV_LINKS: NavLink[] = [
  { href: "#servicios", label: "Servicios y precios" },
  { href: "#equipo", label: "Equipo" },
  { href: "#lucia", label: "Lucía AI", highlight: true },
  { href: "#faq", label: "Preguntas" },
  { href: "#ubicacion", label: "Ubicación" },
];
