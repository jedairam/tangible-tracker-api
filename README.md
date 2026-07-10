# Tangible Tracker API

API REST para la gestión interna de tareas, incidencias y **equipo de desarrollo**, con usuarios asignables e historial de actividad en tiempo real. Backend construido con **Node.js**, **Express 5**, **TypeScript** y **Firebase Firestore**.

**Base URL local:** `http://localhost:3000`

---

## Tabla de contenidos

- [Requisitos previos](#requisitos-previos)
- [Configuración de Firebase](#configuración-de-firebase)
- [Variables de entorno](#variables-de-entorno)
- [Instalación y ejecución](#instalación-y-ejecución)
- [Funcionalidades](#funcionalidades)
- [Arquitectura](#arquitectura)
- [Módulos](#módulos)
- [Referencia de endpoints](#referencia-de-endpoints)
- [Modelos de datos](#modelos-de-datos)
- [Errores de la API](#errores-de-la-api)
- [Logs automáticos y SSE](#logs-automáticos-y-sse)
- [Seguridad y configuración](#seguridad-y-configuración)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Scripts disponibles](#scripts-disponibles)
- [Testing](#testing)
- [Documentación OpenAPI y Postman](#documentación-openapi-y-postman)
- [Stack tecnológico](#stack-tecnológico)
- [Solución de problemas](#solución-de-problemas)

---

## Requisitos previos

- [Node.js](https://nodejs.org/) v18 o superior
- [Yarn](https://yarnpkg.com/)
- Proyecto en [Firebase Console](https://console.firebase.google.com/)
- **Firestore** habilitado en el proyecto

---

## Configuración de Firebase

1. Crea un proyecto en Firebase Console (ej. `tangible-tracker`).
2. Ve a **Firestore Database** → **Crear base de datos**.
3. Elige ubicación (ej. `us-central1`) y modo **producción**.
4. Ve a **Configuración del proyecto** → **Cuentas de servicio**.
5. En **SDK de Firebase Admin**, haz clic en **Generar nueva clave privada**.
6. Del JSON descargado, necesitarás estos tres campos:
   - `project_id`
   - `client_email`
   - `private_key`

### Índices de Firestore

El proyecto incluye `firestore.indexes.json` con índices explícitos en `createdAt` para `tasks`, `users` y `logs` (paginación ordenada).

Para desplegarlos (requiere [Firebase CLI](https://firebase.google.com/docs/cli)):

```bash
firebase deploy --only firestore:indexes
```

> Firestore también crea índices simples automáticamente; el archivo documenta y versiona la configuración explícita.

> El backend usa **Firebase Admin SDK**. No es necesario registrar una app web en Firebase para este setup.

---

## Variables de entorno

Copia el archivo de ejemplo y completa tus credenciales:

```bash
cp .env.example .env
```

Contenido de `.env`:

```env
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

FIREBASE_PROJECT_ID=tu-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tu-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Notas importantes

- **No subas** el archivo `.env` al repositorio (ya está en `.gitignore`).
- La `FIREBASE_PRIVATE_KEY` debe ir **entre comillas dobles** con los saltos de línea como `\n`.
- `CORS_ORIGIN` debe coincidir con la URL del frontend (`http://localhost:5173` por defecto).
- Si el puerto `3000` está ocupado, cambia `PORT` en tu `.env` (ej. `3001`).
- Las variables se validan al arranque con Zod (`src/config/env.schema.ts`).

### Variables para tests (`yarn test`)

Los tests unitarios usan **`.env.test`** con valores ficticios (no conectan a Firestore). Copia la plantilla:

```bash
cp .env.test.example .env.test
```

| Archivo | En git | Uso |
| ------- | ------ | --- |
| `.env.example` | Sí | Plantilla para desarrollo/producción local |
| `.env` | No (`.gitignore`) | Credenciales reales del servidor |
| `.env.test.example` | Sí | Plantilla para la suite Vitest |
| `.env.test` | No (`.gitignore`) | Valores de prueba locales |

---

## Instalación y ejecución

```bash
yarn install
cp .env.example .env          # credenciales Firebase (servidor)
cp .env.test.example .env.test  # variables ficticias (tests)
yarn dev
```

El servidor queda disponible en `http://localhost:3000`. En consola verás:

```text
Server running on http://localhost:3000
[METRIC] GET /api/tasks 42ms
```

### Build y producción

```bash
yarn build
yarn start
```

### Verificación rápida

```bash
curl http://localhost:3000/health
```

---

## Funcionalidades

| Feature | Descripción |
| ------- | ----------- |
| **CRUD de tareas** | Crear, listar, actualizar y eliminar tareas con validación Zod |
| **Código de tarea `TAN-N`** | Secuencia automática vía contador Firestore (`tasks/_counter`) |
| **Asignación de usuarios** | Campo `assignedUserId` con validación de existencia |
| **CRUD de usuarios** | Equipo sin autenticación; email único normalizado |
| **Activity log** | Historial automático en cada operación de tarea |
| **Tiempo real (SSE)** | `GET /api/logs/stream` emite nuevos logs al instante |
| **Paginación** | `page` + `limit` (máx. 100) en tasks, users y logs |
| **Envelope estándar** | `{ success, data, meta?, error? }` en todas las respuestas |
| **Health check** | `/health` con estado de Firestore |
| **Seguridad HTTP** | Helmet, CORS allowlist local, rate limit 100 req/s |

---

## Arquitectura

Arquitectura **modular por dominio**, con capas claras entre HTTP, lógica de negocio y persistencia.

### Principios

| Principio | Descripción |
| --------- | ----------- |
| **Modularidad** | Cada dominio vive en `modules/[feature]` con routes, service, repository y schemas |
| **Repository pattern** | `TaskRepository` / `UserRepository` / `LogRepository` desacoplan Firestore del servicio |
| **Validación en el borde** | Zod valida body y params antes de llegar al service (`validate.middleware`) |
| **Errores tipados** | `NotFoundError`, `ValidationError` → envelope HTTP consistente |
| **Eventos en memoria** | `log.events.ts` (EventEmitter) conecta logs con SSE sin acoplar módulos |
| **Config centralizada** | `config/` — env, Firebase, CORS |

### Flujo de una petición

```
HTTP Request
  → helmet / cors / morgan / metrics
  → rate-limit (/api/*)
  → routes + validateMiddleware (Zod)
  → service (lógica de negocio)
  → firebase-*-repository (Firestore)
  → response.utils (envelope)
  → error.middleware (si falla)
```

### Capas por módulo

```
*.routes.ts       → HTTP, wiring de dependencias
*.service.ts      → reglas de negocio, orquestación
*.repository.ts   → contrato (interface)
firebase-*.repository.ts → implementación Firestore
*.schema.ts       → validación Zod de entrada
*.model.ts / *.dto.ts → tipos de dominio
```

### Reglas de dependencias

```
modules/tasks  →  modules/logs, modules/users (logs + validar assignee)
modules/logs   →  shared, config
modules/users  →  shared, config
modules/health →  config (Firestore ping)
```

- Los services **no** importan Express ni Firestore directamente (solo su repository).
- `shared/` no importa de `modules/`.
- `config/` no importa de `modules/`.

---

## Módulos

### `modules/tasks`

Gestión de tareas con códigos secuenciales y logs automáticos.

| Recurso | Rol |
| ------- | --- |
| `task.routes.ts` | Endpoints REST `/api/tasks` |
| `task.service.ts` | CRUD + validación de assignee + registro de logs |
| `task.repository.ts` | Contrato de persistencia |
| `firebase-task.repository.ts` | Firestore + transacción `nextTaskCode()` |
| `task-code.utils.ts` | Generación `TAN-N` vía documento `_counter` |
| `task.schema.ts` | Zod: `createTaskSchema`, `updateTaskSchema`, `taskIdParamSchema` |
| `task.model.ts` | Tipos `Task`, enums `status` y `priority` |

**Flujo create:** validar assignee → generar `code` → persistir → `logService.create(TASK_CREATED)`.

---

### `modules/users`

Equipo de desarrollo asignable a tareas.

| Recurso | Rol |
| ------- | --- |
| `user.routes.ts` | Endpoints REST `/api/users` |
| `user.service.ts` | CRUD con verificación de existencia |
| `firebase-user.repository.ts` | Firestore + unicidad de email |
| `user.schema.ts` | Zod: `createUserSchema`, `updateUserSchema` |
| `user.model.ts` | Tipo `User` |

> Eliminar un usuario **no** genera logs. Las tareas con `assignedUserId` huérfano conservan el ID hasta editarse.

---

### `modules/logs`

Historial de actividad + stream en tiempo real.

| Recurso | Rol |
| ------- | --- |
| `log.routes.ts` | `GET /api/logs` y `GET /api/logs/stream` |
| `log.service.ts` | Listado paginado + creación + suscripción SSE |
| `firebase-log.repository.ts` | Persistencia en colección `logs` |
| `log.events.ts` | EventEmitter — emite `log:created` tras insertar |
| `log.model.ts` | Tipo `Log`, constantes `LOG_ACTIONS` |

**Flujo SSE:** `logService.create()` → Firestore → `emitLogCreated()` → clientes `EventSource` reciben el evento.

---

### `modules/health`

| Recurso | Rol |
| ------- | --- |
| `health.routes.ts` | `GET /health` — ping a Firestore, uptime, environment |

---

## Referencia de endpoints

Todas las respuestas JSON usan un **envelope estandarizado**:

```json
// Éxito — recurso o lista
{ "success": true, "data": { ... } }
{ "success": true, "data": [ ... ], "meta": { "total": 25, "page": 1, "limit": 20, "totalPages": 2, "hasNext": true, "hasPrev": false } }

// Éxito — eliminación
{ "success": true, "data": null, "message": "Tarea eliminada" }

// Error
{ "success": false, "error": { "statusCode": 404, "message": "Tarea no encontrada" } }
```

Los datos útiles están siempre en `data`. En el frontend: `const { data } = await response.json()`.

### Resumen

| Método | Ruta | Descripción |
| ------ | ---- | ----------- |
| `GET` | `/health` | Estado del servidor y Firestore |
| `POST` | `/api/tasks` | Crear tarea |
| `GET` | `/api/tasks` | Listar tareas (paginado) |
| `GET` | `/api/tasks/:id` | Obtener tarea por ID |
| `PATCH` | `/api/tasks/:id` | Actualizar tarea (parcial) |
| `DELETE` | `/api/tasks/:id` | Eliminar tarea |
| `POST` | `/api/users` | Crear usuario |
| `GET` | `/api/users` | Listar usuarios (paginado) |
| `GET` | `/api/users/:id` | Obtener usuario por ID |
| `PATCH` | `/api/users/:id` | Actualizar usuario (parcial) |
| `DELETE` | `/api/users/:id` | Eliminar usuario |
| `GET` | `/api/logs` | Listar historial de actividad |
| `GET` | `/api/logs/stream` | Stream SSE — logs en tiempo real |

### Paginación (tasks, users, logs)

| Param | Default | Máx | Descripción |
| ----- | ------- | --- | ----------- |
| `page` | `1` | — | Número de página |
| `limit` | `20` | `100` | Elementos por página |

```bash
curl "http://localhost:3000/api/tasks?page=1&limit=20"
```

---

### `GET /health`

```bash
curl http://localhost:3000/health
```

**Respuesta 200:**

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2026-07-09T06:13:48.247Z",
    "uptime": 57.5,
    "environment": "development",
    "database": "connected"
  }
}
```

**Respuesta 503:** `data.status: "degraded"`, `data.database: "disconnected"`.

---

### `POST /api/tasks`

Registra automáticamente un log `"Tarea creada"`.

```json
{
  "title": "Incidencia login",
  "description": "Error al iniciar sesión en producción",
  "status": "pending",
  "priority": "high",
  "assignedUserId": "USER_ID"
}
```

| Campo | Requerido | Default | Descripción |
| ----- | --------- | ------- | ----------- |
| `title` | Sí | — | Título |
| `description` | Sí | — | Descripción |
| `status` | No | `pending` | Ver estados |
| `priority` | No | `medium` | Ver prioridades |
| `assignedUserId` | No | `null` | ID de usuario existente |

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Incidencia login","description":"Error en producción","priority":"high"}'
```

**Respuesta 201:** incluye `id`, `code` (ej. `TAN-1`) y fechas ISO.

---

### `PATCH /api/tasks/:id`

Actualización parcial. Al menos un campo. Si cambia `status` → log `"Estado cambiado"`; en otros casos → `"Tarea actualizada"`.

```bash
curl -X PATCH http://localhost:3000/api/tasks/{id} \
  -H "Content-Type: application/json" \
  -d '{"status":"in_progress"}'
```

Para desasignar: `{"assignedUserId":null}`.

---

### `DELETE /api/tasks/:id`

Elimina la tarea y registra log `"Tarea eliminada"`.

```bash
curl -X DELETE http://localhost:3000/api/tasks/{id}
```

---

### `POST /api/users`

Sin password (sin autenticación). Email único.

```json
{ "firstName": "Juan", "lastName": "Pérez", "email": "juan@empresa.com" }
```

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Juan","lastName":"Pérez","email":"juan@empresa.com"}'
```

**Respuesta 400:** `El email ya está registrado`.

---

### `GET /api/logs`

```bash
curl "http://localhost:3000/api/logs?page=1&limit=20"
```

**Ejemplo de item:**

```json
{
  "id": "abc123",
  "taskId": "tjrcxKTo3Lc1C7JSarJd",
  "taskCode": "TAN-1",
  "action": "Tarea creada",
  "detail": "Tarea \"Incidencia login\" creada",
  "createdAt": "2026-07-09T06:13:48.502Z"
}
```

---

### `GET /api/logs/stream`

```bash
curl -N http://localhost:3000/api/logs/stream
```

**Formato de cada evento:**

```text
data: {"success":true,"data":{"id":"...","taskId":"...","taskCode":"TAN-1","action":"Tarea creada",...}}
```

> En Postman, SSE puede no mostrarse como en el navegador. Usa `curl -N` o `EventSource` en el frontend.

---

## Modelos de datos

### Task

| Campo | Tipo | Descripción |
| ----- | ---- | ----------- |
| `id` | string | ID del documento en Firestore |
| `code` | string | Código legible único (ej. `TAN-1`, `TAN-2`) |
| `title` | string | Título |
| `description` | string | Descripción |
| `status` | enum | `pending`, `in_progress`, `completed`, `cancelled` |
| `priority` | enum | `low`, `medium`, `high` |
| `assignedUserId` | string \| null | ID del usuario asignado |
| `createdAt` | datetime | Fecha de creación (ISO 8601) |
| `updatedAt` | datetime | Última actualización |

> El `code` se genera automáticamente al crear la tarea. El documento `tasks/_counter` en Firestore lleva la secuencia interna.

### User

| Campo | Tipo | Descripción |
| ----- | ---- | ----------- |
| `id` | string | ID del documento en Firestore |
| `firstName` | string | Nombre |
| `lastName` | string | Apellido |
| `email` | string | Email (minúsculas, único) |
| `createdAt` | datetime | Fecha de creación |
| `updatedAt` | datetime | Última actualización |

### Log

| Campo | Tipo | Descripción |
| ----- | ---- | ----------- |
| `id` | string | ID del log en Firestore |
| `taskId` | string | ID interno de la tarea |
| `taskCode` | string | Código legible (ej. `TAN-1`) |
| `action` | string | Tipo de acción (en español) |
| `detail` | string | Descripción legible del evento |
| `createdAt` | datetime | Fecha del evento |

---

## Errores de la API

```json
{
  "success": false,
  "error": {
    "statusCode": 404,
    "message": "Tarea no encontrada"
  }
}
```

| Código | Cuándo ocurre | Ejemplo de `error.message` |
| ------ | ------------- | -------------------------- |
| `400` | Validación fallida | `El título es obligatorio` |
| `400` | Email duplicado | `El email ya está registrado` |
| `400` | Usuario asignado inválido | `Usuario asignado no encontrado` |
| `404` | Tarea no encontrada | `Tarea no encontrada` |
| `404` | Usuario no encontrado | `Usuario no encontrado` |
| `429` | Rate limit excedido | Mensaje estándar del middleware |
| `500` | Error interno | `Error interno del servidor` |

---

## Logs automáticos y SSE

### Acciones registradas

| Operación | `action` | Ejemplo de `detail` |
| --------- | -------- | ------------------- |
| `POST /api/tasks` | Tarea creada | `Tarea "X" creada` |
| `PATCH` (cambia status) | Estado cambiado | `Estado cambiado de pendiente a en progreso` |
| `PATCH` (otros campos) | Tarea actualizada | `Tarea "X" actualizada` |
| `DELETE /api/tasks/:id` | Tarea eliminada | `Tarea "X" eliminada` |

### Integración frontend (referencia)

```javascript
// Carga inicial (paginada)
const { data: logs } = await fetch('http://localhost:3000/api/logs?page=1&limit=50').then((r) => r.json());

// Conexión en tiempo real
const source = new EventSource('http://localhost:3000/api/logs/stream');
source.onmessage = (event) => {
  const { data: newLog } = JSON.parse(event.data);
};
```

Flujo recomendado: `GET /api/logs` para historial + `EventSource` para nuevos eventos.

---

## Seguridad y configuración

Estrategia para la prueba: **proteger secretos y abuso de tráfico**, sin autenticación de usuarios (fuera del alcance del PDF).

### Secretos y Firebase

| Práctica | Implementación |
| -------- | -------------- |
| Credenciales fuera del repo | `.env` en `.gitignore`; plantilla en `.env.example` |
| Validación al arranque | `env.schema.ts` (Zod) |
| Firebase Admin solo en servidor | `firebase.ts` — la private key nunca llega al frontend |
| Errores sin filtración | `error.middleware.ts` — 500 genérico al cliente |

### CORS (solo frontend local)

El API acepta peticiones browser **únicamente** desde `CORS_ORIGIN` (default `http://localhost:5173`).

```env
CORS_ORIGIN=http://localhost:5173
```

### Rate limiting

- **100 peticiones/segundo por IP** en `/api/*` (`rate-limit.middleware.ts`).
- `/health` sin límite.
- Respuesta `429` con envelope estándar al superar el umbral.

### Validación y límites

- Zod en body/params de tasks y users.
- Paginación: `limit` máximo 100.
- Body JSON máximo **100 KB**.

### Autenticación

**No implementada** a propósito: CRUD interno de la prueba. En producción: JWT/API key + TLS en reverse proxy.

---

## Estructura del proyecto

```
src/
├── app.ts                            # Express app: middlewares + rutas
├── server.ts                         # Bootstrap HTTP
│
├── config/
│   ├── env.ts / env.schema.ts        # Variables validadas con Zod
│   ├── firebase.ts                   # Firebase Admin SDK
│   └── cors.ts                       # Allowlist local
│
├── middlewares/
│   ├── validate.middleware.ts        # Zod en body/params
│   ├── error.middleware.ts           # Envelope de errores
│   ├── metrics.middleware.ts         # [METRIC] por request
│   └── rate-limit.middleware.ts      # 100 req/s en /api/*
│
├── shared/
│   ├── errors/                       # NotFoundError, ValidationError
│   ├── schemas/pagination.schema.ts
│   ├── types/
│   └── utils/                        # response, date, pagination
│
├── modules/
│   ├── health/
│   │   └── health.routes.ts
│   ├── tasks/
│   │   ├── task.routes.ts
│   │   ├── task.service.ts
│   │   ├── task.repository.ts
│   │   ├── firebase-task.repository.ts
│   │   ├── task-code.utils.ts
│   │   ├── task.schema.ts
│   │   ├── task.model.ts
│   │   └── task.dto.ts
│   ├── users/
│   │   ├── user.routes.ts
│   │   ├── user.service.ts
│   │   ├── user.repository.ts
│   │   ├── firebase-user.repository.ts
│   │   ├── user.schema.ts
│   │   ├── user.model.ts
│   │   └── user.dto.ts
│   └── logs/
│       ├── log.routes.ts
│       ├── log.service.ts
│       ├── log.repository.ts
│       ├── firebase-log.repository.ts
│       ├── log.events.ts
│       ├── log.model.ts
│       └── log.dto.ts
│
test/                                 # Tests unitarios (Vitest)
├── helpers/                          # mocks Express, Firestore, factories
├── load/api-load.js                  # Script de carga (opcional)
└── unit/
    ├── config/                       # env, CORS
    ├── middlewares/                  # validate, error, metrics, rate-limit
    ├── modules/{tasks,users,logs}/    # service, schema, repository
    └── shared/                       # utils, errors, pagination schema

openapi.yaml                          # Especificación OpenAPI 3.0
firestore.indexes.json                # Índices Firestore versionados
.env.example                          # Plantilla variables de entorno (servidor)
.env.test.example                     # Plantilla variables de entorno (tests)
```

---

## Scripts disponibles

| Script | Descripción |
| ------ | ----------- |
| `yarn dev` | Servidor de desarrollo con recarga (`tsx watch`) |
| `yarn start:dev` | Alias de `yarn dev` |
| `yarn build` | Compila TypeScript (`tsconfig.build.json`) + alias paths |
| `yarn start` | Ejecuta `dist/server.js` (producción) |
| `yarn test` | Tests unitarios — corrida única (Vitest) |
| `yarn test:watch` | Tests unitarios — modo watch |

---

## Testing

Toda la suite vive en `test/`. Documentación detallada: [test/README.md](./test/README.md).

### Pirámide

```
        ┌─────────────┐
        │ Integración │  Fuera de scope (routes con supertest)
        ├─────────────┤
        │ Unit (81)   │  Vitest — services, repos mock, middlewares
        └─────────────┘
```

| Capa | Herramienta | Ubicación |
| ---- | ----------- | --------- |
| Unitarios | Vitest | `test/unit/` |

### Tests unitarios

No requieren Firestore ni servidor HTTP: los repositories Firebase se mockean.

**Setup (primera vez):**

```bash
cp .env.test.example .env.test
```

```bash
yarn test          # 81 tests — corrida única
yarn test:watch    # modo desarrollo
yarn test log      # filtrar por nombre de spec
```

**Módulos cubiertos:** `tasks`, `users`, `logs`, middlewares, config y shared utils.

**Convenciones:** factories en `test/helpers/factories/`, mocks Firestore en `test/helpers/mock-firestore.ts`, env de prueba en `.env.test` (desde `.env.test.example`) vía `loadTestEnv()`.

### Gate antes de commit

```bash
yarn test && yarn build
```

---

## Documentación OpenAPI y Postman

El archivo [`openapi.yaml`](openapi.yaml) describe **todos los endpoints**, schemas, ejemplos y respuestas de error.

### Importar en Postman

1. Abre **Postman** → **Import** → **File**
2. Selecciona `openapi.yaml` de este repositorio
3. Postman generará una colección con todos los endpoints

> Asegúrate de que el servidor esté corriendo (`yarn dev`) antes de enviar requests.

### Otras herramientas

| Herramienta | Uso |
| ----------- | --- |
| [Swagger Editor](https://editor.swagger.io) | Pegar el contenido de `openapi.yaml` para visualizar |
| `npx @redocly/cli preview-docs openapi.yaml` | Documentación HTML local |

---

## Stack tecnológico

| Categoría | Tecnología |
| --------- | ---------- |
| **Runtime** | Node.js |
| **Framework** | Express 5 |
| **Lenguaje** | TypeScript 7 |
| **Base de datos** | Firebase Firestore (Admin SDK) |
| **Validación** | Zod 4 |
| **Seguridad HTTP** | Helmet, CORS allowlist, express-rate-limit (100 req/s) |
| **Logging HTTP** | Morgan |
| **Métricas** | Middleware `[METRIC]` personalizado |
| **Tiempo real** | Server-Sent Events (SSE) |
| **Documentación** | OpenAPI 3.0 (`openapi.yaml`) |
| **Tests** | Vitest 3 |

---

## Solución de problemas

### `database: "disconnected"`

- Confirma que **Firestore está creado** en Firebase Console.
- Verifica que las credenciales en `.env` coinciden con el JSON de la cuenta de servicio.
- Espera 1–2 minutos si acabas de habilitar Firestore.

### Puerto en uso

```bash
lsof -i :3000
```

Cambia `PORT` en `.env` o detén el proceso que lo ocupa.

### Reiniciar datos de desarrollo (códigos `TAN-N` desde cero)

Borra desde **Firebase Console → Firestore** las colecciones `tasks`, `logs` y el documento `tasks/_counter`. Las nuevas tareas recibirán `TAN-1`, `TAN-2`, … en secuencia.

### CORS bloquea el frontend

- Verifica `CORS_ORIGIN=http://localhost:5173` en `.env` del API.
- Reinicia el API tras cambiar `.env`.
- Solo se permiten orígenes `localhost` o `127.0.0.1`.

### Error al validar variables de entorno

Revisa que `.env` tenga todos los campos requeridos definidos en `.env.example`.

### Tests fallan por variables de entorno

```bash
cp .env.test.example .env.test
yarn test
```

`env.schema.test.ts` carga `.env.test` con `loadTestEnv()`. Los valores son ficticios; no necesitas credenciales Firebase reales para los tests.

---

## Licencia

MIT
