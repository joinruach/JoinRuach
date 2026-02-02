import { Worker, Queue, Job } from "bullmq";
import { Redis } from "@upstash/redis";

// Job types
type JobType = "INGEST_CONTENT" | "REINDEX_LOCALE" | "PROCESS_TRANSCRIPT";

interface IngestContentData {
  contentType: string;
  contentId: string;
  locale: string;
}

interface ReindexLocaleData {
  locale: string;
}

interface ProcessTranscriptData {
  videoId: string;
  videoUrl: string;
}

type JobData = IngestContentData | ReindexLocaleData | ProcessTranscriptData;

// Redis connection
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Queue for AI jobs
const aiQueue = new Queue("ai-jobs", {
  connection: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
  },
});

/**
 * Process content for embeddings
 */
async function processIngestContent(job: Job<IngestContentData>): Promise<void> {
  const { contentType, contentId, locale } = job.data;
  console.log(`[INGEST] Processing ${contentType}:${contentId} (${locale})`);

  // TODO: Implement
  // 1. Fetch content from Strapi
  // 2. Chunk the content
  // 3. Generate embeddings
  // 4. Store in vector database

  await job.updateProgress(100);
}

/**
 * Reindex all content for a locale
 */
async function processReindexLocale(job: Job<ReindexLocaleData>): Promise<void> {
  const { locale } = job.data;
  console.log(`[REINDEX] Reindexing all content for ${locale}`);

  // TODO: Implement
  // 1. Fetch all content for locale
  // 2. Queue individual ingest jobs

  await job.updateProgress(100);
}

/**
 * Process video transcript
 */
async function processTranscript(job: Job<ProcessTranscriptData>): Promise<void> {
  const { videoId, videoUrl } = job.data;
  console.log(`[TRANSCRIPT] Processing ${videoId}`);

  // TODO: Implement
  // 1. Download/fetch transcript
  // 2. Clean and format
  // 3. Store for RAG

  await job.updateProgress(100);
}

// Worker processor
const worker = new Worker<JobData>(
  "ai-jobs",
  async (job: Job<JobData>) => {
    console.log(`[WORKER] Processing job ${job.id} (${job.name})`);

    switch (job.name as JobType) {
      case "INGEST_CONTENT":
        await processIngestContent(job as Job<IngestContentData>);
        break;
      case "REINDEX_LOCALE":
        await processReindexLocale(job as Job<ReindexLocaleData>);
        break;
      case "PROCESS_TRANSCRIPT":
        await processTranscript(job as Job<ProcessTranscriptData>);
        break;
      default:
        console.warn(`[WORKER] Unknown job type: ${job.name}`);
    }
  },
  {
    connection: {
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
    },
    concurrency: 3,
  }
);

// Event handlers
worker.on("completed", (job) => {
  console.log(`[WORKER] Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`[WORKER] Job ${job?.id} failed:`, err);
});

console.log("🚀 Ruach AI Worker started");
console.log("   Waiting for jobs...");

// Graceful shutdown
type MinimalNodeProcess = {
  on: (event: "SIGTERM" | "SIGINT", listener: () => void | Promise<void>) => void;
  exit: (code?: number) => never;
};

const nodeProcess = process as unknown as MinimalNodeProcess;

nodeProcess.on("SIGTERM", async () => {
  console.log("[WORKER] Shutting down...");
  await worker.close();
  nodeProcess.exit(0);
});

export { aiQueue };
