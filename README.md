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
| `app/lucia/copiloto/` | **Copiloto de Negocio**: métricas, alertas, recomendaciones con evidencia, aprobación y directivas |
| `components/copilot/` | El centro de decisión: resumen, alertas, tarjetas de recomendación, directivas y selector de escenarios |
| `app/lucia/negocio/` | **Sala de Operación**: seis agentes por área, con impacto económico de la IA y consulta a los documentos. Es una MAQUETA — ver abajo |
| `components/negocio/`, `lib/negocio/datos.ts` | La maqueta entera. Todo sale de `datos.ts`, escrito a mano; lo único que consulta de verdad es la pestaña de Documentos |
| `app/api/lucia/` | Proxies server-side al backend (`/admin/*`) con `LUCIA_ADMIN_API_KEY` |
| `lib/knowledge.ts`, `lib/chats.ts`, `lib/appointments.ts`, `lib/leads.ts`, `lib/marketing.ts`, `lib/copilot.ts` | Tipos espejo de los del backend (allá con zod) |
| `scripts/check-copilot.tsx` | Batería del panel del copiloto: renderiza los componentes a HTML y revisa lo que sale. `npm run check:copilot` |
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
| `/admin/business/*` | Todo el copiloto: resumen, análisis, métricas, señales, recomendaciones, aprobación, ejecución de acciones, directivas y escenarios. Un solo proxy atrapa-todo en `app/api/lucia/copilot/[...path]` |
| `GET /admin/documents` | Catálogo de los documentos ingeridos, con cuántos fragmentos tiene cada uno |
| `POST /admin/documents/ask` | Una pregunta contra los documentos: búsqueda semántica + respuesta con citas. Es lo único de `/lucia/negocio` que consulta de verdad |

La sección de Marketing es la única que **escribe** cosas que después se
publican, así que vale repetirlo: el navegador nunca habla con OpenAI ni con
ningún proveedor. Pide al proxy, el proxy al backend de la clínica, y el backend
—el único que tiene las llaves— al proveedor.

## La Sala de Operación

`/lucia/negocio` es una **maqueta**, y conviene tenerlo claro antes de leer una
línea de su código: seis pestañas —Dirección, Ventas, Operación, Planilla,
Mercado, Documentos— con seis agentes que vigilan un área cada uno. Existe para
una charla: muestra cómo se vería un negocio operado con IA como capa central,
no un producto terminado.

Tiene **dos temas y ningún acento de color**: la jerarquía la lleva el contraste
contra el fondo. `sala-tx` es lo que pide atención —la tinta más oscura en
claro, el blanco puro en oscuro—, `tx2` es el cuerpo y `tx3` el detalle técnico.
Los componentes no saben en qué tema están: piden "lo que más contrasta" y el
tema decide qué es, así que la pantalla se invierte entera cambiando diez
variables. Lo único que se pinta al revés —fondo sólido, letra del color del
fondo— es el chip de un hallazgo urgente, y por eso se reserva para eso.

**El claro es el default, y es el que hay que usar en un proyector.** Un
proyector no proyecta negro: proyecta ausencia de luz, así que en una sala con
las luces prendidas el "negro" es el gris de la pantalla iluminada por el
ambiente y el contraste se desploma — lo primero que se pierde son los rótulos
en mono de 10px y los bordes al 20% de opacidad, que es medio panel. Con fondo
claro pasa al revés: el aparato tira luz a máxima potencia y le gana al
ambiente. El oscuro se queda para una sala a oscuras, donde sí se ve mejor.

Se cambia con la tecla **`t`**, con el botón del encabezado, o con `?tema=oscuro`
en la URL — igual que `?tab=`, para poder dejar el enlace preparado.

Todo sale de `lib/negocio/datos.ts`, un archivo escrito a mano. No corre ningún
agente, no se llama a ningún modelo, no se consulta ninguna base — y por eso la
pantalla funciona con el backend caído, que en una charla es media garantía.

**La única excepción es la pestaña de Documentos**, que sí consulta de verdad:
los PDFs de la clínica están ingeridos con embeddings y la pregunta se resuelve
con búsqueda semántica contra `/admin/documents/*`. Es la única con caja de
texto, y es a propósito: un panel donde todo se pregunta es un chatbot con
pestañas.

### Dos capas, y el corte se anuncia

Cada pestaña está partida en dos, con un separador rotulado en el medio:

- **Arriba, el tablero.** KPIs con su línea de doce meses, series de tiempo,
  columnas, un mapa de calor de la agenda, tablas. Es lo que un negocio ya tiene
  —o querría tener— en su Power BI.
- **Abajo, la lectura.** Los hallazgos del agente del área, con su prosa, lo que
  descartó, la evidencia y la traza; y las propuestas con aprobar → ejecutar.

Esa división es el argumento entero: sin la primera mitad la segunda parece
magia, y con ella parece el paso siguiente. Las gráficas están dibujadas a mano
en SVG (`components/negocio/Graficas.tsx`) porque son cuatro formas, usan la
paleta de la Sala y se invierten enteras con el tema — una librería traería cien
opciones para usar dos.

### Tres cosas que hace a propósito

- **Los números cierran entre pestañas, y también en el tiempo.** Las cifras
  base se declaran una vez en `datos.ts` y el resto se deriva: los siete
  servicios suman el ingreso del mes, el uso de agenda sale de dividir citas
  entre cupos, y **el último valor de cada serie mensual es la cifra del mes que
  muestra el panel**. Que Planilla diga 57% y Operación 64% es la única forma
  realista de que esto se caiga en vivo.
- **El gráfico de 14 meses incluye el agosto anterior a propósito.** Muestra que
  agosto siempre es bajo — alguien lo va a decir en voz alta — y ahí es cuando
  el hallazgo contesta que este bajó 19,4% contra el 7,7% del año pasado, y que
  se cayó un solo servicio. El tablero solo llevaba a la conclusión equivocada.
- **Nada persiste.** Aprobar y ejecutar viven en `useState`: recargar deja la
  maqueta lista para la charla siguiente, sin botón de reinicio.

Los documentos y su ingesta viven en el repo del backend
(`docs/fuente/*.txt` → `npm run docs:pdf` → `npm run ingest`).

## El Copiloto de Negocio

`/lucia/copiloto` es un centro de decisión, no otro chat: no hay una caja de
texto para preguntarle nada al modelo. La pantalla está ordenada como se toma
una decisión — cómo viene el negocio, qué se detectó, qué conviene hacer, y qué
quedó aplicando Lucía.

Tres cosas que la sección hace a propósito:

- **Aprobar y ejecutar son dos pasos.** Aprobar una recomendación no crea nada;
  después se elige qué acciones ejecutar, cada una con su botón y con una línea
  que dice qué va a pasar si se aprieta.
- **Los supuestos y los límites se muestran ANTES de los botones**, no en un pie
  de página. Son justamente lo que hay que haber leído antes de aprobar.
- **Cada número dice de dónde salió.** Quien mira el panel tiene que poder
  preguntar "¿de dónde sacaste eso?" y encontrar la respuesta en la tarjeta.

### Modo presentación

El botón de arriba a la derecha agranda la tipografía y esconde el detalle
técnico —fuentes de los datos, marcas de tiempo, explicaciones de cada acción—
para proyectar. Lo que **no** esconde nunca es el aviso de datos simulados ni el
estado de cada recomendación.

### Escenarios

El selector reemplaza los datos de demostración **en el backend**. Cada tarjeta
explica qué situación simula, y activar pide confirmación diciendo exactamente
qué se borra y qué no. Si el backend tiene la demo apagada, la sección lo dice y
explica el motivo en vez de esconder el botón.

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
