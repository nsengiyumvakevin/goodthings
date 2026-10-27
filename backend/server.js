require("dotenv").config();

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const app = require("./src/app");
const { Admin, JobMonitoring } = require("./models");
const { seedProducts } = require("./src/database/seed");
const { startBillExpiryJob } = require("./src/services/bill-expiry.service");
const {
  startPaymentReconciliationJob,
} = require("./src/services/payment-reconciliation.service");

async function start() {
  if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET must be configured in production.");
  }
  const mongoUri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    "mongodb://127.0.0.1:27017/transaction_app";
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
  await seedProducts();

  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    const email = process.env.ADMIN_EMAIL.toLowerCase();
    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
    await Admin.findOneAndUpdate(
      { email },
      {
        $set: {
          full_name: process.env.ADMIN_FULL_NAME || "Administrator",
          password_hash: passwordHash,
        },
        $setOnInsert: { email },
      },
      { upsert: true, new: true },
    );
  }

  await JobMonitoring.updateOne(
    { job_name: "mobile_money_callbacks" },
    {
      $setOnInsert: {
        status: "waiting",
        priority: "medium",
        error: "Waiting for provider callbacks.",
      },
    },
    { upsert: true },
  );
  await JobMonitoring.updateOne(
    { job_name: "bill_expiration" },
    {
      $setOnInsert: {
        status: "waiting",
        priority: "medium",
        error: "Bill expiry worker is starting.",
      },
    },
    { upsert: true },
  );
  await JobMonitoring.updateOne(
    { job_name: "payment_reconciliation" },
    {
      $setOnInsert: {
        status: "waiting",
        priority: "high",
        error: "Payment reconciliation worker is starting.",
      },
    },
    { upsert: true },
  );
  startBillExpiryJob();
  startPaymentReconciliationJob();

  const port = Number(process.env.PORT || 3000);
  return app.listen(port, () =>
    console.log(`Transaction API listening on port ${port}`),
  );
}

if (require.main === module) {
  start().catch((error) => {
    console.error(`Backend startup failed: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { start };
