# Goodthings Transaction App

A responsive commerce workspace with separate client and administrator dashboards. The frontend is React/Vite styled with Tailwind CSS utilities and navigated with React Router; the API is Express with MongoDB/Mongoose.

## Run locally

1. Start MongoDB locally or provide `MONGODB_URI` in `backend/.env`.
2. Copy `backend/.env.example` to `backend/.env`, set a private `JWT_SECRET` and administrator credentials, and configure SMTP and MTN MoMo when those services are needed.
3. Start the API with `npm --prefix backend run dev`.
4. In another terminal, start the app with `npm --prefix frontend run dev`.

The API uses port `3000` and the frontend uses port `5173` by default. Mobile-money and cash checkout create 24-hour bills. Clients can find a bill by ID in My purchases; pressing Pay with mobile money sends the provider request to the entered phone. Provider callbacks confirm bills, record income, email the client, and notify the administrator. A one-minute backend worker expires unpaid bills and restores reserved stock. Backend tests run with `npm --prefix backend test`; frontend checks run with `npm --prefix frontend run lint` and `npm --prefix frontend run build`.

## Project layout

- `backend/` contains MongoDB models, Express route groups, auth middleware, and payment/email services.
- `frontend/` contains role-protected React Router pages, Tailwind UI, and the Axios API client.
- `transact docs/` contains the supplied product and design references.

The backend creates or synchronizes the administrator from `ADMIN_EMAIL` and `ADMIN_PASSWORD` on startup, so configured environment credentials remain usable after password changes. If those variables are missing from `backend/.env`, no administrator can be created until you add them. Mobile money charges require valid MTN MoMo credentials and a publicly reachable HTTPS callback URL. Email notifications require SMTP settings.
