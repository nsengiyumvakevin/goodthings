const express = require("express");
const { Income, Outcome } = require("../../models");
const authenticate = require("../middleware/authenticate");
const asyncRoute = require("../utils/asyncRoute");

const router = express.Router();
router.use(authenticate(["admin"]));

function getLedger(type) {
  if (type === "income") return Income;
  if (type === "outcome") return Outcome;
  return null;
}

router.get(
  "/ledger/:type",
  asyncRoute(async (req, res) => {
    const Ledger = getLedger(req.params.type);
    if (!Ledger)
      return res
        .status(400)
        .json({ error: "Ledger type must be income or outcome." });
    res.json(
      await Ledger.find()
        .populate("recorded_by", "full_name")
        .sort({ date: -1 })
        .lean(),
    );
  }),
);

module.exports = router;
