import nodemailer from "nodemailer";
import { env } from "./env.js";

const isDev = !env.SMTP_HOST;

let transporter: nodemailer.Transporter;

if (isDev) {
  // In dev, just log to console
  transporter = nodemailer.createTransport({
    jsonTransport: true,
  });
} else {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
}

export async function sendVerificationEmail(
  to: string,
  token: string
): Promise<void> {
  const verifyUrl = `${env.CLIENT_URL}/auth/verify-email?token=${token}`;

  const mailOptions = {
    from: '"OnlyPain" <noreply@onlypain.app>',
    to,
    subject: "Verify your OnlyPain account",
    html: `
      <div style="font-family: Inter, sans-serif; background: #111111; color: #f0f0f0; padding: 40px; border-radius: 8px;">
        <h1 style="color: #f0f0f0;">Welcome to OnlyPain</h1>
        <p style="color: #888888;">You're not alone. Click below to verify your email.</p>
        <a href="${verifyUrl}" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: hsl(340, 80%, 55%); color: white; text-decoration: none; border-radius: 6px;">
          Verify Email
        </a>
        <p style="color: #888888; margin-top: 24px; font-size: 12px;">This link expires in 24 hours.</p>
      </div>
    `,
  };

  if (isDev) {
    console.log(`\n📧 Verification email for ${to}:`);
    console.log(`   ${verifyUrl}\n`);
  }

  await transporter.sendMail(mailOptions);
}
