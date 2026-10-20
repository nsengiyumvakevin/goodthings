const express = require("express");
const {
  Client,
  Debt,
  Income,
  JobMonitoring,
  Outcome,
  Payment,
  SalesReturn,
} = require("../../models");
const authenticate = require("../middleware/authenticate");
const asyncRoute = require("../utils/asyncRoute");

const router = express.Router();
router.use(authenticate(["admin"]));

router.get(
  "/overview",
  asyncRoute(async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [
      income,
      paidSales,
      outcome,
      unpaidDebts,
      pendingReturns,
      payments,
      clientCount,
    ] = await Promise.all([
      Income.aggregate([
        { $match: { date: { $gte: today } } },
        { $group: { _id: null, amount: { $sum: "$amount" } } },
      ]),
      Payment.aggregate([
        {
          $match: {
            status: "paid",
            method: { $ne: "debt" },
            paid_at: { $gte: today },
          },
        },
        { $group: { _id: null, amount: { $sum: "$amount" } } },
      ]),
      Outcome.aggregate([
        { $match: { date: { $gte: today } } },
        { $group: { _id: null, amount: { $sum: "$amount" } } },
      ]),
      Debt.aggregate([
        { $match: { status: { $in: ["unpaid", "partial", "overdue"] } } },
        { $group: { _id: null, balance: { $sum: "$balance" } } },
      ]),
      SalesReturn.countDocuments({ status: "pending" }),
      Payment.find()
        .populate("client_id", "first_name last_name email")
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
      Client.countDocuments(),
    ]);
    res.json({
      income_today: (income[0]?.amount || 0) + (paidSales[0]?.amount || 0),
      outcome_today: outcome[0]?.amount || 0,
      unpaid_debts: unpaidDebts[0]?.balance || 0,
      pending_returns: pendingReturns,
      clients: clientCount,
      recent_payments: payments,
    });
  }),
);

router.get(
  "/clients",
  asyncRoute(async (req, res) => {
    res.json(
      await Client.find()
        .select("first_name last_name email created_at")
        .sort({ created_at: -1 })
        .lean(),
    );
  }),
);

router.get(
  "/reports",
  asyncRoute(async (req, res) => {
    const start = req.query.start ? new Date(req.query.start) : new Date(0);
    const end = req.query.end ? new Date(req.query.end) : new Date();
    if (
      Number.isNaN(start.valueOf()) ||
      Number.isNaN(end.valueOf()) ||
      start > end
    ) {
      return res.status(400).json({ error: "Choose a valid date range." });
    }
    const dateFilter = { $gte: start, $lte: end };
    const type = String(req.query.type || "all");
    const report = {};
    if (type === "all" || type === "payments")
      report.payments = await Payment.find({ createdAt: dateFilter })
        .populate("client_id", "first_name last_name email")
        .sort({ createdAt: -1 })
        .lean();
    if (type === "all" || type === "income")
      report.income = await Income.find({ date: dateFilter })
        .populate("recorded_by", "full_name")
        .sort({ date: -1 })
        .lean();
    if (type === "all" || type === "outcome")
      report.outcome = await Outcome.find({ date: dateFilter })
        .populate("recorded_by", "full_name")
        .sort({ date: -1 })
        .lean();
    if (type === "all" || type === "returns")
      report.returns = await SalesReturn.find({ createdAt: dateFilter })
        .populate("client_id", "first_name last_name")
        .sort({ createdAt: -1 })
        .lean();
    if (type === "all" || type === "debts")
      report.debts = await Debt.find({ created_at: dateFilter })
        .populate("client_id", "first_name last_name")
        .sort({ created_at: -1 })
        .lean();
    if (!Object.keys(report).length)
      return res.status(400).json({ error: "Unknown report type." });
    res.json(report);
  }),
);

router.get(
  "/jobs",
  asyncRoute(async (req, res) => {
    res.json(await JobMonitoring.find().sort({ job_name: 1 }).lean());
  }),
);

router.post(
  "/jobs/:name/status",
  asyncRoute(async (req, res) => {
    const statuses = ["ok", "running", "failed", "waiting"];
    const status = statuses.includes(req.body.status)
      ? req.body.status
      : "failed";
    await JobMonitoring.findOneAndUpdate(
      { job_name: req.params.name },
      {
        status,
        last_run: new Date(),
        error: String(req.body.error || "").slice(0, 500),
      },
      { upsert: true, new: true },
    );
    res.sendStatus(204);
  }),
);

module.exports = router;
