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
  requestMobileMoney,
} = require("../services/payment.service");

const router = express.Router();
router.use(authenticate(["client"]));

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
        .populate("product_id")
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
    });
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
        $setOnInsert: { unit_price: product.price, added_at: new Date() },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    res.status(201).json(await item.populate("product_id"));
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
    const items = await CartItem.find({
      client_id: req.auth.sub,
      status: "in_cart",
    }).populate("product_id");
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
      due_date: dueDate,
    });
    const reservedItems = [];
    try {
      for (const item of items) {
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
      return res
        .status(201)
        .json({ payment, message: "Purchase recorded as debt." });
    }
    if (method === "cash")
      return res
        .status(201)
        .json({
          payment,
          message: "Order placed. Cash payment is awaiting confirmation.",
        });

    try {
      const momo = await requestMobileMoney(
        payment,
        req.body.mobile_money_number,
      );
      res
        .status(201)
        .json({
          payment,
          momo,
          message: "Approve the payment request on your phone.",
        });
    } catch (error) {
      await applyPaymentResult(payment, false);
      throw error;
    }
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

    const payment = await Payment.create({
      client_id: req.auth.sub,
      debt_id: debt._id,
      amount: debt.balance,
      method: "mobile_money",
      status: "pending",
      reference: crypto.randomUUID(),
    });
    try {
      const momo = await requestMobileMoney(
        payment,
        req.body.mobile_money_number,
      );
      res.status(201).json({
        payment,
        momo,
        message: "Approve the debt payment request on your phone.",
      });
    } catch (error) {
      await Payment.deleteOne({ _id: payment._id });
      throw error;
    }
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
    }).populate("product_id");
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
