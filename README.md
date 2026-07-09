# Tangible Tracker API

API REST para la gestión interna de tareas e incidencias del equipo de desarrollo. Backend construido con **Node.js**, **Express**, **TypeScript** y **Firebase Firestore**.

**Base URL local:** `http://localhost:3000`

---

## Tabla de contenidos

- [Requisitos previos](#requisitos-previos)
- [Configuración de Firebase](#configuración-de-firebase)
- [Variables de entorno](#variables-de-entorno)
- [Instalación y ejecución](#instalación)
- [Documentación OpenAPI y Postman](#documentación-openapi-y-postman)
- [Endpoints](#endpoints)
- [Modelos de datos](#modelos-de-datos)
- [Errores de la API](#errores-de-la-api)
- [Logs automáticos](#logs-automáticos)
- [Tiempo real (SSE)](#tiempo-real-sse)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Solución de problemas](#solución-de-problemas)
- [Stack tecnológico](#stack-tecnológico)

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

FIREBASE_PROJECT_ID=tu-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tu-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```



### Notas importantes

- **No subas** el archivo `.env` al repositorio (ya está en `.gitignore`).
- La `FIREBASE_PRIVATE_KEY` debe ir **entre comillas dobles** con los saltos de línea como `\n`.
- Si el puerto `3000` está ocupado, cambia `PORT` en tu `.env` (ej. `3001`).

---

## Instalación

```bash
yarn install
```

---

## Levantar el servidor

### Desarrollo (con recarga automática)

```bash
yarn dev
```

Alias equivalente:

```bash
yarn start:dev
```

Al arrancar verás:

```text
Server running on http://localhost:3000
```

En consola también verás métricas por request:

```text
[METRIC] GET /api/tasks 42ms
```

---

## Documentación OpenAPI y Postman

El archivo [`openapi.yaml`](openapi.yaml) en la raíz del proyecto describe **todos los endpoints**, schemas, ejemplos y respuestas de error.

### Importar en Postman

Sí, puedes importarlo directamente:

1. Abre **Postman**
2. **Import** → pestaña **File**
3. Selecciona `openapi.yaml` de este repositorio
4. Postman generará una colección con todos los endpoints listos para probar

También puedes arrastrar el archivo a la ventana de Postman.

> Asegúrate de que el servidor esté corriendo (`yarn dev`) antes de enviar requests.

### Otras herramientas

| Herramienta | Uso |
| ----------- | --- |
| [Swagger Editor](https://editor.swagger.io) | Pegar el contenido de `openapi.yaml` para visualizar |
| `npx @redocly/cli preview-docs openapi.yaml` | Documentación HTML local |

---

## Endpoints

Todas las respuestas JSON usan un **envelope estandarizado**:

```json
// Éxito — recurso o lista
{ "success": true, "data": { ... } }
{ "success": true, "data": [ ... ], "meta": { "total": 5 } }

// Éxito — eliminación
{ "success": true, "data": null, "message": "Tarea eliminada" }

// Error
{ "success": false, "error": { "statusCode": 404, "message": "Tarea no encontrada" } }
```

Los datos útiles están siempre en `data`. En el frontend: `const { data } = await response.json()`.

Resumen de todos los endpoints disponibles:

| Método   | Ruta               | Descripción                         |
| -------- | ------------------ | ----------------------------------- |
| `GET`    | `/health`          | Estado del servidor y Firestore     |
| `POST`   | `/api/tasks`       | Crear tarea                         |
| `GET`    | `/api/tasks`       | Listar todas las tareas             |
| `GET`    | `/api/tasks/:id`   | Obtener tarea por ID                |
| `PATCH`  | `/api/tasks/:id`   | Actualizar tarea (parcial)          |
| `DELETE` | `/api/tasks/:id`   | Eliminar tarea                      |
| `GET`    | `/api/logs`        | Listar historial de actividad       |
| `GET`    | `/api/logs/stream` | Stream SSE — logs en tiempo real    |

---

### `GET /health`

Verifica que el servidor y Firestore estén operativos.

```bash
curl http://localhost:3000/health
```

**Respuesta 200** (todo OK):

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

**Respuesta 503** (Firestore desconectado): mismo envelope con `data.status: "degraded"` y `data.database: "disconnected"`.

| Campo         | Valores                      | Significado                   |
| ------------- | ---------------------------- | ----------------------------- |
| `data.status` | `ok`, `degraded`             | Estado general del servicio   |
| `data.database` | `connected`, `disconnected` | Conexión a Firestore        |
| `uptime`      | número (segundos)            | Tiempo activo del proceso     |
| `environment` | `development`, `production`| Entorno configurado en `.env` |

---

### `POST /api/tasks`

Crea una nueva tarea. Registra automáticamente un log `"Tarea creada"`.

**Body (JSON):**

```json
{
  "title": "Incidencia login",
  "description": "Error al iniciar sesión en producción",
  "status": "pending",
  "priority": "high"
}
```

| Campo         | Requerido | Default   | Descripción |
| ------------- | --------- | --------- | ----------- |
| `title`       | Sí        | —         | Título      |
| `description` | Sí        | —         | Descripción |
| `status`      | No        | `pending` | Ver estados |
| `priority`    | No        | `medium`  | Ver prioridades |

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Incidencia login","description":"Error en producción","status":"pending","priority":"high"}'
```

**Respuesta 201:** `{ "success": true, "data": { ...Task } }` con `id`, fechas y campos enviados.

---

### `GET /api/tasks`

Lista todas las tareas, ordenadas por `createdAt` descendente.

```bash
curl http://localhost:3000/api/tasks
```

**Respuesta 200:** `{ "success": true, "data": [ ...Task ], "meta": { "total": N } }`.

---

### `GET /api/tasks/:id`

Obtiene una tarea por su ID de Firestore.

```bash
curl http://localhost:3000/api/tasks/{id}
```

| Respuesta | Descripción |
| --------- | ----------- |
| `200`     | `{ "success": true, "data": { ...Task } }` |
| `404`     | `{ "success": false, "error": { "statusCode": 404, "message": "Tarea no encontrada" } }` |

---

### `PATCH /api/tasks/:id`

Actualización **parcial**. Debes enviar al menos un campo.

```bash
curl -X PATCH http://localhost:3000/api/tasks/{id} \
  -H "Content-Type: application/json" \
  -d '{"status":"in_progress"}'
```

| Respuesta | Descripción |
| --------- | ----------- |
| `200`     | Tarea actualizada |
| `400`     | Body vacío o inválido |
| `404`     | Tarea no encontrada |

Si cambia `status`, el log es `"Estado cambiado"`. En otros casos, `"Tarea actualizada"`.

---

### `DELETE /api/tasks/:id`

Elimina la tarea y registra un log `"Tarea eliminada"`.

```bash
curl -X DELETE http://localhost:3000/api/tasks/{id}
```

| Respuesta | Descripción |
| --------- | ----------- |
| `200`     | `{ "success": true, "data": null, "message": "Tarea eliminada" }` |
| `404`     | Tarea no encontrada |

---

### `GET /api/logs`

Historial de actividad de todas las operaciones sobre tareas.

```bash
curl http://localhost:3000/api/logs
```

**Respuesta 200:**

```json
{
  "success": true,
  "data": [
    {
      "id": "abc123",
      "taskId": "tjrcxKTo3Lc1C7JSarJd",
      "action": "Tarea creada",
      "detail": "Tarea \"Incidencia login\" creada",
      "createdAt": "2026-07-09T06:13:48.502Z"
    }
  ],
  "meta": { "total": 1 }
}
```

Valores posibles de `action`: `Tarea creada`, `Tarea actualizada`, `Tarea eliminada`, `Estado cambiado`.

---

### `GET /api/logs/stream`

Stream **Server-Sent Events (SSE)**. Recibe cada nuevo log en tiempo real.

```bash
curl -N http://localhost:3000/api/logs/stream
```

**Formato de cada evento:**

```text
data: {"success":true,"data":{"id":"...","taskId":"...","action":"Tarea creada","detail":"...","createdAt":"..."}}
```

> En Postman, SSE puede no mostrarse como en el navegador. Usa `curl -N` o `EventSource` en el frontend.

---

## Modelos de datos

### Task

| Campo         | Tipo     | Descripción                   |
| ------------- | -------- | ----------------------------- |
| `id`          | string   | ID del documento en Firestore |
| `title`       | string   | Título                        |
| `description` | string   | Descripción                   |
| `status`      | enum     | Estado de la tarea            |
| `priority`    | enum     | Prioridad                     |
| `createdAt`   | datetime | Fecha de creación (ISO 8601)  |
| `updatedAt`   | datetime | Última actualización          |

**Estados (`status`):** `pending`, `in_progress`, `completed`, `cancelled`

**Prioridades (`priority`):** `low`, `medium`, `high`

### Log

| Campo       | Tipo     | Descripción                    |
| ----------- | -------- | ------------------------------ |
| `id`        | string   | ID del log en Firestore        |
| `taskId`    | string   | ID de la tarea relacionada     |
| `action`    | string   | Tipo de acción (en español)    |
| `detail`    | string   | Descripción legible del evento |
| `createdAt` | datetime | Fecha del evento               |

---

## Errores de la API

Todas las respuestas de error siguen el mismo formato:

```json
{
  "success": false,
  "error": {
    "statusCode": 404,
    "message": "Tarea no encontrada"
  }
}
```

| Código | Cuándo ocurre           | Ejemplo de `error.message`   |
| ------ | ----------------------- | ---------------------------- |
| `400`  | Validación fallida      | `El título es obligatorio`   |
| `404`  | Tarea no encontrada     | `Tarea no encontrada`        |
| `500`  | Error interno           | `Error interno del servidor` |

---

## Logs automáticos

| Operación               | `action`          | Ejemplo de `detail`                          |
| ----------------------- | ----------------- | -------------------------------------------- |
| `POST /api/tasks`       | Tarea creada      | `Tarea "X" creada`                           |
| `PATCH` (cambia status) | Estado cambiado   | `Estado cambiado de pendiente a en progreso` |
| `PATCH` (otros campos)  | Tarea actualizada | `Tarea "X" actualizada`                      |
| `DELETE /api/tasks/:id` | Tarea eliminada   | `Tarea "X" eliminada`                        |

---

## Tiempo real (SSE)

Para el panel de actividad en React:

```javascript
// Carga inicial
const { data: logs } = await fetch('http://localhost:3000/api/logs').then((r) => r.json());

// Conexión en tiempo real
const source = new EventSource('http://localhost:3000/api/logs/stream');

source.onmessage = (event) => {
  const { data: newLog } = JSON.parse(event.data);
  // Agregar al panel de actividad
};
```

Flujo recomendado: `GET /api/logs` para historial + `EventSource` para nuevos eventos.

---


```text
src/
├── app.ts
├── server.ts
├── config/
│   ├── env.ts
│   ├── env.schema.ts
│   ├── firebase.ts
│   └── cors.ts
├── middlewares/
│   ├── error.middleware.ts
│   ├── metrics.middleware.ts
│   └── validate.middleware.ts
├── shared/
│   ├── errors/
│   └── utils/
├── modules/
│   ├── health/
│   │   └── health.routes.ts
│   ├── tasks/
│   │   ├── task.routes.ts
│   │   ├── task.service.ts
│   │   ├── task.repository.ts
│   │   ├── firebase-task.repository.ts
│   │   ├── task.schema.ts
│   │   ├── task.model.ts
│   │   └── task.dto.ts
│   └── logs/
│       ├── log.routes.ts
│       ├── log.service.ts
│       ├── log.repository.ts
│       ├── firebase-log.repository.ts
│       ├── log.events.ts
│       ├── log.model.ts
│       └── log.dto.ts
```

---

## Solución de problemas

### `database: "disconnected"`

- Confirma que **Firestore está creado** en Firebase Console.
- Verifica que las credenciales en `.env` coinciden con el JSON de la cuenta de servicio.
- Espera 1–2 minutos si acabas de habilitar Firestore.

### Puerto en uso

```bash
# Ver qué proceso usa el puerto 3000
lsof -i :3000
```

Cambia `PORT` en `.env` o detén el proceso que lo ocupa.

### Error al validar variables de entorno

Si el servidor no arranca, revisa que `.env` tenga todos los campos requeridos definidos en `.env.example`.

---

## Stack tecnológico

| Capa           | Tecnología                          |
| -------------- | ----------------------------------- |
| Runtime        | Node.js                             |
| Framework      | Express 5                           |
| Lenguaje       | TypeScript                          |
| Base de datos  | Firebase Firestore (Admin SDK)      |
| Validación     | Zod                                 |
| Seguridad HTTP | Helmet, CORS                        |
| Logging HTTP   | Morgan                              |
| Métricas       | Middleware personalizado `[METRIC]` |
| Tiempo real    | Server-Sent Events (SSE)            |
| Documentación  | OpenAPI 3.0 (`openapi.yaml`)        |

---

## Licencia

MIT
