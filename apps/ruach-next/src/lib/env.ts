import { z } from "zod";

const Strict = z.object({
  // NextAuth / auth
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(24),

  // Strapi
  NEXT_PUBLIC_STRAPI_URL: z.string().url(),
  STRAPI_REVALIDATE_SECRET: z.string().min(16),
  STRAPI_EMAIL_CONFIRM_REDIRECT: z.string().url().optional(),
  STRAPI_CONTACT_TOKEN: z.string().optional(),
  STRAPI_CONTACT_COLLECTION: z.string().optional(),
  STRAPI_VOLUNTEER_TOKEN: z.string().optional(),
  STRAPI_VOLUNTEER_COLLECTION: z.string().optional(),
  STRAPI_TESTIMONY_TOKEN: z.string().optional(),
  STRAPI_TESTIMONY_COLLECTION: z.string().optional(),

  // Optional integrations
  STRAPI_API_TOKEN: z.string().optional(),
  CONVERTKIT_API_SECRET: z.string().optional(),
  UPSTASH_REDIS_URL: z.string().url().optional(),
  UPSTASH_REDIS_TOKEN: z.string().optional(),
  CONVERTKIT_API_KEY: z.string().optional(),
  CONVERTKIT_FORM_ID: z.string().optional(),
  NEXT_PUBLIC_CONVERTKIT_API_KEY: z.string().optional(),
  NEXT_PUBLIC_CONVERTKIT_FORM_ID: z.string().optional(),
  NEXT_PUBLIC_GIVEBUTTER_CAMPAIGN: z.string().optional(),

  // Social (public)
  NEXT_PUBLIC_TWITTER_URL: z.string().url().optional(),
  NEXT_PUBLIC_YOUTUBE_URL: z.string().url().optional(),
  NEXT_PUBLIC_INSTAGRAM_URL: z.string().url().optional(),

  // Rate limiting (optional)
  RATE_LIMIT_POINTS: z.string().optional(),
  RATE_LIMIT_DURATION: z.string().optional(),
});

const Relaxed = Strict.extend({
  // Defaults so dev/build doesn’t crash if you forgot .env.local
  NEXTAUTH_URL: z.string().url().default("http://localhost:3000"),
  NEXTAUTH_SECRET: z.string().min(10).optional(), // required only in prod
  STRAPI_REVALIDATE_SECRET: z.string().min(1).optional(),
  NEXT_PUBLIC_STRAPI_URL: z
    .string()
    .url()
    .default("http://localhost:1337"),
});

function isStrict() {
  // Strict when actually deploying or when explicitly forced
  return process.env.NODE_ENV === "production" || process.env.FORCE_STRICT_ENV === "true";
}

export const env = (() => {
  const schema = isStrict() ? Strict : Relaxed;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n - ");
    throw new Error("❌ Missing/invalid env vars:\n - " + issues);
  }
  return parsed.data;
})();
