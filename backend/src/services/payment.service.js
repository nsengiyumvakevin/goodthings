const { CartItem, Client, Debt, Payment, Product } = require("../../models");
const { sendEmail, updateJob } = require("./email.service");

async function applyPaymentResult(payment, successful) {
  const updated = await Payment.findOneAndUpdate(
    { _id: payment._id, status: "pending" },
    successful ? { status: "paid", paid_at: new Date() } : { status: "failed" },
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
  const summary = purchasedItems
    .map((item) => `${item.product_id?.name || "Product"} x ${item.quantity}`)
    .join(", ");
  sendEmail({
    to: client.email,
    subject: "Your purchase is confirmed",
    text: `Hello ${client.first_name}, your payment of RWF ${payment.amount.toLocaleString()} was successful. Purchased: ${summary}. Reference: ${payment.reference}.`,
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

async function requestMobileMoney(payment, phoneNumber) {
  const { baseUrl, subscriptionKey } = momoConfiguration();
  const phone = String(phoneNumber || "").replace(/[^0-9]/g, "");
  if (phone.length < 9 || phone.length > 15) {
    throw Object.assign(new Error("Enter a valid mobile money phone number."), {
      status: 400,
    });
  }

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
      externalId: payment.reference,
      payer: { partyIdType: "MSISDN", partyId: phone },
      payerMessage: "Purchase payment",
      payeeNote: `Order ${payment.reference}`,
    }),
  });
  if (response.status !== 202) {
    throw Object.assign(
      new Error("Mobile money did not accept the payment request."),
      { status: 502 },
    );
  }
  return { reference: payment.reference, status: "pending" };
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
  return String(result.status || "").toUpperCase();
}

module.exports = {
  applyPaymentResult,
  requestMobileMoney,
  verifyMobileMoneyPayment,
};
