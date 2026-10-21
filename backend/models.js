const mongoose = require("mongoose");

const { Schema } = mongoose;

const clientSchema = new Schema(
  {
    first_name: { type: String, required: true, trim: true },
    last_name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password_hash: { type: String, required: true },
    reset_token_hash: String,
    reset_token_expires_at: Date,
  },
  {
    collection: "clients",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  },
);

const adminSchema = new Schema(
  {
    full_name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password_hash: { type: String, required: true },
  },
  {
    collection: "admins",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  },
);

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    category: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    stock_quantity: { type: Number, required: true, min: 0, default: 0 },
    image_url: { type: String, default: "" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  {
    collection: "products",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  },
);

const cartItemSchema = new Schema(
  {
    client_id: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },
    product_id: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, min: 1, required: true },
    unit_price: { type: Number, min: 0, required: true },
    returned_quantity: { type: Number, min: 0, default: 0 },
    status: {
      type: String,
      enum: ["in_cart", "pending", "paid", "debt", "returned"],
      default: "in_cart",
    },
    payment_id: { type: Schema.Types.ObjectId, ref: "Payment", default: null },
    added_at: { type: Date, default: Date.now },
  },
  { collection: "cart_items" },
);

const paymentSchema = new Schema(
  {
    client_id: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    method: {
      type: String,
      enum: ["mobile_money", "cash", "debt"],
      required: true,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "paid",
        "failed",
        "expired",
        "unpaid",
        "partial",
        "overdue",
        "refunded",
      ],
      default: "pending",
    },
    debt_id: { type: Schema.Types.ObjectId, ref: "Debt" },
    bill_id: { type: String, unique: true, sparse: true, index: true },
    expires_at: Date,
    momo_requested_at: Date,
    due_date: Date,
    paid_at: Date,
    reference: { type: String, unique: true, sparse: true },
  },
  { collection: "payments", timestamps: true },
);

const debtSchema = new Schema(
  {
    payment_id: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
      unique: true,
    },
    client_id: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },
    total_amount: { type: Number, required: true, min: 0 },
    amount_paid: { type: Number, default: 0, min: 0 },
    balance: { type: Number, required: true, min: 0 },
    period_days: { type: Number, required: true, min: 1 },
    due_date: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "unpaid", "partial", "overdue", "settled", "rejected", "expired"],
      default: "unpaid",
    },
    review_status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "expired"],
      default: "accepted",
    },
    last_reminder_sent_at: Date,
    settled_at: Date,
  },
  {
    collection: "debts",
    timestamps: { createdAt: "created_at", updatedAt: false },
  },
);

const ledgerSchema = new Schema({
  amount: { type: Number, required: true, min: 0 },
  description: { type: String, required: true, trim: true },
  recorded_by: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
  payment_id: {
    type: Schema.Types.ObjectId,
    ref: "Payment",
    unique: true,
    sparse: true,
  },
  date: { type: Date, default: Date.now },
});

const salesReturnSchema = new Schema(
  {
    payment_id: { type: Schema.Types.ObjectId, ref: "Payment", required: true },
    client_id: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    product: { type: String, required: true },
    reason: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    cart_item_id: {
      type: Schema.Types.ObjectId,
      ref: "CartItem",
      required: true,
    },
    quantity: { type: Number, required: true, min: 1 },
  },
  { collection: "sales_return", timestamps: true },
);

const jobMonitoringSchema = new Schema(
  {
    job_name: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ["ok", "running", "failed", "waiting"],
      default: "ok",
    },
    last_run: Date,
    error: { type: String, default: "" },
  },
  { collection: "job_monitoring" },
);

const notificationSchema = new Schema(
  {
    admin_id: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true,
    },
    payment_id: { type: Schema.Types.ObjectId, ref: "Payment", required: true },
    client_id: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    message: { type: String, required: true },
    read_at: Date,
  },
  { collection: "admin_notifications", timestamps: true },
);

module.exports = {
  Client: mongoose.model("Client", clientSchema),
  Admin: mongoose.model("Admin", adminSchema),
  Product: mongoose.model("Product", productSchema),
  CartItem: mongoose.model("CartItem", cartItemSchema),
  Payment: mongoose.model("Payment", paymentSchema),
  Debt: mongoose.model("Debt", debtSchema),
  Income: mongoose.model("Income", ledgerSchema, "income"),
  Outcome: mongoose.model("Outcome", ledgerSchema, "outcome"),
  SalesReturn: mongoose.model("SalesReturn", salesReturnSchema),
  JobMonitoring: mongoose.model("JobMonitoring", jobMonitoringSchema),
  Notification: mongoose.model("Notification", notificationSchema),
};
