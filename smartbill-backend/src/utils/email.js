const nodemailer = require('nodemailer');

let cachedTransporter = null;

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) {
    cachedTransporter = null;
    return null;
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return cachedTransporter;
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendEmail({ to, subject, text, html }) {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@smartbill.local';

  if (!transporter) {
    console.log('───── EMAIL (no SMTP configured — log only) ─────');
    console.log(`To:      ${to}`);
    console.log(`From:    ${from}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${text}`);
    console.log('─────────────────────────────────────────────────');
    return { delivered: false, channel: 'console' };
  }

  await transporter.sendMail({ from, to, subject, text, html });
  return { delivered: true, channel: 'smtp' };
}

function passwordResetEmail({ name, code, minutes }) {
  const subject = 'Smart Bill: your password reset code';
  const text = `Hi ${name || 'there'},\n\nYour Smart Bill password reset code is: ${code}\n\nThis code expires in ${minutes} minutes. If you did not request a reset, ignore this email.\n\n— Smart Bill`;
  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;max-width:520px;margin:auto;padding:24px;color:#0f172a;">
      <h2 style="margin:0 0 12px;">Reset your Smart Bill password</h2>
      <p style="color:#475569;">Hi ${name || 'there'}, use the code below to set a new password.</p>
      <div style="margin:18px 0;padding:18px 22px;background:#eef2ff;border:1px solid #c7d2fe;border-radius:10px;text-align:center;">
        <div style="font-size:11px;color:#6366f1;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;">Verification code</div>
        <div style="font-size:28px;font-weight:700;letter-spacing:0.4em;color:#1e293b;">${code}</div>
      </div>
      <p style="color:#475569;font-size:13px;">This code expires in ${minutes} minutes. If you didn't request a reset, you can safely ignore this email.</p>
      <p style="color:#94a3b8;font-size:12px;margin-top:24px;">— Smart Bill</p>
    </div>
  `;
  return { subject, text, html };
}

module.exports = {
  generateCode,
  sendEmail,
  passwordResetEmail,
};
