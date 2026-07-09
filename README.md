# Tangible Tracker API

API REST para la gestión interna de tareas del equipo de desarrollo. Backend construido con **Node.js**, **Express**, **TypeScript** y **Firebase Firestore**.

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

---

## Verificar conexión

### Health check

```bash
curl http://localhost:3000/health
```

Respuesta esperada cuando todo está conectado:

```json
{
  "status": "ok",
  "timestamp": "2026-07-09T04:32:03.441Z",
  "uptime": 12.5,
  "environment": "development",
  "database": "connected"
}
```


| Campo                      | Significado                                     |
| -------------------------- | ----------------------------------------------- |
| `status: "ok"`             | Servidor y Firestore operativos                 |
| `database: "connected"`    | Conexión a Firestore exitosa                    |
| `database: "disconnected"` | Revisa credenciales o que Firestore esté creado |


---

## Endpoints disponibles


| Método | Ruta      | Descripción                                |
| ------ | --------- | ------------------------------------------ |
| `GET`  | `/health` | Estado del servidor y conexión a Firestore |


> Los endpoints de tareas (`/api/tasks`) se implementarán en siguientes fases del proyecto.

---

## Estructura del proyecto

```text
src/
├── app.ts                 # Configuración de Express
├── server.ts              # Punto de entrada
├── config/
│   ├── env.ts             # Variables de entorno (Zod)
│   ├── firebase.ts        # Conexión a Firestore
│   └── cors.ts            # Configuración CORS
└── modules/
    └── health/
        └── health.routes.ts
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

- Node.js + Express
- TypeScript
- Firebase Admin SDK (Firestore)
- Zod (validación de variables de entorno)
- Helmet, CORS, Morgan

---

## Licencia

MIT
