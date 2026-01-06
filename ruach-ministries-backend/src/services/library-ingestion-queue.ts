import type { Core } from "@strapi/strapi";
import { Queue, Worker, type Job } from "bullmq";
import IORedis, { type RedisOptions } from "ioredis";
import { spawn } from "child_process";
import path from "path";

type LibraryIngestionJob = {
  sourceId: string;
  versionId: string;
  fileUrl: string;
  fileType: "pdf" | "epub";
  ingestionParams: {
    maxChars: number;
    maxTokens: number;
    includeToc: boolean;
  };
};

let queue: Queue<LibraryIngestionJob> | null = null;
let worker: Worker<LibraryIngestionJob> | null = null;

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

async function processLibraryIngestion(
  strapi: Core.Strapi,
  job: LibraryIngestionJob
): Promise<void> {
  const { sourceId, versionId, fileUrl, fileType, ingestionParams } = job;

  strapi.log.info(`[library-ingestion] Starting ingestion for ${versionId}`);

  try {
    // Update version status to processing
    await updateVersionStatus(strapi, versionId, "processing", 0);

    // Call Python parser via subprocess
    const pythonScript = path.join(
      __dirname,
      "../../scripts/library-parser/ruach_library_parser.py"
    );

    const result = await runPythonParser(strapi, {
      scriptPath: pythonScript,
      sourceId,
      versionId,
      fileUrl,
      fileType,
      ingestionParams,
    });

    // Update version status to completed
    await updateVersionStatus(strapi, versionId, "completed", 100, result.qaMetrics);

    strapi.log.info(`[library-ingestion] Completed ingestion for ${versionId}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    // Update version status to failed
    await updateVersionStatus(strapi, versionId, "failed", 0, undefined, message);

    strapi.log.error(`[library-ingestion] Failed to process ${versionId}`, error);
    throw error;
  }
}

interface PythonParserArgs {
  scriptPath: string;
  sourceId: string;
  versionId: string;
  fileUrl: string;
  fileType: string;
  ingestionParams: LibraryIngestionJob["ingestionParams"];
}

async function runPythonParser(
  strapi: Core.Strapi,
  args: PythonParserArgs
): Promise<{ qaMetrics?: any }> {
  return new Promise((resolve, reject) => {
    const pythonArgs = [
      args.scriptPath,
      "--source-id",
      args.sourceId,
      "--version-id",
      args.versionId,
      "--file-url",
      args.fileUrl,
      "--file-type",
      args.fileType,
      "--max-chars",
      args.ingestionParams.maxChars.toString(),
      "--max-tokens",
      args.ingestionParams.maxTokens.toString(),
    ];

    if (args.ingestionParams.includeToc) {
      pythonArgs.push("--include-toc");
    }

    const python = spawn("python3", pythonArgs);

    let stdout = "";
    let stderr = "";

    python.stdout.on("data", (data) => {
      stdout += data.toString();
      strapi.log.debug(`[library-ingestion] Python: ${data.toString().trim()}`);
    });

    python.stderr.on("data", (data) => {
      stderr += data.toString();
      strapi.log.warn(`[library-ingestion] Python stderr: ${data.toString().trim()}`);
    });

    python.on("close", (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (parseError) {
          reject(new Error(`Failed to parse Python output: ${parseError}`));
        }
      } else {
        reject(new Error(`Python script exited with code ${code}: ${stderr}`));
      }
    });

    python.on("error", (error) => {
      reject(new Error(`Failed to spawn Python process: ${error.message}`));
    });
  });
}

async function updateVersionStatus(
  strapi: Core.Strapi,
  versionId: string,
  status: string,
  progress: number,
  qaMetrics?: any,
  errorMessage?: string
): Promise<void> {
  const db = strapi.db.connection;

  const updateData: any = {
    status,
    progress,
    updated_at: new Date(),
  };

  if (qaMetrics) {
    updateData.qa_metrics = JSON.stringify(qaMetrics);
  }

  if (errorMessage) {
    updateData.error_message = errorMessage;
  }

  if (status === "completed") {
    updateData.completed_at = new Date();
  }

  await db("library_versions").where({ version_id: versionId }).update(updateData);
}

export async function initializeLibraryIngestionQueue({ strapi }: { strapi: Core.Strapi }) {
  if (queue && worker) return;

  try {
    const connection = createRedisConnection();
    const queueName = "library-ingestion";

    queue = new Queue<LibraryIngestionJob>(queueName, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 60_000 },
        removeOnComplete: { count: 100, age: 7 * 24 * 3600 },
        removeOnFail: { count: 200, age: 30 * 24 * 3600 },
      },
    });

    worker = new Worker<LibraryIngestionJob>(
      queueName,
      async (job: Job<LibraryIngestionJob>) => {
        await processLibraryIngestion(strapi, job.data);
      },
      { connection, concurrency: 2 }
    );

    worker.on("failed", (job, err) => {
      strapi.log.error(`[library-ingestion] Job ${job?.id} failed`, err);
    });

    worker.on("completed", (job) => {
      strapi.log.info(`[library-ingestion] Job ${job.id} completed successfully`);
    });

    strapi.log.info("✅ Library ingestion queue initialized");
  } catch (error) {
    strapi.log.error("❌ Failed to initialize library ingestion queue", error);
  }
}

export async function enqueueLibraryIngestion(
  strapi: Core.Strapi,
  data: LibraryIngestionJob
): Promise<void> {
  if (!queue) {
    strapi.log.warn("[library-ingestion] Queue not initialized; skipping enqueue");
    return;
  }

  const jobId = `library-ingestion:${data.versionId}`;

  await queue.add("ingest", data, { jobId });

  strapi.log.info(`[library-ingestion] Enqueued job ${jobId}`);
}

export async function shutdownLibraryIngestionQueue(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
  }
  if (queue) {
    await queue.close();
    queue = null;
  }
}
