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

MTN MoMo collection payments require a subscription key for the Collection product, a generated API user and that user's API key. Obtain these from the MTN MoMo developer portal for the selected target environment, then set `MOMO_SUBSCRIPTION_KEY`, `MOMO_API_USER`, and `MOMO_API_KEY` in `backend/.env`. The sample values are placeholders and cannot authenticate. Callbacks use `POST /api/momo/callback`; `MOMO_CALLBACK_URL` must be a current, public HTTPS URL that reaches that route. SMTP is required for password reset codes, purchase confirmations, and debt reminders. Password reset codes are 6 digits, expire after 10 minutes, allow up to 5 attempts, and can be used once. In non-production development only, the password-reset endpoint returns the generated code if SMTP is not configured.

Checkout creates a MongoDB bill with a customer-facing `bill_id` and 24-hour `expires_at`; the client can retrieve it at `GET /api/client/bills/:billId` or verify the live payment at `GET /api/client/bills/:billId/status`. For mobile money, the storefront collects the Rwandan number in a popup, creates the pending bill, and then sends the Request to Pay. The bill ID is sent as the provider `externalId`; the provider UUID remains the Request to Pay reference used for status verification. Only a verified callback or status reconciliation marks a bill paid, after the amount and currency match the bill. Callback success records idempotent income, emails the client, and creates a persistent administrator notification. Workers check every minute for expired bills and pending mobile-money payments, return reserved stock on failure, update linked debt status, and record outcomes in `job_monitoring`.
