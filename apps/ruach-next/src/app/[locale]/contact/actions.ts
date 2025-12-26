// apps/ruach-next/src/app/[locale]/contact/actions.ts
"use server";

import { z } from "zod";
import { headers } from "next/headers";
import sgMail from "@sendgrid/mail";

const ContactFormSchema = z.object({
  intent: z.enum(["invite", "prayer", "partnership", "testimony"]),
  name: z.string().min(2).max(80),
  email: z.string().email().max(120),
  phone: z.string().max(40).optional().or(z.literal("")),
  // Intent-specific fields
  churchName: z.string().max(200).optional().or(z.literal("")),
  eventType: z.string().max(200).optional().or(z.literal("")),
  eventDate: z.string().max(100).optional().or(z.literal("")),
  partnershipType: z.string().max(200).optional().or(z.literal("")),
  testimonyType: z.string().max(200).optional().or(z.literal("")),
  // Universal message field
  message: z.string().min(10).max(5000),
  // Honeypot
  website: z.string().max(200).optional().or(z.literal("")),
});

type FormState =
  | { ok: true }
  | { ok: false; fieldErrors?: Record<string, string>; message?: string };

const ipBucket = new Map<string, { count: number; resetAt: number }>();

function rateLimit(ip: string) {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 minutes
  const limit = 5; // requests per window

  const entry = ipBucket.get(ip);
  if (!entry || entry.resetAt < now) {
    ipBucket.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }
  if (entry.count >= limit) return { allowed: false };
  entry.count += 1;
  return { allowed: true };
}

function requireEnv(key: string) {
  const v = process.env[key];
  if (!v) throw new Error(`${key} is required`);
  return v;
}

function getIntentDetails(intent: string) {
  switch (intent) {
    case "invite":
      return {
        label: "Invite Ruach to Event/Outreach",
        toEmail: process.env.NEXT_PUBLIC_CONTACT_EVENTS_EMAIL ?? "events@joinruach.org",
        subject: "Event/Outreach Invitation Inquiry",
      };
    case "prayer":
      return {
        label: "Prayer Request",
        toEmail: process.env.PRAYER_TEAM_EMAIL ?? "hello@joinruach.org",
        subject: "Prayer Request via Contact Form",
      };
    case "partnership":
      return {
        label: "Partnership Question",
        toEmail: process.env.NEXT_PUBLIC_CONTACT_PARTNERS_EMAIL ?? "partners@joinruach.org",
        subject: "Partnership Inquiry",
      };
    case "testimony":
      return {
        label: "Media/Testimony Submission",
        toEmail: process.env.NEXT_PUBLIC_CONTACT_STORIES_EMAIL ?? "stories@joinruach.org",
        subject: "Testimony/Media Submission",
      };
    default:
      return {
        label: "General Inquiry",
        toEmail: "hello@joinruach.org",
        subject: "Contact Form Submission",
      };
  }
}

export async function submitContactForm(_: FormState, formData: FormData): Promise<FormState> {
  const raw = {
    intent: String(formData.get("intent") ?? ""),
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    churchName: String(formData.get("churchName") ?? "").trim(),
    eventType: String(formData.get("eventType") ?? "").trim(),
    eventDate: String(formData.get("eventDate") ?? "").trim(),
    partnershipType: String(formData.get("partnershipType") ?? "").trim(),
    testimonyType: String(formData.get("testimonyType") ?? "").trim(),
    message: String(formData.get("message") ?? "").trim(),
    website: String(formData.get("website") ?? "").trim(),
  };

  // Honeypot hit → pretend success
  if (raw.website) return { ok: true };

  const parsed = ContactFormSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] = issue.message;
    }
    return { ok: false, fieldErrors, message: "Please fix the highlighted fields." };
  }

  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim();

  const rl = rateLimit(ip);
  if (!rl.allowed) {
    return {
      ok: false,
      message: "Too many requests. Please wait a bit and try again.",
    };
  }

  const apiKey = requireEnv("SENDGRID_API_KEY");
  const from = requireEnv("EMAIL_FROM");
  sgMail.setApiKey(apiKey);

  const intentDetails = getIntentDetails(parsed.data.intent);

  // Build internal email body
  const internalLines = [
    `New ${intentDetails.label}`,
    ``,
    `Name: ${parsed.data.name}`,
    `Email: ${parsed.data.email}`,
    parsed.data.phone ? `Phone: ${parsed.data.phone}` : ``,
    parsed.data.churchName ? `Church/Organization: ${parsed.data.churchName}` : ``,
    parsed.data.eventType ? `Event Type: ${parsed.data.eventType}` : ``,
    parsed.data.eventDate ? `Event Date: ${parsed.data.eventDate}` : ``,
    parsed.data.partnershipType ? `Partnership Interest: ${parsed.data.partnershipType}` : ``,
    parsed.data.testimonyType ? `Testimony Type: ${parsed.data.testimonyType}` : ``,
    ip ? `IP: ${ip}` : ``,
    ``,
    `Message:`,
    parsed.data.message,
  ]
    .filter(Boolean)
    .join("\n");

  // 1) Internal email to appropriate department
  await sgMail.send({
    to: intentDetails.toEmail,
    from,
    replyTo: parsed.data.email,
    subject: `${intentDetails.subject} — ${parsed.data.name}`,
    text: internalLines,
  });

  // 2) Auto-response to sender
  await sgMail.send({
    to: parsed.data.email,
    from,
    subject: `We received your message — Ruach Ministries`,
    text: [
      `Hi ${parsed.data.name},`,
      ``,
      `Thank you for reaching out to Ruach Ministries.`,
      ``,
      `We received your ${intentDetails.label.toLowerCase()} and our team will respond within a few days. Every message is prayed over and handled with care.`,
      ``,
      `— Ruach Ministries`,
      `${process.env.SITE_URL ?? "https://joinruach.org"}`,
    ].join("\n"),
  });

  return { ok: true };
}
