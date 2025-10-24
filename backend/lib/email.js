import nodemailer from "nodemailer";

export function makeTransport() {
  // Use real SMTP later; for dev you can use Mailtrap or Gmail App Password
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendPreviewEmail({ to, previewUrl }) {
  const transporter = makeTransport();
  await transporter.sendMail({
    from: process.env.MAIL_FROM || "ResumeAI <no-reply@resumeai.local>",
    to,
    subject: "Your free ResumeAI preview",
    html: `
      <p>Here’s your preview link:</p>
      <p><a href="${previewUrl}">${previewUrl}</a></p>
      <p>When you’re ready, get the full downloadable .docx for $10.</p>
    `,
  });
}

export async function sendFullDocEmail({ to, attachments = [] }) {
  const transporter = makeTransport();
  await transporter.sendMail({
    from: process.env.MAIL_FROM || "ResumeAI <no-reply@resumeai.local>",
    to,
    subject: "Your Resume is ready (.docx attached)",
    text: "Your full resume is attached.",
    attachments,
  });
}
