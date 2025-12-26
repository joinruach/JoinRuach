// apps/ruach-next/src/lib/email/sendPrayerRequest.ts
import sgMail from "@sendgrid/mail";

type Payload = {
  name: string;
  email: string;
  phone?: string;
  request: string;
  followUpConsent: boolean;
  ip?: string;
  userAgent?: string;
};

function requireEnv(key: string) {
  const v = process.env[key];
  if (!v) throw new Error(`${key} is required`);
  return v;
}

export async function sendPrayerRequestEmails(payload: Payload) {
  const apiKey = requireEnv("SENDGRID_API_KEY");
  const from = requireEnv("EMAIL_FROM"); // e.g. "Ruach Ministries <hello@joinruach.org>"
  const prayerTeam = requireEnv("PRAYER_TEAM_EMAIL"); // e.g. "hello@joinruach.org" or "prayer@joinruach.org"

  sgMail.setApiKey(apiKey);

  const internalText = [
    `New prayer request received`,
    ``,
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
    payload.phone ? `Phone: ${payload.phone}` : `Phone: (none)`,
    `Follow-up consent: ${payload.followUpConsent ? "YES" : "NO"}`,
    payload.ip ? `IP: ${payload.ip}` : ``,
    payload.userAgent ? `UA: ${payload.userAgent}` : ``,
    ``,
    `Request:`,
    payload.request,
  ]
    .filter(Boolean)
    .join("\n");

  // 1) Internal email to prayer team
  await sgMail.send({
    to: prayerTeam,
    from,
    replyTo: payload.email,
    subject: `Prayer Request — ${payload.name}${payload.followUpConsent ? " (Follow-up OK)" : ""}`,
    text: internalText,
  });

  // 2) Auto-response to requester
  await sgMail.send({
    to: payload.email,
    from,
    subject: "We received your prayer request — Ruach Ministries",
    text: [
      `Hi ${payload.name},`,
      ``,
      `We received your prayer request and our team will pray.`,
      payload.followUpConsent
        ? `You indicated you'd like follow-up, so we may reach out soon.`
        : `If you'd like follow-up, you can resubmit with consent checked.`,
      ``,
      `— Ruach Ministries`,
      `Privacy: ${process.env.SITE_URL ?? "https://joinruach.org"}/privacy`,
    ].join("\n"),
  });
}
