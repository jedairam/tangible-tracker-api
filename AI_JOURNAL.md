# AI Journal — Tangible Tracker API

---

## 1. Herramientas y Enfoque

### Asistentes de IA utilizados


| Herramienta            | Objetivo general                                                                                                                                                                                                                                   |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cursor IDE (Agent)** | Herramienta principal. Módulos Express (`tasks`, `logs`, `users`), repositories Firestore, middlewares, OpenAPI, suite Vitest (81 tests), README, seguridad HTTP y verificación con `yarn test`, `yarn build` y curls contra `/health` y `/api/`*. |
| **ChatGPT**            | Consultas puntuales: reglas de índices Firestore, envelope de respuestas REST y convenciones de nombres en APIs Node.                                                                                                                              |
| **Claude**             | Segunda opinión en capas del backend (routes → service → repository) y redacción de documentación técnica.                                                                                                                                         |


No se usó Copilot de forma relevante. Cursor Agent tuvo acceso al repositorio completo y validó los cambios contra la toolchain real del proyecto.

### Cómo estructuré los prompts

Los prompts siguieron un patrón repetible en lugar de pedir “toda la API de una vez”:

1. **Contexto + restricción de capa** — indicar módulo, carpeta y regla de dependencias (*“cada dominio en* `modules/[nombre]` *con routes, service, repository, schema;* `shared/` *sin imports de* `modules/`”*).
2. **Una responsabilidad por iteración** — infraestructura (`config/`, middlewares), luego dominio (`tasks/`, `logs/`), luego extensión (`users/`, assignee), seguridad, tests y docs.
3. **Convenciones explícitas** — envelope `{ success, data, meta? }`, Zod en el borde HTTP, Firestore solo en `firebase-*.repository.ts`.
4. **Verificación obligatoria** — cerrar cada iteración con *“corre* `yarn test` *y* `yarn build` *antes de dar por hecho”* o curls a endpoints reales.
5. **Diff mínimo** — *“match convenciones existentes, no over-engineer”* cuando la IA proponía auth JWT, capas extra o helpers de una línea.


| Fase           | Prompt (como lo escribí al asistente)                                                                                                                                                                                                                                                                                           | Resultado esperado         |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| **Setup**      | *"Necesito un backend Node con Express 5 y TypeScript. Configura Firebase Admin para Firestore, variables de entorno validadas con Zod, envelope estándar de respuestas y estructura modular en* `src/modules`*. Deja* `.env.example` *y un* `GET /health` *que verifique Firestore. Sin autenticación de usuarios por ahora."* | Base del API               |
| **Tasks**      | *"Implementa el módulo* `tasks/` *con CRUD completo: routes, service, repository interface, implementación Firestore, schemas Zod y DTOs. Las listas deben paginarse por* `createdAt` *descendente. Cada operación de escritura debe registrar un log de actividad vía el servicio de logs."*                                   | Dominio principal del PDF  |
| **Logs + SSE** | *"Crea* `logs/` *con listado paginado y stream SSE en* `/api/logs/stream`*. Al crear un log en Firestore, emite un evento en memoria (*`log.events.ts`*) para que los clientes conectados reciban el payload sin polling. No acoples Express al EventEmitter desde los repositories."*                                          | Historial + tiempo real    |
| **Task code**  | *"Añade códigos legibles* `TAN-N` *con un contador en* `tasks/_counter` *y transacción Firestore. Persiste* `taskCode` *en cada log al crearlo. Documenta en README cómo resetear datos de desarrollo."*                                                                                                                        | Identificadores de negocio |
| **Users**      | *"Extiende el API con* `users/` *— CRUD paginado, email único normalizado, sin password. Luego añade* `assignedUserId` *opcional en tareas y valida que el usuario exista antes de crear o actualizar. El service de tasks puede depender del de users; users no debe depender de tasks."*                                      | Equipo + asignación        |
| **Security**   | *"Endurece el API para entrega local: CORS allowlist solo* `localhost`*, rate limit de 100 req/s en* `/api/`**, body JSON máximo 100 KB, Helmet ya activo. No implementes JWT — está fuera del alcance de la prueba. Documenta en README."*                                                                                     | Protección sin auth        |
| **Tests**      | *"Agrega tests unitarios con Vitest en* `test/unit/`*, mocks de Firestore sin conexión real, factories en* `test/helpers/`*, y* `tsconfig.test.json` *separado del build de producción. Cubre services, repositories mock, middlewares, env y schemas. Objetivo: suite verde con* `yarn test` *sin levantar servidor."*         | 81 tests unitarios         |
| **Tests (env)** | *"No hardcodees variables de entorno en los specs. Crea* `.env.test` *con valores ficticios, un helper* `loadTestEnv()` *que las importe con dotenv sin mutar* `process.env`*, y plantilla* `.env.test.example` *para quien clone el repo."*                                                                                  | Secretos fuera del código  |
| **Docs**       | *"Reescribe el README principal al estilo del frontend: arquitectura, módulos, scripts, testing, endpoints resumidos y referencia a* `openapi.yaml`*. Añade* `.env.test.example` *para la plantilla de Vitest."*                                                                                                                | Documentación de entrega   |


**Anti-patrones evitados:** prompts vagos sin archivos concretos, un solo commit monolítico, pedir auth completa cuando el PDF pide CRUD interno, o tests E2E con Firestore real en CI sin credenciales.

---

## 2. Análisis de Errores / Alucinaciones

Documento **seis casos** donde el código generado por la IA tuvo fallas de lógica, arquitectura, seguridad o suposiciones incorrectas.

### Caso A — Códigos `TAN-N`: fallbacks legacy en runtime (lógica)

**Contexto:** Tras implementar el contador `tasks/_counter`, algunos documentos viejos en Firestore no tenían campo `code` o `taskCode`.

**Lo que propuso la IA:**

- `legacyTaskCodeFromId(id)` — hash del ID de Firestore → pseudo-código `TAN-1xx`.
- `resolveTaskCode(id, code?)` — devolver `code` guardado o calcular fallback.
- Uso de `resolveTaskCode` en `firebase-task.repository.ts` **y** `firebase-log.repository.ts`.

**Por qué falla:**

- **Oculta datos corruptos:** la API devolvía códigos “válidos” aunque Firestore no los tuviera persistidos.
- **Dos fuentes de verdad:** el contador secuencial y el hash por ID no coincidían nunca.
- **Logs incoherentes:** un log podía mostrar un `taskCode` distinto al de la tarea real.

Fragmento de la propuesta rechazada:

```typescript
// task-code.utils.ts — propuesta IA (eliminada)
export function resolveTaskCode(id: string, code?: string): string {
  return code ?? legacyTaskCodeFromId(id)
}
```

**Tipo de error:** alucinación de compatibilidad — la IA asumió que “siempre hay que tolerar datos viejos” en lugar de exigir persistencia y documentar reset de Firestore en desarrollo.

---

### Caso B — Logs: Zod y DTOs donde no corresponde (arquitectura)

**Contexto:** `tasks/` y `users/` ya seguían el contrato acordado: `*.schema.ts` + `validateMiddleware` en routes para entradas HTTP, `*.dto.ts` para el service y `*.model.ts` para la entidad persistida. Los logs **no se crean por REST** — los escribe `TaskService` tras cada operación de tarea.

**Lo que propuso la IA** al extender logs con `taskCode` o al “completar” el módulo:

- Crear `log.schema.ts` con `createLogSchema` / `logQuerySchema` y reutilizar el mismo patrón que en tasks.
- Añadir `POST /api/logs` con `validateMiddleware(createLogSchema)` “por simetría con el resto de módulos”.
- Duplicar tipos: `CreateLogInput` vía `z.infer` en schema **y** `CreateLogDto` en `log.dto.ts`, a veces con campos distintos (`taskCode` opcional en un sitio, obligatorio en otro).
- Validar `action` con `z.enum(LOG_ACTIONS)` en el borde HTTP, aunque el único productor de logs es el service de tareas.

**Por qué falla:**


| Problema                             | Detalle                                                                                                                         |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| **Capa HTTP incorrecta**             | Los logs son **auditoría interna**; un `POST` público permite insertar eventos falsos y rompe el modelo de trazabilidad.        |
| **Schemas sin consumidor**           | `log.schema.ts` en routes que solo exponen `GET /logs` y `GET /logs/stream` — archivo muerto o validación que nunca se ejecuta. |
| **DTO vs schema duplicados**         | Tres definiciones del mismo contrato (`model`, `dto`, `z.infer`) desincronizadas cuando cambia `taskCode`.                      |
| **Rompe la arquitectura ya formada** | Zod en **entradas externas**; logs usan `CreateLogDto` tipado en TypeScript dentro del service.                                 |


Fragmento de la propuesta rechazada:

```typescript
// log.routes.ts — propuesta IA (no aplicada)
logRoutes.post('/logs', validateMiddleware(createLogSchema), async (req, res) => {
  const log = await logService.create(req.body as CreateLogInput)
  sendSuccess(res, log, 201)
})

// log.schema.ts — duplicaba CreateLogDto con taskCode opcional
export const createLogSchema = z.object({
  taskId: z.string().min(1),
  taskCode: z.string().optional(),
  action: z.enum(LOG_ACTIONS),
  detail: z.string().min(1),
})
```

**Tipo de error:** copia ciega del patrón tasks/users — la IA asumió que “todo módulo lleva schema Zod en routes” sin distinguir **recurso expuesto** vs **servicio interno de auditoría**.

---

### Caso C — Tasks: lógica duplicada ignorando `shared/` (arquitectura)

**Contexto:** Con la arquitectura ya definida, `shared/` ya exponía `paginateByCreatedAt`, `toDate`, `parsePaginationQuery`, `sendSuccess` / `sendPaginatedList` y errores tipados. La IA implementó tasks como si el módulo fuera autocontenido.

**Lo que propuso la IA** al desarrollar `modules/tasks/`:

- `paginateTasks()` propio en `firebase-task.repository.ts` (en vez de `paginateByCreatedAt`).
- Conversión de fechas inline con `instanceof Timestamp` (en vez de `toDate`).
- Envelope JSON manual en `task.routes.ts` con `res.json(...)` (en vez de `sendSuccess` / `sendPaginatedList`).
- Parseo ad hoc de `page` / `limit` (en vez de `parsePaginationQuery`).
- Helpers redundantes en `task.service.ts` (`ensureTaskExists()`, etc.) que solo envolvían `NotFoundError` ya estandarizado en `shared/errors/`.

**Por qué falla:**


| Problema                          | Detalle                                                                                             |
| --------------------------------- | --------------------------------------------------------------------------------------------------- |
| **Tres copias de paginación**     | El mismo bloque Firestore apareció en tasks, logs y users hasta unificarlo.                         |
| **Reglas de capa rotas**          | Routes con envelope propio; repositories con utilidades de fecha locales — `shared/` queda muerto.  |
| **Más superficie de bugs**        | `offset` o `meta.hasNext` distintos entre módulos en iteraciones intermedias.                       |
| **Ignora convenciones del Setup** | El prompt inicial ya fijó `shared/` para lo genérico; la IA añadió funciones locales por comodidad. |


Fragmento de la propuesta rechazada:

```typescript
// firebase-task.repository.ts — propuesta IA (eliminada)
private async paginateTasks(page: number, limit: number) {
  const offset = (page - 1) * limit
  const snapshot = await this.collection
    .orderBy('createdAt', 'desc')
    .offset(offset)
    .limit(limit + 1)
    .get()
}
```

**Tipo de error:** entrega por módulo sin mirar el repo — código “autocontenido” en tasks en lugar de **componer** utilidades `shared/` ya existentes.

---

### Caso D — Schemas mezclados en `config/` (arquitectura)

**Contexto:** Tras el Setup, la convención quedó clara: `config/` solo para **arranque** (env, Firebase, CORS); validación HTTP de dominio en `modules/*/*.schema.ts`; validación **transversal** de queries en `shared/schemas/`. La IA tendió a centralizar todo Zod en `config/`.

**Lo que propuso la IA:**

- Un único `config/schemas.ts` (o ampliar `env.schema.ts`) con `envSchema` **y** `paginationQuerySchema` **y** a veces fragmentos de `createTaskSchema` “para reutilizar”.
- `parsePaginationQuery` vivía en `config/` o en cada `*.routes.ts`, en lugar de `shared/schemas/pagination.schema.ts`.
- Reglas de `CORS_ORIGIN` duplicadas: refine en Zod **y** lógica aparte en `cors.ts`, sin separar responsabilidades (validar env al boot vs decidir origen por request).
- Importar schemas de tasks desde `config/` en routes, rompiendo la regla `config → no importa modules`.

**Por qué falla:**


| Problema                                      | Detalle                                                                                                                            |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `**config/` se convierte en cajón de sastre** | Mezcla variables de proceso, queries HTTP y contratos de dominio — difícil de testear y de navegar.                                |
| **Dependencias invertidas**                   | Si `config/schemas.ts` exporta validación de tasks, `config` depende de dominio o duplica tipos.                                   |
| **Paginación no es “config”**                 | `page` / `limit` son entrada HTTP compartida por tasks, users y logs; pertenecen a `shared/schemas/`.                              |
| **Rompe el contrato por capa**                | `env.ts` debe fallar al boot; `parsePaginationQuery` debe fallar por request con `ValidationError` — son ciclos de vida distintos. |


Fragmento de la propuesta rechazada:

```typescript
// config/schemas.ts — propuesta IA (no aplicada)
export const envSchema = z.object({ PORT: z.coerce.number(), /* ... */ })

export const paginationQuerySchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().max(100).default(20),
})

// task.routes.ts importaba desde config en vez de modules/tasks
import { createTaskSchema } from '@/config/schemas.js'
```

**Tipo de error:** centralización prematura — la IA agrupó “todo lo que usa Zod” en `config/` en lugar de respetar **qué valida cada capa**.

---

### Caso E — Logs: un solo servicio con demasiadas responsabilidades (arquitectura)

**Contexto:** `modules/tasks/` ya estaba armado con el patrón acordado: `routes` delgadas → `service` (reglas de negocio) → `repository` (contrato) → `firebase-*.repository` (Firestore) + `model` / `dto` / `schema`. Al pedir logs + SSE, la IA no replicó esa estructura.

**Lo que propuso la IA** en la primera iteración de `logs/`:

- Un único `log.service.ts` que importaba `getFirestore()`, hacía `collection.add`, mapeaba documentos, calculaba paginación y configuraba headers SSE (`res.setHeader`, `res.write`) en el mismo archivo.
- `log.routes.ts` con lógica de stream inline o delegando todo a un “god service” sin `LogRepository`.
- `EventEmitter` global definido dentro del service o en `app.ts`, acoplado a Express.
- Sin `log.dto.ts` / `log.model.ts` separados — tipos inline en el servicio.

**Por qué falla:**


| Problema                      | Detalle                                                                                                               |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Rompe paridad con tasks**   | Quien lee un módulo no encuentra la misma forma mental; logs parece “especial” sin razón de dominio.                  |
| **Imposible de testear**      | Mockear Firestore y SSE requiere montar un service monolítico; con repository + `log.events.ts` se prueba cada pieza. |
| **Mezcla capas**              | Persistencia + transporte HTTP (SSE) + emisión de eventos en una clase — violación de responsabilidad única.          |
| **Ignora el prompt de Setup** | Ya existía el patrón; la IA trató SSE como excusa para saltarse capas.                                                |


Fragmento de la propuesta rechazada:

```typescript
// log.service.ts — propuesta IA (monolito)
export class LogService {
  private collection = getFirestore().collection('logs')

  async findAll(page: number, limit: number) {
    const snapshot = await this.collection.orderBy('createdAt', 'desc').get()
    // ... paginación manual, docToLog inline
  }

  async create(data: CreateLogDto) {
    const ref = await this.collection.add({ ...data, createdAt: FieldValue.serverTimestamp() })
    const log = /* map doc */
    logEvents.emit('log:created', log)
    return log
  }

  streamToClient(res: Response) {
    res.setHeader('Content-Type', 'text/event-stream')
    logEvents.on('log:created', (log) => res.write(`data: ${JSON.stringify(log)}\n\n`))
  }
}
```

**Tipo de error:** módulo “rápido” sin mirar tasks — la IA priorizó que funcionara el SSE en un solo archivo en lugar de **seguir el mismo patrón de diseño** ya validado.

---

### Caso F — Tests: variables de entorno hardcodeadas en el spec (seguridad)

**Contexto:** Al añadir cobertura de `env.schema.ts`, el test debía validar que Zod parsea correctamente `PORT`, `CORS_ORIGIN` y las tres variables de Firebase. La convención del proyecto ya exigía secretos en `.env` (gitignored) y plantilla en `.env.example` — nunca en código fuente.

**Lo que propuso la IA** en `test/unit/config/env.schema.test.ts`:

- Objeto `validEnv` **inline en el archivo de test** con `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` y un bloque `FIREBASE_PRIVATE_KEY` completo (formato PEM) escrito como string literal.
- A veces `dotenv.config({ path: '.env.test' })` en `vitest.config.ts` o en `test/setup.ts`, **mutando** `process.env` global para toda la suite.
- Duplicar el mismo PEM ficticio en varios `it()` en lugar de una sola fuente de verdad.

**Por qué falla:**


| Problema | Detalle |
| -------- | ------- |
| **Superficie de fuga de secretos** | Un PEM en TypeScript parece “solo test”, pero es el mismo formato que credenciales reales; un reemplazo accidental por valores de desarrollo puede commitearse sin notarlo en un diff ruidoso. |
| **Inconsistencia con el proyecto** | El API ya separa config en `.env` + `env.schema.ts`; hardcodear en tests rompe la regla “secretos fuera del repo”. |
| **`process.env` global contaminado** | Cargar dotenv en setup global hace que otros tests dependan del orden de ejecución o hereden variables que no declararon. |
| **Mantenimiento frágil** | Si `env.schema.ts` añade un campo obligatorio, hay que buscar strings PEM repartidos en specs en lugar de actualizar un solo `.env.test`. |


Fragmento de la propuesta rechazada:

```typescript
// env.schema.test.ts — propuesta IA (eliminada)
const validEnv = {
  PORT: '3000',
  NODE_ENV: 'development',
  CORS_ORIGIN: 'http://localhost:5173',
  FIREBASE_PROJECT_ID: 'tangible-tracker-test',
  FIREBASE_CLIENT_EMAIL: 'firebase-adminsdk@test.iam.gserviceaccount.com',
  FIREBASE_PRIVATE_KEY:
    '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n',
}

it('parsea variables válidas', () => {
  const result = envSchema.parse(validEnv)
  expect(result.FIREBASE_PRIVATE_KEY).toContain('\n')
})
```

**Tipo de error:** atajo de testing — la IA priorizó “que el test compile rápido” en lugar de **tratar las variables de entorno como configuración externa**, igual que en runtime.

---

## 3. Resolución Técnica

Para cada falla: **cómo la detecté** y **qué ajusté manualmente**.

### Caso A — Códigos `TAN-N` sin fallbacks


| Detección                                                                                                                                                                         | Ajuste manual                                                                                                                                                                                                                                                                                                  |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Revisión de `task-code.utils.ts` y repos: los fallbacks enmascaraban documentos sin `code` en Firestore. Los curls mostraban códigos secuenciales correctos solo en datos nuevos. | Eliminé `legacyTaskCodeFromId` y `resolveTaskCode`. `docToTask` y `docToLog` leen `code` / `taskCode` directamente. `CreateLogDto.taskCode` pasó de opcional a **obligatorio**. Exporté `TASK_COUNTER_DOC_ID` y documenté en README el borrado de `tasks`, `logs` y `tasks/_counter` para reset de desarrollo. |


Lógica final en el repository de logs:

```typescript
// firebase-log.repository.ts — sin resolveTaskCode
taskCode: data.taskCode as string,
```

**Prompt de corrección (paráfrasis):** *“No generes códigos desde el ID. Si falta* `code` *en Firestore es data legacy — bórrala en consola, no la simules en runtime.”*

---

### Caso B — Logs sin schema HTTP: un solo `CreateLogDto`


| Detección                                                                                                               | Ajuste manual                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Borrador de `POST /logs`, `log.schema.ts` y tipos duplicados con `taskCode` opcional en Zod pero obligatorio en el DTO. | Mantuve logs como **solo lectura** en HTTP: `GET /logs` + `GET /logs/stream`. Sin `log.schema.ts` ni `POST /api/logs`. Un solo contrato de escritura: `CreateLogDto` en `log.dto.ts`, llamado desde `TaskService` con `taskCode` ya resuelto desde `task.code`. |


Contrato final (solo vía service):

```typescript
// log.dto.ts
export interface CreateLogDto {
  taskId: string
  taskCode: string
  action: string
  detail: string
}

// task.service.ts — único productor
await this.logService.create({
  taskId: task.id,
  taskCode: task.code,
  action: LOG_ACTIONS.TASK_CREATED,
  detail: `Tarea "${task.title}" creada`,
})
```

**Prompt de corrección (paráfrasis):** *“No copies el patrón schema de tasks en logs. Los logs no tienen POST público: valida en tasks/users y pasa un* `CreateLogDto` *desde el service.”*

---

### Caso C — Tasks reutilizando `shared/` en lugar de duplicar


| Detección                                                                                                           | Ajuste manual                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mismo bloque de paginación copy-paste entre repositories. Routes con `res.json` manual e inconsistencias en `meta`. | Extraje paginación a `shared/utils/pagination.utils.ts` (`paginateByCreatedAt`) — la usan tasks, users y logs. `docToTask` usa `toDate`. `task.routes.ts` delega en `parsePaginationQuery`, `sendSuccess` y `sendPaginatedList`. Eliminé helpers privados redundantes; `TaskService` solo conserva dominio (`assertAssignedUserExists`, textos de log con `TASK_STATUS_LABELS`). |


Patrón final:

```typescript
// firebase-task.repository.ts
async findAll(pagination: PaginationQuery) {
  return paginateByCreatedAt(this.collection, docToTask, pagination)
}

// task.routes.ts
const result = await taskService.findAll(parsePaginationQuery(req.query))
sendPaginatedList(res, result)
```

**Prompt de corrección (paráfrasis):** *“Antes de añadir funciones en* `modules/tasks`*, busca en* `shared/utils` *y* `shared/schemas`*. Reutiliza paginación, fechas y envelope.”*

---

### Caso D — Separar schemas: `config/` vs `shared/` vs `modules/`


| Detección                                                                                                                                              | Ajuste manual                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Al revisar imports vi `config/` acercándose a un monolito de Zod y routes mezclando parseo inline de query. Tests de paginación no tenían sitio claro. | Separé en tres niveles: `**config/env.schema.ts**` solo variables de entorno (parse en `env.ts` al arrancar); `**shared/schemas/pagination.schema.ts**` con `paginationQuerySchema` + `parsePaginationQuery` para tasks, users y logs; `**modules/tasks/task.schema.ts**` y `**modules/users/user.schema.ts**` para body/params de dominio. `cors.ts` consume `env.CORS_ORIGIN` ya validado — sin segundo schema de CORS en routes. `validate.middleware.ts` recibe el schema como argumento, sin registry en config. |


Estructura final:

```
config/
  env.schema.ts     → solo process.env (boot)
  env.ts            → safeParse + exit si falla
  cors.ts           → usa env.CORS_ORIGIN

shared/schemas/
  pagination.schema.ts → page/limit compartidos

modules/tasks/
  task.schema.ts    → createTaskSchema, updateTaskSchema, taskIdParamSchema

modules/users/
  user.schema.ts    → createUserSchema, updateUserSchema, userIdParamSchema
```

Uso en routes (composición, no config):

```typescript
// task.routes.ts
import { parsePaginationQuery } from '@/shared/schemas/pagination.schema.js'
import { createTaskSchema } from './task.schema.js'

taskRoutes.get('/tasks', async (req, res) => {
  const result = await taskService.findAll(parsePaginationQuery(req.query))
  sendPaginatedList(res, result)
})

taskRoutes.post('/tasks', validateMiddleware(createTaskSchema), handler)
```

**Prompt de corrección (paráfrasis):** *“`config/` solo para env y infra. Paginación en* `shared/schemas`*. Schemas de tasks/users en su módulo. No metas dominio en* `config/schemas.ts`.”*

---

### Caso E — Logs alineado al patrón de tasks


| Detección                                                                                                                                                                                     | Ajuste manual                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Comparé `log.service.ts` generado con `task.service.ts`: el de logs importaba Firestore y manejaba SSE como si fuera un controller. Reindiqué explícitamente: *“misma estructura que tasks”*. | Extraje `**log.repository.ts*`* + `**firebase-log.repository.ts**` (persistencia y `paginateByCreatedAt`). `**log.events.ts**` con `EventEmitter` y `emitLogCreated` — desacoplado de Express. `**log.service.ts**` quedó en orquestación: `findAll`, `create` (+ emit), `subscribe` (solo cableado SSE sobre eventos). `**log.routes.ts**` delgado: parseo de query, `sendPaginatedList`, delegación al service. Tipos en `**log.model.ts**` y `**log.dto.ts**`. |


Estructura final (espejo de tasks):

```
modules/logs/
  log.routes.ts              → HTTP delgado (GET list + GET stream)
  log.service.ts             → orquestación; sin getFirestore()
  log.repository.ts          → contrato
  firebase-log.repository.ts → Firestore + docToLog
  log.events.ts              → EventEmitter (log:created)
  log.model.ts / log.dto.ts
```

`LogService.create` — solo orquesta persistencia + evento:

```typescript
async create(data: CreateLogDto): Promise<Log> {
  const log = await this.logRepository.create(data)
  emitLogCreated(log)
  return log
}
```

**Prompt de corrección (paráfrasis):** *“`logs/` debe tener la misma forma que* `tasks/`*: routes, service, repository, firebase repository, model, dto. SSE vía* `log.events.ts`*, no Firestore dentro del service.”*

---

### Caso F — `.env.test` + `loadTestEnv()` en lugar de strings en el spec


| Detección | Ajuste manual |
| --------- | ------------- |
| Revisión de `env.schema.test.ts`: el PEM y el email de Firebase vivían como literales en el spec. Indiqué explícitamente: *“no hardcodees las variables; crea* `.env.test` *e impórtalas desde ahí”*. | Creé **`.env.test.example`** (plantilla en git) y **`.env.test`** (copia local con valores ficticios). Añadí **`test/helpers/load-test-env.ts`**, que lee `.env.test` con `dotenv` y `processEnv: {}` para **no mutar** `process.env`. El spec usa `const validEnv = loadTestEnv()` y solo muta campos en casos negativos (`CORS` inválido, falta `FIREBASE_PROJECT_ID`). Documenté en `test/README.md` y en el README principal el flujo `cp .env.test.example .env.test`. |


Helper final:

```typescript
// test/helpers/load-test-env.ts
export function loadTestEnv(): Record<string, string> {
  const { parsed, error } = config({
    path: path.join(rootDir, '.env.test'),
    processEnv: {}, // no contamina process.env global
  })
  if (error) throw error
  if (!parsed) throw new Error('No se pudo leer .env.test')
  return parsed as Record<string, string>
}
```

Uso en el test:

```typescript
// env.schema.test.ts
import { loadTestEnv } from '../../helpers/load-test-env.js'

const validEnv = loadTestEnv()

it('parsea variables válidas desde .env.test', () => {
  const result = envSchema.parse(validEnv)
  expect(result.FIREBASE_PROJECT_ID).toBe(validEnv.FIREBASE_PROJECT_ID)
})
```

**Prompt de corrección (texto del desarrollador):** *“No para las .env en* `env.schema.test.ts` *— crea un* `.env.test` *e importa desde ahí; no hardcodees las variables en código.”*

---

### Correcciones adicionales hechas manualmente (sin depender ciegamente de la IA)

- **Wiring de dependencias** — `TaskService` recibe `UserService` solo para validar assignee; evité imports circulares entre routes exportando singletons con cuidado.
- **Tests y factories** — unifiqué tests bajo `test/unit/modules/` y `makeLog()` con `taskCode` obligatorio cuando el linter lo exigió.
- **OpenAPI + README** — la IA generó endpoints correctos pero README desalineado con el frontend; reescritura manual con secciones Arquitectura, Módulos, Testing y tabla de scripts.
- **Verificación de endpoints** — batería de curls contra `localhost:3000` (health, CRUD, logs, SSE, 404/400) antes de dar por cerrada la entrega.
- **Índices Firestore** — `firestore.indexes.json` con `fieldOverrides` en `createdAt`; documenté que índices simples suelen crearse solos y cuándo usar `firebase deploy --only firestore:indexes`.

### Criterio aplicado

La IA aceleró el scaffold, los repositories Firestore y el volumen de tests, pero falló de forma sistemática en **compatibilidad inventada** (códigos legacy), **copiar el patrón Zod/POST de tasks en logs**, **duplicar utilidades** en `shared/`, **concentrar schemas en** `config/`, **monolitizar** `logs/` **sin seguir el patrón routes → service → repository** ya fijado en tasks, y **embeber secretos ficticios en specs** en lugar de cargarlos desde `.env.test`. Cada entrega pasó por `yarn test && yarn build`, revisión de capas por módulo y, cuando aplicaba, curls contra el servidor real antes de aceptar el diff.

---

