// apps/ruach-next/src/app/[locale]/prayer/actions.ts
"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { sendPrayerRequestEmails } from "@/lib/email/sendPrayerRequest";

const PrayerRequestSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().max(120),
  phone: z.string().max(40).optional().or(z.literal("")),
  request: z.string().min(10).max(5000),
  followUpConsent: z.string().optional(), // "on" when checked
  // Honeypot (should be empty)
  website: z.string().max(200).optional().or(z.literal("")),
});

type FormState =
  | { ok: true }
  | { ok: false; fieldErrors?: Record<string, string>; message?: string };

const ipBucket = new Map<string, { count: number; resetAt: number }>();

function rateLimit(ip: string) {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 minutes
  const limit = 8; // requests per window

  const entry = ipBucket.get(ip);
  if (!entry || entry.resetAt < now) {
    ipBucket.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }
  if (entry.count >= limit) return { allowed: false };
  entry.count += 1;
  return { allowed: true };
}

export async function submitPrayerRequest(_: FormState, formData: FormData): Promise<FormState> {
  const raw = {
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    request: String(formData.get("request") ?? "").trim(),
    followUpConsent: String(formData.get("followUpConsent") ?? ""),
    website: String(formData.get("website") ?? "").trim(),
  };

  // Honeypot hit → pretend success (spam quietly dies)
  if (raw.website) return { ok: true };

  const parsed = PrayerRequestSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] = issue.message;
    }
    return { ok: false, fieldErrors, message: "Please fix the highlighted fields." };
  }

  const h = await headers();
  const ip =
    (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim();

  const rl = rateLimit(ip);
  if (!rl.allowed) {
    return {
      ok: false,
      message: "Too many requests. Please wait a bit and try again.",
    };
  }

  const followUp = parsed.data.followUpConsent === "on";

  await sendPrayerRequestEmails({
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone || undefined,
    request: parsed.data.request,
    followUpConsent: followUp,
    ip,
    userAgent: h.get("user-agent") ?? undefined,
  });

  return { ok: true };
}
