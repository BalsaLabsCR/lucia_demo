# lucia_demo

Landing page de una clínica dental **ficticia** (Clínica Dental Sonrisa Pura), hecha para demostrar a **Lucía AI**: el chat de la esquina inferior derecha habla con el backend real, el mismo agente que atiende por WhatsApp.

Next.js 16 (App Router) + Tailwind 4. Todo el sitio es estático salvo el widget de chat y las páginas de `/lucia/*`.

## Este repo es solo el front

El backend de Lucía (`lucia-backend`) vive en un repositorio aparte y **privado**; acá no hay nada de él. Este repo es público y contiene únicamente el sitio demo: la fachada de la clínica, el widget de chat y el panel de operación.

Eso significa que, sin acceso al backend, el sitio corre igual pero el chat y las páginas de `/lucia/*` no van a responder. Todo lo que necesita del backend está detrás de una sola variable (`NEXT_PUBLIC_LUCIA_API_URL`), y el contrato está documentado abajo en [Qué espera del backend](#qué-espera-del-backend): cualquier servicio que exponga esos endpoints sirve.

## Que quede claro que es un demo

La ficción es solo la fachada, y se avisa en varios lugares a propósito:

- Banner fijo arriba de todo, pegado al header (`components/SiteHeader.tsx`).
- Sección **"Todo lo de arriba es una fachada. Lucía no."** (`components/LuciaPitch.tsx`).
- Aclaraciones en los bloques de precios, cifras, equipo y testimonios.
- Aviso legal en el footer + `robots: noindex`.
- Adentro del chat: aviso de que las respuestas las genera una IA y de no enviar datos personales reales.

## Correr en local

```bash
cp .env.example .env.local   # NEXT_PUBLIC_LUCIA_API_URL → URL del backend
npm install
npm run dev
```

El sitio queda en `http://localhost:3001` y espera el backend en `http://localhost:3000`.

Sin backend levantado la landing se ve completa; lo que falla es el chat (error al enviar) y `/lucia/*` (las páginas avisan que no pudieron contactar al backend).

Variables de entorno:

| Variable | Dónde se usa | Para qué |
|---|---|---|
| `NEXT_PUBLIC_LUCIA_API_URL` | navegador y servidor | URL base del backend |
| `LUCIA_ADMIN_API_KEY` | **solo servidor** | autentica las rutas `/admin/*`; sin ella `/lucia/*` responde 503 |

El backend tiene que permitir el origen del sitio en su configuración de CORS para el chat web:

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
| `app/lucia/knowledge/` | Configuración del conocimiento de Lucía (servicios, **promociones**, FAQ, horarios, personal, reglas, tono) |
| `app/lucia/chats/` | Bandeja de conversaciones: sección Urgente, filtros, respuesta manual y control IA/humano |
| `app/lucia/citas/` | Agenda de citas que dejó agendadas Lucía, con cancelación |
| `app/lucia/leads/` | Interesados, destacando a los que no llegaron a agendar |
| `app/lucia/marketing/` | Campañas: brief, propuestas creativas, guion, revisión del material y paquete de producción |
| `components/marketing/` | El taller de una campaña, paso por paso |
| `app/api/lucia/` | Proxies server-side al backend (`/admin/*`) con `LUCIA_ADMIN_API_KEY` |
| `lib/knowledge.ts`, `lib/chats.ts`, `lib/appointments.ts`, `lib/leads.ts`, `lib/marketing.ts` | Tipos espejo de los del backend (allá con zod) |
| `lib/luciaAdmin.ts` | Puente a `/admin/*`. **Solo para route handlers**: importarlo desde un componente cliente filtraría la API key |

## Qué espera del backend

Dos superficies distintas, y la diferencia importa: la pública la llama el navegador del visitante; la de admin **nunca** — esa la llama el servidor de Next, que es el único lugar donde vive `LUCIA_ADMIN_API_KEY`.

**Pública** (navegador → backend, sin autenticación):

| Endpoint | Para qué |
|---|---|
| `POST /chat` | Un turno del chat: `{ sessionId, message }` → `{ status, replies[], messageIds[] }` |
| `GET /chat/:sessionId/messages?after=` | Sondeo de mensajes nuevos → `{ state, messages[] }` |

`messageIds` son los ids de las respuestas de ese turno, ya guardadas, en el mismo orden que `replies`. Es la misma llave que trae el sondeo, y es lo que evita que el widget pinte dos veces la misma respuesta (ver abajo).

**Admin** (servidor de Next → backend, con header `x-admin-key`). Cada una tiene su proxy en `app/api/lucia/`:

| Endpoint | Para qué |
|---|---|
| `GET`/`PUT /admin/knowledge` | Leer y guardar el conocimiento del negocio |
| `GET /admin/chats` | Lista de conversaciones (filtros: `channel`, `q`, `state`, `limit`) |
| `GET /admin/chats/:id` | Conversación completa con sus mensajes |
| `POST /admin/chats/:id/reply` | Respuesta manual de una persona del equipo |
| `POST /admin/chats/:id/control` | Quitarle el control a Lucía o devolvérselo |
| `GET /admin/appointments` | Agenda (filtros: `channel`, `status`, `range`, `q`, `limit`) |
| `POST /admin/appointments/:id/cancel` | Cancelar una cita y liberar el espacio en el calendario |
| `GET /admin/leads` | Leads (filtros: `channel`, `type`, `q`, `sort`, `limit`) |
| `/admin/marketing/*` | Todo el plugin de marketing: campañas, conceptos, guion, material, aprobaciones, métricas. Un solo proxy atrapa-todo en `app/api/lucia/marketing/[...path]` |
| `…/assets/:id/content` | Los bytes de un archivo, detrás de `adminAuth`. El proxy los reenvía en binario y el navegador los pide como si fueran de este sitio: **no existe ninguna URL pública del material** |

La sección de Marketing es la única que **escribe** cosas que después se
publican, así que vale repetirlo: el navegador nunca habla con OpenAI ni con
ningún proveedor. Pide al proxy, el proxy al backend de la clínica, y el backend
—el único que tiene las llaves— al proveedor.

## Coherencia con el backend

`lib/clinic.ts` **tiene que coincidir** con el conocimiento de Lucía, que se edita en `/lucia/knowledge`: precios, horarios, dirección y políticas. Si se cambian de un lado y no del otro, el sitio va a decir una cosa y Lucía otra en el chat.

## Cómo funciona el chat

1. El widget genera un `sessionId` (uuid) y lo guarda en `sessionStorage` — equivale al número de teléfono en el canal de WhatsApp. Al cerrar la pestaña empieza una conversación nueva.
2. Cada mensaje va a `POST /chat` con ese `sessionId`.
3. El backend corre el mismo pipeline que WhatsApp (agente con herramientas: RAG, Calendar, Sheets, handoff; más la verificación de la respuesta) y devuelve lo que contesta en la misma petición.
4. Si el backend responde `handoff` o `silent`, el widget avisa que una persona va a contestar.
5. Mientras el chat está abierto, el widget sondea `GET /chat/:sessionId/messages` cada 5 s. Sin eso el visitante nunca vería lo que le responde una persona desde `/lucia/chats`: su turno HTTP ya terminó.

### Por qué el sondeo no repite lo que ya se mostró

El backend **guarda** la respuesta en la base antes de **devolverla**. En ese hueco de milisegundos la respuesta ya es visible para el sondeo, pero el widget todavía no la recibió por el POST — y si un sondeo cae ahí, la pinta dos veces.

Lo que lo evita es que las dos vías comparten llave: `POST /chat` devuelve los `messageIds` de sus respuestas y el widget los marca como vistos, así que cuando el sondeo las traiga las descarta por id. El sondeo *va* a traerlas, porque su marca de tiempo sigue siendo anterior al turno, y eso es a propósito: adelantar esa marca hasta el cierre del turno se saltaría lo que se haya guardado entre medio (por ejemplo la respuesta de una persona escrita mientras Lucía procesaba), y eso se perdería para siempre. La marca solo avanza hasta lo que el sondeo efectivamente trajo.

Mientras un turno está en vuelo el sondeo se queda quieto: esas respuestas llegan por el POST.
