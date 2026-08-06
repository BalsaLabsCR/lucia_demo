# lucia_demo

Landing page de una clínica dental **ficticia** (Clínica Dental Sonrisa Pura), hecha para demostrar a **Lucía AI**: el chat de la esquina inferior derecha habla con el backend real ([`../lucia-backend`](../lucia-backend)), el mismo agente que atiende por WhatsApp.

Next.js 16 (App Router) + Tailwind 4. Todo el sitio es estático salvo el widget de chat.

## Que quede claro que es un demo

La ficción es solo la fachada, y se avisa en varios lugares a propósito:

- Banner negro fijo arriba de todo (`components/DemoBanner.tsx`).
- Sección **"Todo lo de arriba es una fachada. Lucía no."** (`components/LuciaPitch.tsx`).
- Aclaraciones en los bloques de precios, cifras, equipo y testimonios.
- Aviso legal en el footer + `robots: noindex`.
- Adentro del chat: aviso de que las respuestas las genera una IA y de no enviar datos personales reales.

## Correr en local

Necesita el backend levantado (ver el README de `lucia-backend`).

```bash
cp .env.example .env.local   # NEXT_PUBLIC_LUCIA_API_URL → URL del backend
npm install
npm run dev
```

- Backend: `http://localhost:3000`
- Este sitio: `http://localhost:3001`

En el backend hay que permitir el origen del sitio:

```bash
WEB_CHAT_ALLOWED_ORIGINS="http://localhost:3001"
```

(`*` es el default y sirve para desarrollo; en producción conviene fijar el dominio.)

## Estructura

| Archivo | Qué es |
|---|---|
| `lib/clinic.ts` | Datos de la clínica ficticia: servicios, precios, horarios, equipo, FAQs |
| `lib/luciaApi.ts` | Cliente de `POST /chat` + id de sesión en `sessionStorage` |
| `lib/chatEvents.ts` | Evento con el que cualquier botón del sitio abre el widget |
| `components/chat/` | Widget flotante (`ChatWidget`) y panel de conversación (`ChatPanel`) |
| `components/*.tsx` | Secciones de la landing |
| `app/lucia/knowledge/` | Página de configuración del conocimiento de Lucía (servicios, FAQ, horarios, personal, reglas, tono) |
| `app/lucia/chats/` | Bandeja de conversaciones: sección Urgente, filtros, respuesta manual y control IA/humano |
| `app/api/lucia/` | Proxies server-side al backend (`/admin/*`) con `LUCIA_ADMIN_API_KEY` |
| `lib/knowledge.ts`, `lib/chats.ts` | Tipos espejo de `lucia-backend/src/knowledge/` y `src/admin/` |
| `lib/luciaAdmin.ts` | Puente a `/admin/*`. **Solo para route handlers**: importarlo desde un componente cliente filtraría la API key |

## Coherencia con el backend

`lib/clinic.ts` **tiene que coincidir** con el conocimiento de Lucía, que se
edita en `/lucia/knowledge` (defaults en `lucia-backend/src/knowledge/defaults.ts`):
precios, horarios, dirección y políticas. Si se cambian de un lado y no del otro,
el sitio va a decir una cosa y Lucía otra en el chat.

## Cómo funciona el chat

1. El widget genera un `sessionId` (uuid) y lo guarda en `sessionStorage` — equivale al número de teléfono en el canal de WhatsApp. Al cerrar la pestaña empieza una conversación nueva.
2. Cada mensaje va a `POST /chat` con ese `sessionId`.
3. El backend corre el mismo pipeline de WhatsApp (clasificación, RAG, Calendar, Sheets) y devuelve las respuestas en la misma petición.
4. Si el backend responde `handoff` o `silent`, el widget avisa que una persona va a contestar.
5. Mientras el chat está abierto, el widget sondea `GET /chat/:sessionId/messages` cada 5 s. Sin eso el visitante nunca vería lo que le responde una persona desde `/lucia/chats`: su turno HTTP ya terminó. El punto de partida del sondeo es el `serverTime` que devuelve `POST /chat`, para no repetir las respuestas del mismo turno.
