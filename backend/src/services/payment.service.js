const {
  Admin,
  CartItem,
  Client,
  Debt,
  Income,
  Notification,
  Payment,
  Product,
} = require("../../models");
const { sendEmail, updateJob } = require("./email.service");

async function expireBill(payment, now = new Date()) {
  const expiredStatus =
    payment.method === "debt" && payment.status === "unpaid"
      ? "overdue"
      : "expired";
  const expired = await Payment.findOneAndUpdate(
    {
      _id: payment._id,
      status: { $in: ["pending", "unpaid"] },
      expires_at: { $lte: now },
    },
    { status: expiredStatus },
    { new: true },
  );
  if (!expired) return false;

  if (payment.method === "debt") {
    await Debt.updateOne(
      { payment_id: payment._id, status: "pending" },
      { status: "expired", review_status: "expired" },
    );
    await Debt.updateOne(
      {
        payment_id: payment._id,
        status: { $in: ["unpaid", "partial"] },
      },
      { status: "overdue" },
    );
  }
  const items = await CartItem.find({ payment_id: payment._id, status: "pending" });
  for (const item of items) {
    await Product.updateOne(
      { _id: item.product_id },
      { $inc: { stock_quantity: item.quantity } },
    );
  }
  await CartItem.updateMany(
    { payment_id: payment._id, status: "pending" },
    { status: "in_cart", payment_id: null },
  );
  return true;
}

async function expirePendingBills(now = new Date()) {
  const dueBills = await Payment.find({
    status: { $in: ["pending", "unpaid"] },
    expires_at: { $lte: now },
  }).select("_id");
  let expiredCount = 0;
  for (const payment of dueBills) {
    if (await expireBill(payment, now)) expiredCount += 1;
  }
  return expiredCount;
}

async function recordPaidBill(payment, client) {
  const admin = await Admin.findOne().sort({ created_at: 1 });
  if (!admin) return;
  await Income.updateOne(
    { payment_id: payment._id },
    {
      $setOnInsert: {
        payment_id: payment._id,
        amount: payment.amount,
        description: `Bill ${payment.bill_id || payment.reference} paid`,
        recorded_by: admin._id,
      },
    },
    { upsert: true },
  );
  await Notification.updateOne(
    { admin_id: admin._id, payment_id: payment._id },
    {
      $setOnInsert: {
        admin_id: admin._id,
        payment_id: payment._id,
        client_id: client._id,
        message: `${client.first_name} ${client.last_name} paid bill ${payment.bill_id || payment.reference} (RWF ${payment.amount.toLocaleString()}).`,
      },
    },
    { upsert: true },
  );
}

async function applyPaymentResult(payment, successful, failureReason = "") {
  if (payment.expires_at && payment.expires_at <= new Date()) {
    await expireBill(payment);
    return;
  }
  const update = successful
    ? {
        $set: { status: "paid", paid_at: new Date() },
        $unset: { failure_reason: 1 },
      }
    : {
        $set: {
          status: "failed",
          failure_reason: failureReason || "Payment was not completed.",
        },
      };
  const updated = await Payment.findOneAndUpdate(
    {
      _id: payment._id,
      status: "pending",
      $or: [
        { expires_at: { $exists: false } },
        { expires_at: null },
        { expires_at: { $gt: new Date() } },
      ],
    },
    update,
    { new: true },
  );
  if (!updated) return;

  if (payment.debt_id) {
    if (!successful) return;
    const debt = await Debt.findOne({
      _id: payment.debt_id,
      status: { $in: ["unpaid", "partial", "overdue"] },
      balance: { $gte: payment.amount },
    });
    if (!debt) return;
    debt.amount_paid += payment.amount;
    debt.balance -= payment.amount;
    debt.status = debt.balance === 0 ? "settled" : "partial";
    if (debt.balance === 0) debt.settled_at = new Date();
    await debt.save();
    const client = await Client.findById(payment.client_id);
    if (client) {
      await recordPaidBill(updated, client);
      sendEmail({
        to: client.email,
        subject: `Debt payment confirmed: ${payment.bill_id || payment.reference}`,
        text: `Hello ${client.first_name}, your debt payment of RWF ${payment.amount.toLocaleString()} was confirmed. Bill: ${payment.bill_id || payment.reference}. Remaining balance: RWF ${debt.balance.toLocaleString()}.`,
      })
        .then(() => updateJob("purchase_confirmation_email", "ok"))
        .catch((error) =>
          updateJob("purchase_confirmation_email", "failed", error.message),
        );
    }
    return;
  }

  const items = await CartItem.find({ payment_id: payment._id });
  if (!successful) {
    for (const item of items) {
      await Product.updateOne(
        { _id: item.product_id },
        { $inc: { stock_quantity: item.quantity } },
      );
    }
    await CartItem.updateMany(
      { payment_id: payment._id },
      { status: "in_cart", payment_id: null },
    );
    return;
  }

  await CartItem.updateMany({ payment_id: payment._id }, { status: "paid" });
  const purchasedItems = await CartItem.find({
    payment_id: payment._id,
  }).populate("product_id");
  const client = await Client.findById(payment.client_id);
  if (!client) return;
  await recordPaidBill(updated, client);
  const summary = purchasedItems
    .map((item) => `${item.product_id?.name || "Product"} x ${item.quantity}`)
    .join(", ");
  sendEmail({
    to: client.email,
    subject: "Your purchase is confirmed",
    text: `Hello ${client.first_name}, your payment of RWF ${payment.amount.toLocaleString()} was successful. Purchased: ${summary}. Bill: ${payment.bill_id || payment.reference}.`,
  })
    .then(() => updateJob("purchase_confirmation_email", "ok"))
    .catch((error) =>
      updateJob("purchase_confirmation_email", "failed", error.message),
    );
}

function momoConfiguration() {
  const required = [
    "MOMO_BASE_URL",
    "MOMO_SUBSCRIPTION_KEY",
    "MOMO_API_USER",
    "MOMO_API_KEY",
  ];
  const invalid = required.filter((key) => {
    const value = String(process.env[key] || "").trim();
    return !value || /^(replace-with|key_generated|your-|placeholder)/i.test(value);
  });
  if (invalid.length) {
    throw Object.assign(
      new Error(
        `Configure valid ${invalid.join(", ")} values in backend/.env.`,
      ),
      { status: 503 },
    );
  }
  return {
    baseUrl: process.env.MOMO_BASE_URL.trim().replace(/\/$/, ""),
    subscriptionKey: process.env.MOMO_SUBSCRIPTION_KEY.trim(),
  };
}

async function momoAccessToken(baseUrl, subscriptionKey) {
  const basicAuth = Buffer.from(
    `${process.env.MOMO_API_USER}:${process.env.MOMO_API_KEY}`,
  ).toString("base64");
  const tokenResponse = await fetch(`${baseUrl}/collection/token/`, {
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Ocp-Apim-Subscription-Key": subscriptionKey,
    },
  });
  if (!tokenResponse.ok)
    throw Object.assign(new Error("Mobile money authentication failed."), {
      status: 502,
    });
  const { access_token: accessToken } = await tokenResponse.json();
  return accessToken;
}

function normalizeRwandaPhone(value) {
  let digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("250")) digits = digits.slice(3);
  if (digits.length === 9 && digits.startsWith("7")) digits = `0${digits}`;
  if (!/^07[89]\d{7}$/.test(digits)) {
    throw Object.assign(
      new Error(
        "Enter a valid Rwandan mobile money number, for example 0781234567 or 0791234567.",
      ),
      { status: 400 },
    );
  }
  return digits;
}

function toMsisdn(phoneNumber) {
  return `250${normalizeRwandaPhone(phoneNumber).slice(1)}`;
}

async function requestMobileMoney(payment, phoneNumber) {
  const { baseUrl, subscriptionKey } = momoConfiguration();
  const phone = normalizeRwandaPhone(phoneNumber);
  const accessToken = await momoAccessToken(baseUrl, subscriptionKey);
  const callbackUrl =
    process.env.MOMO_CALLBACK_URL ||
    `http://localhost:${process.env.PORT || 3000}/api/momo/callback`;
  const response = await fetch(`${baseUrl}/collection/v1_0/requesttopay`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "X-Reference-Id": payment.reference,
      "X-Target-Environment": process.env.MOMO_TARGET_ENV || "sandbox",
      "Ocp-Apim-Subscription-Key": subscriptionKey,
      "X-Callback-Url": callbackUrl,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: String(Math.round(payment.amount)),
      currency: process.env.MOMO_CURRENCY || "RWF",
      externalId: payment.bill_id || payment.reference,
      payer: { partyIdType: "MSISDN", partyId: toMsisdn(phone) },
      payerMessage: "Purchase payment",
      payeeNote: `Bill ${payment.bill_id || payment.reference}`,
    }),
  });
  if (response.status !== 202) {
    throw Object.assign(
      new Error("Mobile money did not accept the payment request."),
      { status: 502 },
    );
  }
  return { reference: payment.reference, status: "pending", phone };
}

async function verifyMobileMoneyPayment(reference) {
  const { baseUrl, subscriptionKey } = momoConfiguration();
  const accessToken = await momoAccessToken(baseUrl, subscriptionKey);
  const response = await fetch(
    `${baseUrl}/collection/v1_0/requesttopay/${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Target-Environment": process.env.MOMO_TARGET_ENV || "sandbox",
        "Ocp-Apim-Subscription-Key": subscriptionKey,
      },
    },
  );
  if (!response.ok)
    throw Object.assign(
      new Error("Unable to verify payment status with mobile money."),
      { status: 502 },
    );
  const result = await response.json();
  return {
    status: String(result.status || "").toUpperCase(),
    amount: result.amount,
    currency: String(result.currency || "").toUpperCase(),
    reason: result.reason,
  };
}

function providerReason(result) {
  if (!result?.reason) return "";
  if (typeof result.reason === "string") return result.reason;
  return result.reason.message || result.reason.code || "";
}

function amountAndCurrencyMatch(payment, result) {
  const expectedAmount = Math.round(Number(payment.amount));
  const receivedAmount = Number(result.amount);
  const expectedCurrency = String(
    process.env.MOMO_CURRENCY || "RWF",
  ).toUpperCase();
  return (
    Number.isFinite(receivedAmount) &&
    Math.round(receivedAmount) === expectedAmount &&
    result.currency === expectedCurrency
  );
}

async function reconcileMobileMoneyPayment(payment) {
  if (
    payment.method !== "mobile_money" ||
    payment.status !== "pending" ||
    !payment.reference
  )
    return payment;
  const result = await verifyMobileMoneyPayment(payment.reference);
  if (["SUCCESSFUL", "SUCCESS", "PAID"].includes(result.status)) {
    if (!amountAndCurrencyMatch(payment, result)) {
      await applyPaymentResult(
        payment,
        false,
        `Mobile money confirmed ${result.amount || "an unknown amount"} ${result.currency || "in an unknown currency"}, but the bill was RWF ${Number(payment.amount).toLocaleString()}.`,
      );
      return Payment.findById(payment._id);
    }
    await applyPaymentResult(payment, true);
    return Payment.findById(payment._id);
  }
  if (["FAILED", "REJECTED", "EXPIRED", "TIMEOUT"].includes(result.status)) {
    await applyPaymentResult(
      payment,
      false,
      providerReason(result) ||
        `Mobile money reported the payment as ${result.status.toLowerCase()}.`,
    );
    return Payment.findById(payment._id);
  }
  return payment;
}

async function reconcilePendingMobileMoneyPayments(limit = 20) {
  const payments = await Payment.find({
    method: "mobile_money",
    status: "pending",
    momo_requested_at: { $ne: null },
    expires_at: { $gt: new Date() },
  })
    .sort({ momo_requested_at: 1 })
    .limit(limit);
  let checked = 0;
  let completed = 0;
  for (const payment of payments) {
    try {
      checked += 1;
      const updated = await reconcileMobileMoneyPayment(payment);
      if (updated && updated.status !== "pending") completed += 1;
    } catch {
      // The next worker run will retry payments MTN could not be reached for.
    }
  }
  return { checked, completed };
}

module.exports = {
  applyPaymentResult,
  expirePendingBills,
  normalizeRwandaPhone,
  reconcileMobileMoneyPayment,
  reconcilePendingMobileMoneyPayments,
  requestMobileMoney,
  verifyMobileMoneyPayment,
};
