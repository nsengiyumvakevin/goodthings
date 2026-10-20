const nodemailer = require("nodemailer");
const { JobMonitoring } = require("../../models");

function getTransport() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_FROM) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
  });
}

async function sendEmail({ to, subject, text }) {
  const transport = getTransport();
  if (!transport) {
    throw Object.assign(
      new Error(
        "Email is not configured. Set SMTP_HOST and SMTP_FROM in backend/.env.",
      ),
      { status: 503 },
    );
  }
  return transport.sendMail({ from: process.env.SMTP_FROM, to, subject, text });
}

async function updateJob(jobName, status, error = "") {
  return JobMonitoring.findOneAndUpdate(
    { job_name: jobName },
    { status, last_run: new Date(), error },
    { upsert: true, new: true },
  );
}

module.exports = { sendEmail, updateJob };
