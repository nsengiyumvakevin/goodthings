# Backend

Express API backed by MongoDB. Start it from the workspace root with `npm --prefix backend run dev` or `npm --prefix backend start`.

Copy `.env.example` to `.env` and set a private `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, SMTP settings, and MTN MoMo credentials. MongoDB defaults to `mongodb://127.0.0.1:27017/transaction_app`. On each start, the API creates or synchronizes the configured administrator and inserts the starter catalog only when the products collection is empty. If administrator environment variables are missing, no account can be provisioned.

## Structure

- `server.js` connects to MongoDB and starts the HTTP listener.
- `src/app.js` configures middleware, mounts route groups, and handles errors.
- `src/routes/` contains auth, catalog, client, payment, debt, ledger, return, and admin endpoints.
- `src/middleware/` contains role-based JWT authentication.
- `src/services/` contains email delivery and payment fulfillment/provider integration.
- `src/database/` contains initial catalog setup.
- `models.js` defines the MongoDB collections.

MTN MoMo collection payments require a subscription key for the Collection product, a generated API user and that user's API key. Obtain these from the MTN MoMo developer portal for the selected target environment, then set `MOMO_SUBSCRIPTION_KEY`, `MOMO_API_USER`, and `MOMO_API_KEY` in `backend/.env`. The sample values are placeholders and cannot authenticate. Callbacks use `POST /api/momo/callback`; `MOMO_CALLBACK_URL` must be a current, public HTTPS URL that reaches that route. SMTP is required for password reset links, purchase confirmations, and debt reminders. In non-production development only, the password-reset endpoint returns a one-time reset token if SMTP is not configured.