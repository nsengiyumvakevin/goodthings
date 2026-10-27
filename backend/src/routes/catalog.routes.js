const express = require("express");
const { Product } = require("../../models");
const asyncRoute = require("../utils/asyncRoute");
const authenticate = require("../middleware/authenticate");

const router = express.Router();

router.get(
  "/products",
  asyncRoute(async (req, res) => {
    const filter = { status: "active" };
    if (req.query.category && req.query.category !== "All")
      filter.category = req.query.category;
    if (req.query.search)
      filter.name = {
        $regex: String(req.query.search).slice(0, 80),
        $options: "i",
      };
    res.json(await Product.find(filter).sort({ created_at: -1 }).lean());
  }),
);

router.get(
  "/admin/products",
  authenticate(["admin"]),
  asyncRoute(async (req, res) => {
    res.json(
      await Product.find()
        .select("+cost_price")
        .sort({ created_at: -1 })
        .lean(),
    );
  }),
);

router.post(
  "/admin/products",
  authenticate(["admin"]),
  asyncRoute(async (req, res) => {
    const created = await Product.create(req.body);
    res
      .status(201)
      .json(await Product.findById(created._id).select("+cost_price").lean());
  }),
);

router.patch(
  "/admin/products/:id",
  authenticate(["admin"]),
  asyncRoute(async (req, res) => {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).select("+cost_price");
    if (!product) return res.status(404).json({ error: "Product not found." });
    res.json(product);
  }),
);

module.exports = router;
