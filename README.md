# Animal Road Safety API — structured Express project

This project refactors the supplied single-file `server.js` into controllers, models, routes, middleware, utilities, configuration, and services while preserving the API endpoints and SQLite/Socket.IO behavior.

## Folder structure

```text
animal-road-safety-api/
├── config/
│   └── env.js
├── controllers/
│   ├── alertController.js
│   ├── healthController.js
│   ├── poleController.js
│   └── realtimeController.js
├── db/
│   └── database.js
├── middleware/
│   └── auth.js
├── models/
│   ├── alertModel.js
│   └── poleModel.js
├── routes/
│   ├── alertRoutes.js
│   ├── driverRoutes.js
│   ├── healthRoutes.js
│   └── poleRoutes.js
├── services/
│   └── realtimeService.js
├── utils/
│   ├── alertUtils.js
│   ├── poleUtils.js
│   └── validation.js
├── .env.example
├── .gitignore
├── app.js
├── package.json
└── server.js
```

## Setup

Requires a supported Node.js version and a working native build/runtime for `better-sqlite3`.

1. Extract this project into a folder.
2. Open a terminal in the project folder.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Copy `.env.example` to `.env` and set strong secret values:

   ```env
   PORT=3000
   HOST=0.0.0.0
   DEVICE_API_KEY=replace_with_a_long_random_device_key
   ADMIN_KEY=replace_with_a_long_random_admin_key
   CORS_ORIGIN=*
   DB_PATH=alerts.sqlite
   ```

   Do not use the example/default secrets in production. If your dashboard needs to call the API from a browser, set `CORS_ORIGIN` to its actual origin instead of `*`.

5. Start the server:

   ```bash
   npm start
   ```

6. Confirm the health route:

   ```bash
   curl http://localhost:3000/api/health
   ```

## Test creating an alert

The device endpoint requires the `X-Device-Key` header. Replace the placeholder below with the exact `DEVICE_API_KEY` value in your `.env`.

```bash
curl -X POST http://localhost:3000/api/alerts \
  -H "Content-Type: application/json" \
  -H "X-Device-Key: replace_with_your_actual_device_key" \
  -d "{\"poleId\":\"POLE_DEMO\",\"animalId\":1,\"level\":\"ANIMAL_ON_ROAD_EMERGENCY\",\"lat\":22.0797,\"lng\":82.1409}"
```

A successful first insert returns HTTP `201` with `{"status":"received","alert":...}`. The original example request without `X-Device-Key` will return `401 unauthorized_device`.

## Routes

| Method | Path | Purpose | Authentication |
|---|---|---|---|
| GET | `/api/health` | Health check | None |
| POST | `/api/alerts` | Create alert | `X-Device-Key` |
| GET | `/api/alerts` | List/filter alerts | None |
| GET | `/api/alerts/stats` | Alert statistics | None |
| POST | `/api/alerts/:id/ack` | Acknowledge one alert | `X-Admin-Key` |
| POST | `/api/alerts/ack-all` | Acknowledge alerts | `X-Admin-Key` |
| GET | `/api/poles` | List poles | None |
| POST | `/api/poles/status` | Report pole status | `X-Device-Key` |
| POST | `/api/check-danger` | Find nearby recent emergencies | None |

## Important migration note

Back up any existing `alerts.sqlite` file before running this refactor against it. The database module retains the original migration logic, but test the migration on a copy of the database before using it with live data.
