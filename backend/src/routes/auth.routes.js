const crypto = require("node:crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const express = require("express");
const { OAuth2Client } = require("google-auth-library");
const { Client, Admin } = require("../../models");
const asyncRoute = require("../utils/asyncRoute");
const { sendEmail } = require("../services/email.service");
const authenticate = require("../middleware/authenticate");
const {
  validateName,
  validateEmail,
  validatePassword,
} = require("../utils/validation");

const router = express.Router();

const RESET_CODE_TTL_MS = 10 * 60 * 1000;
const RESET_CODE_MAX_ATTEMPTS = 5;
const EMAIL_CODE_TTL_MS = 10 * 60 * 1000;
const EMAIL_CODE_MAX_ATTEMPTS = 5;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
let googleClient;

function createResetCode() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, "0");
}

function getGoogleClient() {
  if (!GOOGLE_CLIENT_ID) {
    throw Object.assign(
      new Error(
        "Google sign in is not configured. Set GOOGLE_CLIENT_ID in backend/.env.",
      ),
      { status: 503 },
    );
  }
  googleClient ||= new OAuth2Client(GOOGLE_CLIENT_ID);
  return googleClient;
}

async function sendEmailCode(client) {
  const code = createResetCode();
  client.email_code_hash = await bcrypt.hash(code, 10);
  client.email_code_expires_at = new Date(Date.now() + EMAIL_CODE_TTL_MS);
  client.email_code_attempts = 0;
  client.email_code_used_at = undefined;
  await client.save();
  const response = { email: client.email };
  try {
    await sendEmail({
      to: client.email,
      subject: "Verify your email address",
      text: `Your Goodthings Market verification code is ${code}.\n\nIt expires in 10 minutes and can only be used once. If you did not create this account, you can ignore this email.`,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "production") throw error;
    response.development_email_code = code;
  }
  return response;
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
    email_verified: Boolean(client.email_verified),
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
    const validationError =
      validateName(first_name, "First name") ||
      validateName(last_name, "Last name") ||
      validateEmail(email) ||
      validatePassword(password);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }
    const existing = await Client.findOne({ email: email.trim().toLowerCase() });
    if (existing) {
      return res
        .status(409)
        .json({ error: "An account with that email address already exists." });
    }
    const client = await Client.create({
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email,
      password_hash: await bcrypt.hash(password, 12),
      email_verified: false,
    });
    let verification;
    try {
      verification = await sendEmailCode(client);
    } catch (error) {
      await Client.deleteOne({ _id: client._id });
      throw error;
    }
    res.status(201).json({
      requires_email_verification: true,
      email: client.email,
      message:
        "We sent a 6-digit verification code to your email address. Enter it to finish creating your account.",
      ...(verification.development_email_code
        ? { development_email_code: verification.development_email_code }
        : {}),
    });
  }),
);

router.post(
  "/verify-email",
  asyncRoute(async (req, res) => {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const code = String(req.body.code || "").trim();
    const invalidMessage = "This verification code is invalid or has expired.";
    if (!/^\d{6}$/.test(code)) {
      return res
        .status(400)
        .json({ error: "Enter the 6-digit code sent to your email." });
    }
    const client = await Client.findOne({ email });
    if (!client || client.email_verified) {
      return res.status(400).json({ error: invalidMessage });
    }
    if (
      !client.email_code_hash ||
      client.email_code_used_at ||
      !client.email_code_expires_at ||
      client.email_code_expires_at <= new Date()
    ) {
      return res.status(400).json({ error: invalidMessage });
    }
    if ((client.email_code_attempts || 0) >= EMAIL_CODE_MAX_ATTEMPTS) {
      client.email_code_hash = undefined;
      client.email_code_expires_at = undefined;
      await client.save();
      return res
        .status(429)
        .json({ error: "Too many incorrect attempts. Request a new code." });
    }
    if (!(await bcrypt.compare(code, client.email_code_hash))) {
      client.email_code_attempts = (client.email_code_attempts || 0) + 1;
      if (client.email_code_attempts >= EMAIL_CODE_MAX_ATTEMPTS) {
        client.email_code_hash = undefined;
        client.email_code_expires_at = undefined;
        await client.save();
        return res
          .status(429)
          .json({ error: "Too many incorrect attempts. Request a new code." });
      }
      await client.save();
      return res
        .status(400)
        .json({ error: "The verification code is incorrect." });
    }
    client.email_verified = true;
    client.email_code_used_at = new Date();
    client.email_code_hash = undefined;
    client.email_code_expires_at = undefined;
    client.email_code_attempts = 0;
    await client.save();
    res.json({
      token: createToken(client, "client"),
      user: serializeClient(client),
      role: "client",
      email_verified: true,
    });
  }),
);

router.post(
  "/resend-verification",
  asyncRoute(async (req, res) => {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const response = {
      message:
        "If the account exists and is not verified, a new 6-digit code has been sent.",
    };
    const client = await Client.findOne({ email });
    if (!client || client.email_verified) return res.json(response);
    const verification = await sendEmailCode(client);
    if (verification.development_email_code)
      response.development_email_code = verification.development_email_code;
    res.json(response);
  }),
);

router.get("/google/config", (req, res) => {
  res.json({ client_id: GOOGLE_CLIENT_ID || null, enabled: Boolean(GOOGLE_CLIENT_ID) });
});

router.post(
  "/google",
  asyncRoute(async (req, res) => {
    const credential = String(req.body.credential || "");
    if (!credential) {
      return res.status(400).json({ error: "Google credential is required." });
    }
    let payload;
    try {
      const ticket = await getGoogleClient().verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (error) {
      if (error.status) throw error;
      return res
        .status(401)
        .json({ error: "Google sign in could not be verified." });
    }
    if (!payload?.email || !payload.email_verified) {
      return res
        .status(401)
        .json({ error: "Google did not provide a verified email address." });
    }
    const email = payload.email.toLowerCase();
    let client = await Client.findOne({ email });
    if (client) {
      client.google_id = payload.sub;
      client.email_verified = true;
      client.email_code_hash = undefined;
      client.email_code_expires_at = undefined;
      client.email_code_attempts = 0;
      await client.save();
    } else {
      const nameParts = String(payload.name || payload.email.split("@")[0])
        .trim()
        .split(/\s+/);
      client = await Client.create({
        first_name: nameParts[0] || "Google",
        last_name: nameParts.slice(1).join(" ") || "Customer",
        email,
        google_id: payload.sub,
        email_verified: true,
        password_hash: await bcrypt.hash(
          crypto.randomBytes(32).toString("hex"),
          12,
        ),
      });
    }
    res.json({
      token: createToken(client, "client"),
      user: serializeClient(client),
      role: "client",
      email_verified: true,
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
    if (!client.email_verified) {
      const verification = await sendEmailCode(client);
      return res.status(403).json({
        error:
          "Verify your email address before signing in. We sent you a new verification code.",
        code: "EMAIL_NOT_VERIFIED",
        email: client.email,
        requires_email_verification: true,
        ...(verification.development_email_code
          ? { development_email_code: verification.development_email_code }
          : {}),
      });
    }
    res.json({
      token: createToken(client, "client"),
      user: serializeClient(client),
      role: "client",
      email_verified: true,
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
    const passwordError =
      typeof password === "string" ? validatePassword(password) : "Password is required.";
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
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
