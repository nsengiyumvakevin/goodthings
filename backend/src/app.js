const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth.routes");
const catalogRoutes = require("./routes/catalog.routes");
const clientRoutes = require("./routes/client.routes");
const paymentsRoutes = require("./routes/payments.routes");
const adminRoutes = require("./routes/admin.routes");
const debtsRoutes = require("./routes/debts.routes");
const ledgerRoutes = require("./routes/ledger.routes");
const returnsRoutes = require("./routes/returns.routes");

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN?.split(",") || true }));
app.use(express.json({ limit: "6mb" }));

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api", catalogRoutes);
app.use("/api/client", clientRoutes);
app.use("/api", paymentsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin", debtsRoutes);
app.use("/api/admin", ledgerRoutes);
app.use("/api/admin", returnsRoutes);

app.use((req, res) => res.status(404).json({ error: "API route not found." }));

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error.code === 11000)
    return res
      .status(409)
      .json({ error: "An account or record with that value already exists." });
  if (error.name === "ValidationError" || error.name === "CastError")
    return res.status(400).json({ error: error.message });
  const status = error.status || 500;
  if (status >= 500) console.error(error);
  res
    .status(status)
    .json({
      error:
        status >= 500 ? "The request could not be completed." : error.message,
    });
});

module.exports = app;
