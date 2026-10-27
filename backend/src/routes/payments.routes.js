const express = require("express");
const { Payment } = require("../../models");
const authenticate = require("../middleware/authenticate");
const asyncRoute = require("../utils/asyncRoute");
const {
  applyPaymentResult,
  reconcileMobileMoneyPayment,
} = require("../services/payment.service");

const router = express.Router();

router.post(
  "/momo/callback",
  asyncRoute(async (req, res) => {
    const reference =
      req.body.externalId ||
      req.body.reference ||
      req.headers["x-reference-id"];
    if (!reference)
      return res
        .status(400)
        .json({ error: "Callback is missing a payment reference." });
    const payment = await Payment.findOne({
      $or: [{ bill_id: reference }, { reference }],
    });
    if (!payment) return res.sendStatus(204);
    const updated = await reconcileMobileMoneyPayment(payment);
    if (!updated || updated.status === "pending") return res.sendStatus(202);
    res.sendStatus(200);
  }),
);

router.use("/admin", authenticate(["admin"]));

router.get(
  "/admin/payments",
  asyncRoute(async (req, res) => {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.method) filter.method = req.query.method;
    res.json(
      await Payment.find(filter)
        .populate("client_id", "first_name last_name email")
        .sort({ createdAt: -1 })
        .lean(),
    );
  }),
);

router.post(
  "/admin/payments/:id/confirm-cash",
  asyncRoute(async (req, res) => {
    const payment = await Payment.findOne({
      _id: req.params.id,
      method: "cash",
      status: "pending",
    });
    if (!payment)
      return res.status(404).json({ error: "Pending cash payment not found." });
    await applyPaymentResult(payment, true);
    res.json(await Payment.findById(payment._id));
  }),
);

module.exports = router;
