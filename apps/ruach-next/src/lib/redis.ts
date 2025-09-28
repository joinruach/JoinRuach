import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

function isValidUrl(value?: string | null) {
  return typeof value === "string" && value.startsWith("https://");
}

let client: Redis | null = null;

if (isValidUrl(url) && token) {
  client = new Redis({ url, token });
} else if (process.env.NODE_ENV === "development") {
  console.warn("Upstash Redis env vars missing or invalid. Rate limiting disabled.");
}

export const redis = client;
export const isRedisEnabled = Boolean(client);
