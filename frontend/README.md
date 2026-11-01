# Frontend

React 19, Vite, Tailwind CSS 4, Axios, and Lucide icons. The app connects to `http://localhost:3000/api` by default; set `VITE_API_URL` to override it.

Sign in with Google uses Google Identity Services. Set `GOOGLE_CLIENT_ID` in `backend/.env` to your OAuth web client ID and add the frontend origin (for example `http://localhost:5173`) to the authorized JavaScript origins in the Google Cloud console. The frontend reads the public client ID from `GET /api/auth/google/config`; optionally set `VITE_GOOGLE_CLIENT_ID` in `frontend/.env` to skip that lookup. When no client ID is configured, the Continue with Google button explains what is missing.

From the workspace root:

```powershell
npm --prefix frontend install
npm --prefix frontend run dev
```

Build and lint with `npm --prefix frontend run build` and `npm --prefix frontend run lint`.

## Structure

- `src/App.jsx` composes the workspace shell and shared state.
- `src/features/landing/` contains the signed-out storefront landing page; `admin/` and `client/` contain protected role-specific dashboard views.
- `src/components/` contains reusable dashboard, table, modal, and form components.
- `src/lib/` contains API requests and backend-to-view normalization.
- `src/data/` contains preview data used before sign-in.
- `src/utils/` contains small domain helpers.
