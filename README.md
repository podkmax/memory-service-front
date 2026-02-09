# Memory Service Frontend

SPA for managing Memory Service projects and artifacts.

## Stack

- Vite + React + TypeScript
- react-router-dom for routing
- Native fetch API with typed wrapper

## Run locally

1. Ensure backend is running on `http://localhost:8080`.
2. Install dependencies:

   ```bash
   npm i
   ```

3. Start dev server:

   ```bash
   npm run dev
   ```

4. Open the app URL shown by Vite (default `http://localhost:5173`).

## Build

```bash
npm run build
```

## Notes

- Frontend calls relative `/api/...` endpoints.
- Dev proxy is configured in `vite.config.ts` to forward `/api` to `http://localhost:8080`.
- Backend-only constraints are respected in UI:
  - no delete operations
  - project edit/delete shown as disabled actions
  - artifact update enabled only in `DRAFT`
  - `topK` clamped to `<= 20`
  - artifact search always sends `query` parameter explicitly
