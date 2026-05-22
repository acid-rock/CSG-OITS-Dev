import nodemailer from "nodemailer";

/**
 * Lazy-initialized nodemailer transport.
 * Returns null (and logs a warning) when SMTP env vars are not configured
 * so the application can start without email being set up.
 */
let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  _transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true", // true for port 465, false for 587
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  return _transporter;
}

/**
 * Send an email. Never throws.
 * Returns true if the email was accepted by the SMTP server, false otherwise.
 * Logs all failures so they are visible in server output.
 *
 * @param {{ to: string, subject: string, html: string }} options
 * @returns {Promise<boolean>}
 */
export async function sendEmail({ to, subject, html }) {
  const transporter = getTransporter();

  if (!transporter) {
    console.warn(
      "[MAILER] SMTP not configured (SMTP_HOST / SMTP_USER / SMTP_PASS missing) — skipping email to:",
      to,
    );
    return false;
  }

  try {
    const from =
      process.env.SMTP_FROM ||
      `"Central Student Government – OITS" <${process.env.SMTP_USER}>`;

    const info = await transporter.sendMail({ from, to, subject, html });
    console.log(`[MAILER] ✓ Sent "${subject}" → ${to}  (id: ${info.messageId})`);
    return true;
  } catch (err) {
    // Common causes:
    //   • Gmail: SMTP_PASS must be a 16-char App Password (not account password)
    //     Generate one at: myaccount.google.com/apppasswords
    //   • Google Workspace: admin must allow "Less secure app access" or App Passwords
    console.error(
      `[MAILER] ✗ Failed to send "${subject}" → ${to}:`,
      err.message,
    );
    return false;
  }
}
