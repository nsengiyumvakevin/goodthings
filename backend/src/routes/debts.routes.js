const express = require("express");
const { CartItem, Debt, Income, Payment, Product } = require("../../models");
const authenticate = require("../middleware/authenticate");
const asyncRoute = require("../utils/asyncRoute");
const { sendEmail } = require("../services/email.service");

const router = express.Router();
router.use(authenticate(["admin"]));

router.get(
  "/debts",
  asyncRoute(async (req, res) => {
    const debts = await Debt.find()
      .populate("client_id", "first_name last_name email")
      .populate("payment_id")
      .sort({ due_date: 1 })
      .lean();
    const now = new Date();
    res.json(
      debts.map((debt) =>
        debt.balance > 0 && debt.due_date < now && debt.status !== "overdue"
          ? { ...debt, status: "overdue" }
          : debt,
      ),
    );
  }),
);

router.patch(
  "/debts/:id/review",
  asyncRoute(async (req, res) => {
    const decision = String(req.body.decision || "").toLowerCase();
    if (!["accept", "reject"].includes(decision))
      return res.status(400).json({ error: "Choose accept or reject." });

    const debt = await Debt.findOneAndUpdate(
      { _id: req.params.id, status: "pending" },
      {
        status: decision === "accept" ? "unpaid" : "rejected",
        review_status: decision === "accept" ? "accepted" : "rejected",
      },
      { new: true },
    );
    if (!debt)
      return res
        .status(404)
        .json({ error: "A pending debt request was not found." });

    await Payment.updateOne(
      { _id: debt.payment_id },
      {
        status: decision === "accept" ? "unpaid" : "failed",
        ...(decision === "accept" ? { expires_at: debt.due_date } : {}),
      },
    );
    if (decision === "accept") {
      await CartItem.updateMany(
        { payment_id: debt.payment_id, status: "pending" },
        { status: "debt" },
      );
      return res.json(debt);
    }

    const reservedItems = await CartItem.find({
      payment_id: debt.payment_id,
      status: "pending",
    });
    for (const item of reservedItems) {
      await Product.updateOne(
        { _id: item.product_id },
        { $inc: { stock_quantity: item.quantity } },
      );
    }
    await CartItem.updateMany(
      { payment_id: debt.payment_id, status: "pending" },
      { status: "in_cart", payment_id: null },
    );
    res.json(debt);
  }),
);

router.post(
  "/debts/:id/part-payment",
  asyncRoute(async (req, res) => {
    const amount = Number(req.body.amount);
    if (!Number.isFinite(amount) || amount <= 0)
      return res
        .status(400)
        .json({ error: "Enter a positive payment amount." });
    const debt = await Debt.findById(req.params.id);
    if (
      !debt ||
      !["unpaid", "partial", "overdue"].includes(debt.status) ||
      amount > debt.balance
    )
      return res
        .status(400)
        .json({ error: "Debt was not found or payment exceeds its balance." });
    debt.amount_paid += amount;
    debt.balance -= amount;
    debt.status = debt.balance === 0 ? "settled" : "partial";
    if (debt.balance === 0) debt.settled_at = new Date();
    await debt.save();
    await Payment.findByIdAndUpdate(debt.payment_id, {
      status: debt.balance === 0 ? "paid" : "partial",
      ...(debt.balance === 0 ? { paid_at: new Date() } : {}),
    });
    await Income.create({
      amount,
      description: `Debt part-payment for ${debt.payment_id}`,
      recorded_by: req.auth.sub,
    });
    res.json(debt);
  }),
);

router.post(
  "/debts/:id/reminder",
  asyncRoute(async (req, res) => {
    const debt = await Debt.findById(req.params.id).populate(
      "client_id",
      "first_name email",
    );
    if (
      !debt ||
      debt.balance <= 0 ||
      !["unpaid", "partial", "overdue"].includes(debt.status)
    )
      return res.status(404).json({ error: "Outstanding debt not found." });
    await sendEmail({
      to: debt.client_id.email,
      subject: "Payment reminder",
      text: `Hello ${debt.client_id.first_name}, your outstanding balance is RWF ${debt.balance.toLocaleString()}, due ${debt.due_date.toLocaleDateString()}. Please contact us to arrange payment.`,
    });
    debt.last_reminder_sent_at = new Date();
    await debt.save();
    res.json({ message: "Payment reminder sent." });
  }),
);

module.exports = router;
