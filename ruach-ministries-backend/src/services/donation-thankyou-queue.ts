import type { Core } from "@strapi/strapi";
import { Queue, Worker, type Job } from "bullmq";
import IORedis, { type RedisOptions } from "ioredis";

type ThankYouJob = {
  stripeSessionId: string;
};

let queue: Queue<ThankYouJob> | null = null;
let worker: Worker<ThankYouJob> | null = null;

const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379", 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;
const REDIS_TLS = process.env.REDIS_TLS === "true";

function createRedisConnection() {
  const options: RedisOptions = {
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD,
    maxRetriesPerRequest: null,
  };
  if (REDIS_TLS) {
    options.tls = {};
  }
  return new IORedis(options);
}

function formatMoney(cents: number, currency: string) {
  const amount = cents / 100;
  const upper = currency.toUpperCase();
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: upper,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${upper}`;
  }
}

async function sendThankYouEmail(strapi: Core.Strapi, to: string, amountCents: number, currency: string) {
  const emailService = strapi.plugin("email").service("email");
  const formatted = formatMoney(amountCents, currency);

  const subject = "Thank you for standing with Ruach";
  const text = [
    "Thank you for standing with us.",
    "",
    `We received your gift of ${formatted}.`,
    "",
    "Your generosity helps fuel testimonies, formation, and outreach that cannot be centralized or controlled.",
    "We’re honored to steward what you’ve entrusted.",
    "",
    "With gratitude,",
    "Ruach Ministries",
  ].join("\n");

  await emailService.send({
    to,
    subject,
    text,
  });
}

export async function initializeDonationThankYouQueue({ strapi }: { strapi: Core.Strapi }) {
  if (queue && worker) return;

  try {
    const connection = createRedisConnection();
    const queueName = "donation-thankyou";

    queue = new Queue<ThankYouJob>(queueName, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 30_000 },
        removeOnComplete: { count: 250, age: 24 * 3600 },
        removeOnFail: { count: 500, age: 7 * 24 * 3600 },
      },
    });

    worker = new Worker<ThankYouJob>(
      queueName,
      async (job: Job<ThankYouJob>) => {
        const stripeSessionId = job.data?.stripeSessionId;
        if (!stripeSessionId) return;

        const donation = await strapi.db
          .query("api::donation.donation")
          .findOne({ where: { stripeSessionId } });

        if (!donation) return;
        if (donation.thankYouSentAt) return;
        if (!donation.email) return;

        try {
          await sendThankYouEmail(strapi, donation.email, donation.amount, donation.currency);
          await (strapi.entityService as any).update("api::donation.donation", donation.id, {
            data: {
              thankYouSentAt: new Date(),
              thankYouLastError: null,
            } as any,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";
          await (strapi.entityService as any).update("api::donation.donation", donation.id, {
            data: {
              thankYouLastError: message,
            } as any,
          });
          throw error;
        }
      },
      { connection, concurrency: 2 }
    );

    worker.on("failed", (job, err) => {
      strapi.log.error(`[donation-thankyou] Job ${job?.id} failed`, err);
    });

    strapi.log.info("✅ Donation thank-you queue initialized");
  } catch (error) {
    strapi.log.error("❌ Failed to initialize donation thank-you queue", error);
  }
}

export async function enqueueDonationThankYouEmail(
  strapi: Core.Strapi,
  stripeSessionId: string
) {
  if (!queue) {
    strapi.log.warn("[donation-thankyou] Queue not initialized; skipping enqueue");
    return;
  }

  const donation = await strapi.db
    .query("api::donation.donation")
    .findOne({ where: { stripeSessionId } });
  if (!donation) return;
  if (donation.thankYouSentAt) return;

  const baseDelayMs = 10 * 60_000;
  const jitterMs = Math.floor(Math.random() * 5 * 60_000);
  const delay = baseDelayMs + jitterMs;

  const jobId = `donation-thankyou:${stripeSessionId}`;
  await queue.add(
    "send",
    { stripeSessionId },
    {
      jobId,
      delay,
    }
  );

  if (!donation.thankYouQueuedAt) {
    await (strapi.entityService as any).update("api::donation.donation", donation.id, {
      data: { thankYouQueuedAt: new Date() } as any,
    });
  }
}
