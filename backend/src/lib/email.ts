import { Resend } from "resend";
import { env } from "./env.js";
import { logger } from "./logger.js";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

function shell(title: string, body: string, cta?: { label: string; url: string }) {
  return `
  <div style="background:#141118;padding:40px 16px;font-family:'DM Sans',Inter,system-ui,sans-serif;color:#f2ecf4">
    <div style="max-width:520px;margin:0 auto;background:#1c1822;border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:36px">
      <div style="font-size:22px;font-weight:600;letter-spacing:-.01em;margin-bottom:6px">only<span style="color:#f2905f">pain</span></div>
      <h1 style="font-size:20px;margin:18px 0 10px;font-weight:600">${title}</h1>
      <div style="color:#bdb4c4;font-size:15px;line-height:1.6">${body}</div>
      ${
        cta
          ? `<a href="${cta.url}" style="display:inline-block;margin-top:24px;padding:12px 22px;background:#f2905f;color:#2b1409;text-decoration:none;border-radius:999px;font-weight:600">${cta.label}</a>`
          : ""
      }
      <p style="color:#7d7386;font-size:12px;margin-top:28px">You're not alone. If you're in crisis, please reach out to a helpline — in India, call 14416 (Tele-MANAS).</p>
    </div>
  </div>`;
}

async function deliver(to: string, subject: string, html: string, debugLink?: string) {
  if (!resend) {
    logger.info({ to, subject, link: debugLink }, "📧 email (console transport)");
    return;
  }
  const { error } = await resend.emails.send({ from: env.EMAIL_FROM, to, subject, html });
  if (error) logger.error({ error, to, subject }, "email send failed");
}

export async function sendVerificationEmail(to: string, token: string) {
  const url = `${env.CLIENT_URL}/verify-email?token=${token}`;
  await deliver(
    to,
    "Verify your email — only pain",
    shell(
      "Welcome. Let's make sure this is you.",
      "Verifying your email lets you reset your password later and keeps the community a little safer. This link is good for 24 hours.",
      { label: "Verify email", url }
    ),
    url
  );
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const url = `${env.CLIENT_URL}/reset-password?token=${token}`;
  await deliver(
    to,
    "Reset your password — only pain",
    shell(
      "Reset your password",
      "Someone (hopefully you) asked to reset the password for this account. The link expires in 1 hour. If it wasn't you, you can ignore this email.",
      { label: "Choose a new password", url }
    ),
    url
  );
}
