const crypto = require("node:crypto");
const express = require("express");
const {
  Client,
  CartItem,
  Debt,
  Payment,
  Product,
  SalesReturn,
} = require("../../models");
const authenticate = require("../middleware/authenticate");
const asyncRoute = require("../utils/asyncRoute");
const {
  applyPaymentResult,
  expirePendingBills,
  normalizeRwandaPhone,
  reconcileMobileMoneyPayment,
  requestMobileMoney,
} = require("../services/payment.service");
const { sendEmail, updateJob } = require("../services/email.service");

const router = express.Router();
router.use(authenticate(["client"]));

async function createBillId() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  let billId;
  do {
    billId = `TXN-${date}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;
  } while (await Payment.exists({ bill_id: billId }));
  return billId;
}

function emailBill(client, payment) {
  sendEmail({
    to: client.email,
    subject: `Your Goodthings bill ${payment.bill_id}`,
    text: `Hello ${client.first_name}, your bill ${payment.bill_id} for RWF ${payment.amount.toLocaleString()} is ready. It expires ${payment.expires_at.toLocaleString()}. Sign in to view and pay it.`,
  })
    .then(() => updateJob("bill_email", "ok"))
    .catch((error) => updateJob("bill_email", "failed", error.message));
}

router.get(
  "/me",
  asyncRoute(async (req, res) => {
    const client = await Client.findById(req.auth.sub);
    if (!client)
      return res.status(404).json({ error: "Client account not found." });
    res.json({
      id: client._id,
      first_name: client.first_name,
      last_name: client.last_name,
      email: client.email,
    });
  }),
);

router.get(
  "/cart",
  asyncRoute(async (req, res) => {
    res.json(
      await CartItem.find({ client_id: req.auth.sub, status: "in_cart" })
        .select("-unit_cost")
        .populate({ path: "product_id", select: "-cost_price" })
        .lean(),
    );
  }),
);

router.post(
  "/cart",
  asyncRoute(async (req, res) => {
    const quantity = Number(req.body.quantity || 1);
    const product = await Product.findOne({
      _id: req.body.product_id,
      status: "active",
    }).select("+cost_price");
    if (!product)
      return res.status(404).json({ error: "Product is not available." });
    if (!Number.isInteger(quantity) || quantity < 1)
      return res
        .status(400)
        .json({ error: "Quantity must be a positive whole number." });
    const item = await CartItem.findOneAndUpdate(
      { client_id: req.auth.sub, product_id: product._id, status: "in_cart" },
      {
        $inc: { quantity },
        $set: {
          unit_price: product.price,
          unit_cost: product.cost_price ?? null,
        },
        $setOnInsert: { added_at: new Date() },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    res
      .status(201)
      .json(await item.populate({ path: "product_id", select: "-cost_price" }));
  }),
);

router.patch(
  "/cart/:id",
  asyncRoute(async (req, res) => {
    const quantity = Number(req.body.quantity);
    if (!Number.isInteger(quantity) || quantity < 1)
      return res
        .status(400)
        .json({ error: "Quantity must be a positive whole number." });
    const item = await CartItem.findOneAndUpdate(
      { _id: req.params.id, client_id: req.auth.sub, status: "in_cart" },
      { quantity },
      { new: true },
    ).populate("product_id");
    if (!item) return res.status(404).json({ error: "Cart item not found." });
    res.json(item);
  }),
);

router.delete(
  "/cart/:id",
  asyncRoute(async (req, res) => {
    const result = await CartItem.deleteOne({
      _id: req.params.id,
      client_id: req.auth.sub,
      status: "in_cart",
    });
    if (!result.deletedCount)
      return res.status(404).json({ error: "Cart item not found." });
    res.sendStatus(204);
  }),
);

router.post(
  "/checkout",
  asyncRoute(async (req, res) => {
    const method = String(req.body.method || "");
    if (!["mobile_money", "cash", "debt"].includes(method))
      return res
        .status(400)
        .json({ error: "Choose mobile money, cash, or debt." });
    const mobileNumber =
      method === "mobile_money"
        ? normalizeRwandaPhone(req.body.mobile_money_number)
        : undefined;
    const items = await CartItem.find({
      client_id: req.auth.sub,
      status: "in_cart",
    })
      .select("-unit_cost")
      .populate({ path: "product_id", select: "+cost_price" });
    if (!items.length)
      return res.status(400).json({ error: "Your cart is empty." });
    const periodDays = Number(req.body.period_days || 30);
    if (
      method === "debt" &&
      (!Number.isInteger(periodDays) || periodDays < 1 || periodDays > 365)
    ) {
      return res
        .status(400)
        .json({ error: "Debt period must be from 1 to 365 days." });
    }

    const amount = items.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0,
    );
    const reference = crypto.randomUUID();
    const billId = await createBillId();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const dueDate =
      method === "debt"
        ? new Date(Date.now() + periodDays * 86400000)
        : undefined;
    const payment = await Payment.create({
      client_id: req.auth.sub,
      amount,
      method,
      status: "pending",
      reference,
      bill_id: billId,
      expires_at: expiresAt,
      due_date: dueDate,
      mobile_money_number: mobileNumber,
    });
    const reservedItems = [];
    try {
      for (const item of items) {
        item.unit_cost = item.product_id.cost_price ?? null;
        await CartItem.updateOne(
          { _id: item._id },
          { unit_cost: item.unit_cost },
        );
        const update = await Product.updateOne(
          { _id: item.product_id._id, stock_quantity: { $gte: item.quantity } },
          { $inc: { stock_quantity: -item.quantity } },
        );
        if (!update.modifiedCount)
          throw Object.assign(
            new Error(`${item.product_id.name} does not have enough stock.`),
            { status: 409 },
          );
        reservedItems.push(item);
      }
    } catch (error) {
      for (const item of reservedItems)
        await Product.updateOne(
          { _id: item.product_id._id },
          { $inc: { stock_quantity: item.quantity } },
        );
      await Payment.deleteOne({ _id: payment._id });
      throw error;
    }
    await CartItem.updateMany(
      { _id: { $in: items.map((item) => item._id) } },
      { status: "pending", payment_id: payment._id },
    );

    if (method === "debt") {
      await Debt.create({
        payment_id: payment._id,
        client_id: req.auth.sub,
        total_amount: amount,
        amount_paid: 0,
        balance: amount,
        period_days: periodDays,
        due_date: dueDate,
        status: "pending",
        review_status: "pending",
      });
      const client = await Client.findById(req.auth.sub);
      if (client) emailBill(client, payment);
      return res.status(201).json({
        payment,
        message: `Debt bill ${billId} created. It expires in 24 hours and awaits admin review.`,
      });
    }

    if (method === "mobile_money") {
      payment.momo_requested_at = new Date();
      await payment.save();
      try {
        await requestMobileMoney(payment, mobileNumber);
      } catch (error) {
        await applyPaymentResult(payment, false, error.message);
        throw error;
      }
      return res.status(201).json({
        payment,
        message: `Approve bill ${billId} on your phone.`,
      });
    }

    const client = await Client.findById(req.auth.sub);
    if (client) emailBill(client, payment);
    res.status(201).json({
      payment,
      message: `Cash bill ${billId} created. Pay when collecting; it expires in 24 hours.`,
    });
  }),
);

router.get(
  "/purchases",
  asyncRoute(async (req, res) => {
    const payments = await Payment.find({ client_id: req.auth.sub })
      .sort({ createdAt: -1 })
      .lean();
    const paymentIds = payments.map((payment) => payment._id);
    const items = await CartItem.find({ payment_id: { $in: paymentIds } })
      .populate("product_id")
      .lean();
    res.json(
      payments.map((payment) => ({
        ...payment,
        items: items.filter(
          (item) => String(item.payment_id) === String(payment._id),
        ),
      })),
    );
  }),
);

router.get(
  "/bills/:billId",
  asyncRoute(async (req, res) => {
    const payment = await Payment.findOne({
      client_id: req.auth.sub,
      bill_id: req.params.billId.trim().toUpperCase(),
    })
      .populate("client_id", "first_name last_name email")
      .lean();
    if (!payment) return res.status(404).json({ error: "Bill not found." });
    res.json(payment);
  }),
);

router.get(
  "/bills/:billId/status",
  asyncRoute(async (req, res) => {
    const billId = req.params.billId.trim().toUpperCase();
    let payment = await Payment.findOne({
      client_id: req.auth.sub,
      bill_id: billId,
    });
    if (!payment) return res.status(404).json({ error: "Bill not found." });
    if (payment.expires_at && payment.expires_at <= new Date()) {
      await expirePendingBills();
      payment = await Payment.findById(payment._id);
      return res.json(payment);
    }
    if (
      payment.status === "pending" &&
      payment.method === "mobile_money" &&
      payment.momo_requested_at
    ) {
      try {
        const reconciled = await reconcileMobileMoneyPayment(payment);
        return res.json(reconciled || payment);
      } catch (error) {
        const current = await Payment.findById(payment._id).lean();
        return res.json({
          ...current,
          verification_error: error.message,
        });
      }
    }
    res.json(payment);
  }),
);

router.post(
  "/bills/:billId/pay",
  asyncRoute(async (req, res) => {
    const billId = req.params.billId.trim().toUpperCase();
    const mobileNumber = normalizeRwandaPhone(req.body.mobile_money_number);
    const payment = await Payment.findOne({
      client_id: req.auth.sub,
      bill_id: billId,
    });
    if (!payment) return res.status(404).json({ error: "Bill not found." });
    if (payment.status !== "pending")
      return res.status(409).json({ error: `This bill is ${payment.status}.` });
    if (!payment.expires_at || payment.expires_at <= new Date()) {
      await expirePendingBills();
      return res.status(410).json({ error: "This bill has expired." });
    }
    if (payment.method !== "mobile_money")
      return res.status(409).json({ error: "This bill is not payable by mobile money." });
    if (payment.momo_requested_at)
      return res.status(409).json({ error: "Payment request already sent. Check your phone." });

    payment.momo_requested_at = new Date();
    payment.mobile_money_number = mobileNumber;
    await payment.save();
    try {
      const momo = await requestMobileMoney(payment, mobileNumber);
      res.json({
        payment,
        momo,
        message: `Approve bill ${payment.bill_id} on your phone.`,
      });
    } catch (error) {
      await applyPaymentResult(payment, false, error.message);
      throw error;
    }
  }),
);

router.get(
  "/debts",
  asyncRoute(async (req, res) => {
    res.json(
      await Debt.find({ client_id: req.auth.sub })
        .populate("payment_id")
        .sort({ due_date: 1 })
        .lean(),
    );
  }),
);

router.post(
  "/debts/:id/pay",
  asyncRoute(async (req, res) => {
    const debt = await Debt.findOne({
      _id: req.params.id,
      client_id: req.auth.sub,
      status: { $in: ["unpaid", "partial", "overdue"] },
    });
    if (!debt || debt.balance <= 0)
      return res
        .status(404)
        .json({ error: "An outstanding debt was not found." });

    const existingBill = await Payment.findOne({
      debt_id: debt._id,
      status: "pending",
      expires_at: { $gt: new Date() },
    });
    if (existingBill)
      return res.status(409).json({
        payment: existingBill,
        message: `Bill ${existingBill.bill_id} is already waiting for payment.`,
      });

    const payment = await Payment.create({
      client_id: req.auth.sub,
      debt_id: debt._id,
      amount: debt.balance,
      method: "mobile_money",
      status: "pending",
      reference: crypto.randomUUID(),
      bill_id: await createBillId(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    const client = await Client.findById(req.auth.sub);
    if (client) emailBill(client, payment);
    res.status(201).json({
      payment,
      message: `Debt bill ${payment.bill_id} created. Enter your phone and pay from My purchases.`,
    });
  }),
);

router.get(
  "/returns",
  asyncRoute(async (req, res) => {
    res.json(
      await SalesReturn.find({ client_id: req.auth.sub })
        .sort({ createdAt: -1 })
        .lean(),
    );
  }),
);

router.post(
  "/returns",
  asyncRoute(async (req, res) => {
    const quantity = Number(req.body.quantity);
    const reason = String(req.body.reason || "").trim();
    if (!Number.isInteger(quantity) || quantity < 1 || !reason)
      return res
        .status(400)
        .json({ error: "Select a quantity and provide a return reason." });
    const item = await CartItem.findOne({
      _id: req.body.cart_item_id,
      client_id: req.auth.sub,
      status: { $in: ["paid", "debt"] },
    }).populate({ path: "product_id", select: "+cost_price" });
    if (!item)
      return res
        .status(404)
        .json({ error: "A completed purchase is required for a return." });
    const pendingQuantity = await SalesReturn.aggregate([
      { $match: { cart_item_id: item._id, status: "pending" } },
      { $group: { _id: null, quantity: { $sum: "$quantity" } } },
    ]);
    if (
      quantity + item.returned_quantity + (pendingQuantity[0]?.quantity || 0) >
      item.quantity
    ) {
      return res
        .status(400)
        .json({ error: "Return quantity exceeds the unreturned quantity." });
    }
    const salesReturn = await SalesReturn.create({
      payment_id: item.payment_id,
      client_id: req.auth.sub,
      product: item.product_id.name,
      reason,
      cart_item_id: item._id,
      quantity,
    });
    res.status(201).json(salesReturn);
  }),
);

module.exports = router;
