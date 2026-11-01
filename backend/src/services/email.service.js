const nodemailer = require("nodemailer");
const { JobMonitoring } = require("../../models");

function getTransportConfig() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const service = process.env.SMTP_SERVICE;
  const host = process.env.SMTP_HOST;

  if (service) {
    return { service, auth: user ? { user, pass } : undefined };
  }
  if (!host && user) {
    return { service: "gmail", auth: { user, pass } };
  }
  if (!host) return null;
  return {
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: user ? { user, pass } : undefined,
  };
}

function getTransport() {
  const config = getTransportConfig();
  if (!config) return null;
  return nodemailer.createTransport(config);
}

function getFromAddress() {
  return process.env.SMTP_FROM || process.env.SMTP_USER || "";
}

async function sendEmail({ to, subject, text }) {
  const transport = getTransport();
  const from = getFromAddress();
  if (!transport || !from) {
    throw Object.assign(
      new Error(
        "Email is not configured. Set SMTP_SERVICE=gmail with SMTP_USER and SMTP_PASSWORD, or set SMTP_HOST and SMTP_FROM in backend/.env.",
      ),
      { status: 503 },
    );
  }
  return transport.sendMail({ from, to, subject, text });
}

async function updateJob(jobName, status, error = "") {
  return JobMonitoring.findOneAndUpdate(
    { job_name: jobName },
    { status, last_run: new Date(), error },
    { upsert: true, new: true },
  );
}

module.exports = { sendEmail, updateJob };
