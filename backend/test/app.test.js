const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const app = require("../src/app");
const models = require("../models");

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
});

test("health endpoint reports API status", async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.ok(["connected", "disconnected"].includes(body.database));
});

test("client routes require a client token", async () => {
  const response = await fetch(`${baseUrl}/api/client/cart`);
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "Sign in to continue." });
});

test("admin routes require an admin token", async () => {
  const response = await fetch(`${baseUrl}/api/admin/payments`);
  assert.equal(response.status, 401);
});

test("debt payment routes require a client token", async () => {
  const response = await fetch(`${baseUrl}/api/client/debts/not-a-debt/pay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobile_money_number: "+250700000000" }),
  });
  assert.equal(response.status, 401);
});

test("debt review routes require an admin token", async () => {
  const response = await fetch(
    `${baseUrl}/api/admin/debts/not-a-debt/review`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision: "accept" }),
    },
  );
  assert.equal(response.status, 401);
});

test("session verification requires a signed token", async () => {
  const response = await fetch(`${baseUrl}/api/auth/me`);
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "Sign in to continue." });
});

test("mobile money callback rejects requests without a reference", async () => {
  const response = await fetch(`${baseUrl}/api/momo/callback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "SUCCESSFUL" }),
  });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: "Callback is missing a payment reference.",
  });
});

test("unknown API routes return JSON 404", async () => {
  const response = await fetch(`${baseUrl}/api/not-a-route`);
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: "API route not found." });
});

test("models use the requested MongoDB collection names", () => {
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(models).map(([name, model]) => [
        name,
        model.collection.name,
      ]),
    ),
    {
      Client: "clients",
      Admin: "admins",
      Product: "products",
      CartItem: "cart_items",
      Payment: "payments",
      Debt: "debts",
      Income: "income",
      Outcome: "outcome",
      SalesReturn: "sales_return",
      JobMonitoring: "job_monitoring",
    },
  );
});
