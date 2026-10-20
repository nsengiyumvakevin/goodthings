const crypto = require("node:crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const express = require("express");
const { Client, Admin } = require("../../models");
const asyncRoute = require("../utils/asyncRoute");
const { sendEmail } = require("../services/email.service");
const authenticate = require("../middleware/authenticate");

const router = express.Router();

function createToken(account, role) {
  if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
    throw Object.assign(
      new Error("JWT_SECRET must be configured in production."),
      { status: 503 },
    );
  }
  return jwt.sign(
    { sub: String(account._id), role },
    process.env.JWT_SECRET || "local-development-secret-change-me",
    { expiresIn: "12h" },
  );
}

function serializeClient(client) {
  return {
    id: client._id,
    first_name: client.first_name,
    last_name: client.last_name,
    email: client.email,
  };
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

router.post(
  "/register",
  asyncRoute(async (req, res) => {
    const { first_name, last_name, email, password } = req.body;
    if (
      ![first_name, last_name, email, password].every(
        (value) => typeof value === "string" && value.trim(),
      )
    ) {
      return res
        .status(400)
        .json({
          error: "First name, last name, email, and password are required.",
        });
    }
    if (password.length < 8)
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters." });
    const client = await Client.create({
      first_name,
      last_name,
      email,
      password_hash: await bcrypt.hash(password, 12),
    });
    res
      .status(201)
      .json({
        token: createToken(client, "client"),
        user: serializeClient(client),
        role: "client",
      });
  }),
);

router.post(
  "/login",
  asyncRoute(async (req, res) => {
    const username = String(req.body.username || req.body.email || "").trim();
    const email = username.toLowerCase();
    const nameParts = username.split(/\s+/);
    const client = await Client.findOne(
      nameParts.length > 1
        ? {
            first_name: new RegExp(`^${escapeRegex(nameParts[0])}$`, "i"),
            last_name: new RegExp(
              `^${escapeRegex(nameParts.slice(1).join(" "))}$`,
              "i",
            ),
          }
        : { email },
    );
    if (
      !client ||
      !(await bcrypt.compare(
        String(req.body.password || ""),
        client.password_hash,
      ))
    ) {
      return res.status(401).json({ error: "Email or password is incorrect." });
    }
    res.json({
      token: createToken(client, "client"),
      user: serializeClient(client),
      role: "client",
    });
  }),
);

router.post(
  "/admin/login",
  asyncRoute(async (req, res) => {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const admin = await Admin.findOne({ email });
    if (
      !admin ||
      !(await bcrypt.compare(
        String(req.body.password || ""),
        admin.password_hash,
      ))
    ) {
      return res.status(401).json({ error: "Email or password is incorrect." });
    }
    res.json({
      token: createToken(admin, "admin"),
      user: { id: admin._id, full_name: admin.full_name, email: admin.email },
      role: "admin",
    });
  }),
);

router.get(
  "/me",
  authenticate(),
  asyncRoute(async (req, res) => {
    if (req.auth.role === "client") {
      const client = await Client.findById(req.auth.sub);
      if (!client)
        return res.status(401).json({ error: "Client account not found." });
      return res.json({ ...serializeClient(client), role: "client" });
    }
    if (req.auth.role === "admin") {
      const admin = await Admin.findById(req.auth.sub);
      if (!admin)
        return res
          .status(401)
          .json({ error: "Administrator account not found." });
      return res.json({
        id: admin._id,
        full_name: admin.full_name,
        email: admin.email,
        role: "admin",
      });
    }
    return res.status(403).json({ error: "This account has no workspace role." });
  }),
);

router.post(
  "/forgot-password",
  asyncRoute(async (req, res) => {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const client = await Client.findOne({ email });
    const response = {
      message:
        "If the account exists, password reset instructions have been sent.",
    };
    if (!client) return res.json(response);

    const token = crypto.randomBytes(32).toString("hex");
    client.reset_token_hash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");
    client.reset_token_expires_at = new Date(Date.now() + 30 * 60 * 1000);
    await client.save();
    const appUrl = process.env.APP_URL || "http://localhost:5173";
    try {
      await sendEmail({
        to: client.email,
        subject: "Reset your password",
        text: `Use this one-time reset token within 30 minutes: ${token}\n\nReset page: ${appUrl}/?reset=${token}`,
      });
    } catch (error) {
      if (process.env.NODE_ENV === "production") throw error;
      response.development_reset_token = token;
    }
    res.json(response);
  }),
);

router.post(
  "/reset-password",
  asyncRoute(async (req, res) => {
    const { token, password } = req.body;
    if (typeof password !== "string" || password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters." });
    }
    const tokenHash = crypto
      .createHash("sha256")
      .update(String(token || ""))
      .digest("hex");
    const client = await Client.findOne({
      reset_token_hash: tokenHash,
      reset_token_expires_at: { $gt: new Date() },
    });
    if (!client)
      return res
        .status(400)
        .json({ error: "This reset link is invalid or has expired." });
    client.password_hash = await bcrypt.hash(password, 12);
    client.reset_token_hash = undefined;
    client.reset_token_expires_at = undefined;
    await client.save();
    res.json({ message: "Password updated. You can now sign in." });
  }),
);

module.exports = router;
