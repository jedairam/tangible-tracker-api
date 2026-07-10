# Tests — tangible-tracker-api

Suite de **tests unitarios** con Vitest. No requiere Firestore ni servidor HTTP levantado.

## Setup

```bash
cp .env.test.example .env.test   # solo la primera vez
yarn test
```

| Archivo | En git | Descripción |
| ------- | ------ | ----------- |
| `.env.test.example` | Sí | Plantilla con valores ficticios |
| `.env.test` | No | Copia local usada por Vitest |

Los valores de `.env.test` **no son credenciales reales**. Los repositories Firebase se mockean; ningún test abre conexión a Firestore.

## Comandos

```bash
yarn test           # ejecuta toda la suite (81 tests)
yarn test:watch     # modo watch
yarn test log       # filtrar por nombre de spec
```

## Estructura

```
test/
├── helpers/           # mocks Express, Firestore, factories, load-test-env
└── unit/
    ├── config/        # env, CORS
    ├── middlewares/   # validate, error, metrics, rate-limit
    ├── modules/
    │   ├── tasks/     # service, schema, task-code, firebase repository
    │   ├── users/     # service, schema, firebase repository
    │   └── logs/      # service, events, firebase repository
    └── shared/        # utils, errors, pagination schema
```

## Cobertura

| Capa | Archivos test |
|------|----------------|
| Services | task, user, log |
| Repositories (mock Firestore) | firebase-task, firebase-user, firebase-log |
| Schemas + env | task, user, pagination, env.schema |
| Middlewares | validate, error, metrics, rate-limit |
| Utils | response, date, pagination, task-code |
| Events | log.events, errors |

## Convenciones

- Variables de entorno: **`.env.test`** en la raíz del API (plantilla **`.env.test.example`**). Cargar con `loadTestEnv()` desde `test/helpers/load-test-env.ts` sin mutar `process.env`.
- Repositories Firebase se testean con **mocks de Firestore** (`test/helpers/mock-firestore.ts`), sin conexión real.
- Rutas Express (`*.routes.ts`) quedan fuera del scope unitario (serían integración con supertest).
- Gate antes de commit: `yarn test && yarn build`.
