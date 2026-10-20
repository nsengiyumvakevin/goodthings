const express = require("express");
const { CartItem, Product, SalesReturn } = require("../../models");
const authenticate = require("../middleware/authenticate");
const asyncRoute = require("../utils/asyncRoute");

const router = express.Router();
router.use(authenticate(["admin"]));

router.get(
  "/returns",
  asyncRoute(async (req, res) => {
    res.json(
      await SalesReturn.find()
        .populate("client_id", "first_name last_name email")
        .sort({ createdAt: -1 })
        .lean(),
    );
  }),
);

router.patch(
  "/returns/:id",
  asyncRoute(async (req, res) => {
    const { status } = req.body;
    if (!["approved", "rejected"].includes(status))
      return res
        .status(400)
        .json({ error: "Return status must be approved or rejected." });
    const salesReturn = await SalesReturn.findOne({
      _id: req.params.id,
      status: "pending",
    });
    if (!salesReturn)
      return res.status(404).json({ error: "Pending return not found." });
    if (status === "approved") {
      const itemUpdate = await CartItem.updateOne(
        {
          _id: salesReturn.cart_item_id,
          $expr: {
            $lte: [
              { $add: ["$returned_quantity", salesReturn.quantity] },
              "$quantity",
            ],
          },
        },
        { $inc: { returned_quantity: salesReturn.quantity } },
      );
      if (!itemUpdate.modifiedCount)
        return res
          .status(409)
          .json({ error: "The purchased quantity has already been returned." });
      const item = await CartItem.findById(salesReturn.cart_item_id);
      if (item)
        await Product.updateOne(
          { _id: item.product_id },
          { $inc: { stock_quantity: salesReturn.quantity } },
        );
    }
    salesReturn.status = status;
    await salesReturn.save();
    res.json(salesReturn);
  }),
);

module.exports = router;
