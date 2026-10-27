const crypto = require("node:crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const express = require("express");
const { Client, Admin } = require("../../models");
const asyncRoute = require("../utils/asyncRoute");
const { sendEmail } = require("../services/email.service");
const authenticate = require("../middleware/authenticate");

const router = express.Router();

const RESET_CODE_TTL_MS = 10 * 60 * 1000;
const RESET_CODE_MAX_ATTEMPTS = 5;

function createResetCode() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, "0");
}

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
    const response = {
      message:
        "If the account exists, a 6-digit reset code has been sent to that email.",
    };
    const client = await Client.findOne({ email });
    if (!client) return res.json(response);

    const code = createResetCode();
    client.reset_code_hash = await bcrypt.hash(code, 10);
    client.reset_code_expires_at = new Date(Date.now() + RESET_CODE_TTL_MS);
    client.reset_code_attempts = 0;
    client.reset_code_used_at = undefined;
    await client.save();
    try {
      await sendEmail({
        to: client.email,
        subject: "Your password reset code",
        text: `Your Goodthings Market password reset code is ${code}.\n\nIt expires in 10 minutes and can only be used once. If you did not request this, you can ignore this email.`,
      });
    } catch (error) {
      if (process.env.NODE_ENV === "production") throw error;
      response.development_reset_code = code;
    }
    res.json(response);
  }),
);

router.post(
  "/reset-password",
  asyncRoute(async (req, res) => {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const code = String(req.body.code || "").trim();
    const { password } = req.body;
    const invalidMessage = "This reset code is invalid or has expired.";
    if (typeof password !== "string" || password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters." });
    }
    if (!/^\d{6}$/.test(code)) {
      return res
        .status(400)
        .json({ error: "Enter the 6-digit code sent to your email." });
    }
    const client = await Client.findOne({ email });
    if (
      !client ||
      !client.reset_code_hash ||
      client.reset_code_used_at ||
      !client.reset_code_expires_at ||
      client.reset_code_expires_at <= new Date()
    ) {
      return res.status(400).json({ error: invalidMessage });
    }
    if ((client.reset_code_attempts || 0) >= RESET_CODE_MAX_ATTEMPTS) {
      client.reset_code_hash = undefined;
      client.reset_code_expires_at = undefined;
      await client.save();
      return res
        .status(429)
        .json({ error: "Too many incorrect attempts. Request a new code." });
    }
    if (!(await bcrypt.compare(code, client.reset_code_hash))) {
      client.reset_code_attempts = (client.reset_code_attempts || 0) + 1;
      if (client.reset_code_attempts >= RESET_CODE_MAX_ATTEMPTS) {
        client.reset_code_hash = undefined;
        client.reset_code_expires_at = undefined;
        await client.save();
        return res
          .status(429)
          .json({ error: "Too many incorrect attempts. Request a new code." });
      }
      await client.save();
      return res
        .status(400)
        .json({ error: "The reset code is incorrect." });
    }
    client.password_hash = await bcrypt.hash(password, 12);
    client.reset_code_used_at = new Date();
    client.reset_code_hash = undefined;
    client.reset_code_expires_at = undefined;
    client.reset_code_attempts = 0;
    await client.save();
    res.json({ message: "Password updated. You can now sign in." });
  }),
);

module.exports = router;
