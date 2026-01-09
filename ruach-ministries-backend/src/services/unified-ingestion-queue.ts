/**
 * Unified Ingestion Queue
 * Handles Scripture, Canon (EGW), and Library book ingestion
 * Extends existing library-ingestion-queue pattern
 */

import type { Core } from "@strapi/strapi";
import { Queue, Worker, type Job } from "bullmq";
import type { RedisOptions } from "ioredis";
import { spawn } from "child_process";
import path from "path";
import { readFile, readdir, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";

// Content types
type ContentType = "scripture" | "canon" | "library" | "ministry";

// Base job interface
interface BaseIngestionJob {
  contentType: ContentType;
  sourceId: string;
  versionId: string;
  fileUrl: string;
  fileType: "pdf" | "epub" | "docx" | "md";
}

// Scripture-specific job
interface ScriptureIngestionJob extends BaseIngestionJob {
  contentType: "scripture";
  scriptureParams: {
    testament: "tanakh" | "renewed_covenant" | "apocrypha" | "pseudepigrapha";
    preserveFormatting: boolean;
    validateCanonical: boolean;
  };
}

// Canon-specific job
interface CanonIngestionJob extends BaseIngestionJob {
  contentType: "canon";
  canonParams: {
    bookSlug: string;
    maxNodeChars: number;
    formationPhases?: string[];
    axioms?: string[];
  };
}

// Library-specific job
interface LibraryIngestionJob extends BaseIngestionJob {
  contentType: "library";
  libraryParams: {
    maxChars: number;
    maxTokens: number;
    includeToc: boolean;
    enableEmbeddings: boolean;
  };
}

// Ministry-specific job
interface MinistryIngestionJob extends BaseIngestionJob {
  contentType: "ministry";
  ministryParams: {
    bookCode: string;
    author: string;
    bookTitle: string;
    enableEmbeddings: boolean;
    enableThemeTagging: boolean;
    enableAiMetadata: boolean;
  };
}

type UnifiedIngestionJob = ScriptureIngestionJob | CanonIngestionJob | LibraryIngestionJob | MinistryIngestionJob;

type UnifiedQueue = Queue<
  UnifiedIngestionJob,
  any,
  string,
  UnifiedIngestionJob,
  any,
  string
>;

let queue: UnifiedQueue | null = null;
let worker: Worker<UnifiedIngestionJob> | null = null;

const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379", 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;
const REDIS_TLS = process.env.REDIS_TLS === "true";

function createRedisConnection(): RedisOptions {
  const options: RedisOptions = {
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD,
    maxRetriesPerRequest: null,
  };
  if (REDIS_TLS) {
    options.tls = {};
  }
  return options;
}

/**
 * Route job to appropriate processor based on content type
 */
async function processUnifiedIngestion(
  strapi: Core.Strapi,
  job: UnifiedIngestionJob
): Promise<void> {
  const { contentType, versionId } = job;

  strapi.log.info(`[unified-ingestion] Starting ${contentType} ingestion for ${versionId}`);

  try {
    // Update status to processing
    await updateIngestionStatus(strapi, versionId, contentType, "processing", 0);

    let result: any;

    switch (contentType) {
      case "scripture":
        result = await processScriptureIngestion(strapi, job as ScriptureIngestionJob);
        break;
      case "canon":
        result = await processCanonIngestion(strapi, job as CanonIngestionJob);
        break;
      case "library":
        result = await processLibraryIngestion(strapi, job as LibraryIngestionJob);
        break;
      case "ministry":
        result = await processMinistryIngestion(strapi, job as MinistryIngestionJob);
        break;
      default:
        throw new Error(`Unknown content type: ${contentType}`);
    }

    // Update status to completed
    await updateIngestionStatus(
      strapi,
      versionId,
      contentType,
      "completed",
      100,
      result.qaMetrics
    );

    strapi.log.info(`[unified-ingestion] Completed ${contentType} ingestion for ${versionId}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    // Update status to failed
    await updateIngestionStatus(
      strapi,
      versionId,
      contentType,
      "failed",
      0,
      undefined,
      message
    );

    strapi.log.error(`[unified-ingestion] Failed to process ${versionId}`, error);
    throw error;
  }
}

/**
 * Process scripture ingestion (103 books)
 */
async function processScriptureIngestion(
  strapi: Core.Strapi,
  job: ScriptureIngestionJob
): Promise<{ qaMetrics?: any }> {
  const { sourceId, versionId, fileUrl, fileType, scriptureParams } = job;

  strapi.log.info(`[scripture-ingestion] Processing ${versionId}`);

  // Step 1: Extract with scripture-extractor.py
  const extractorScript = path.join(
    __dirname,
    "../../scripts/unified-extraction/scripture-extractor.py"
  );

  const extractResult = await runPythonScript(strapi, {
    scriptPath: extractorScript,
    args: [fileUrl, `/tmp/scripture-extraction/${versionId}`],
  });

  // Step 2: Validate against canonical structure
  let validationPassed = true;
  if (scriptureParams.validateCanonical) {
    const validatorScript = path.join(
      __dirname,
      "../../scripts/unified-extraction/canonical-validator.py"
    );

    const canonicalStructure = path.join(
      __dirname,
      "../../scripts/scripture-extraction/canonical-structure.json"
    );

    const validateResult = await runPythonScript(strapi, {
      scriptPath: validatorScript,
      args: [
        `/tmp/scripture-extraction/${versionId}/works.json`,
        `/tmp/scripture-extraction/${versionId}/verses_chunk_01.json`,
        canonicalStructure,
      ],
    });

    validationPassed = validateResult.exitCode === 0;
    if (!validationPassed) {
      strapi.log.warn(`[scripture-ingestion] Validation warnings for ${versionId}`);
    }
  }

  // Step 3: Generate review report (for manual QA)
  await generateReviewReport(strapi, versionId, "scripture");

  // Step 4: Import to Strapi (only if approved)
  const reviewStatus = await getReviewStatus(strapi, versionId);
  if (reviewStatus === "approved") {
    await importScriptureToStrapi(strapi, versionId);
  } else {
    strapi.log.info(`[scripture-ingestion] Waiting for manual review approval for ${versionId}`);
  }

  return {
    qaMetrics: {
      extractionComplete: true,
      validationPassed,
      reviewStatus,
    },
  };
}

/**
 * Process canon ingestion (EGW books)
 */
async function processCanonIngestion(
  strapi: Core.Strapi,
  job: CanonIngestionJob
): Promise<{ qaMetrics?: any }> {
  const { sourceId, versionId, fileUrl, fileType, canonParams } = job;

  strapi.log.info(`[canon-ingestion] Processing ${versionId}`);

  // Use existing canon-parser
  const canonScript = path.join(
    __dirname,
    "../../scripts/canon-parser/ruach_canon_parser.py"
  );

  const result = await runPythonScript(strapi, {
    scriptPath: canonScript,
    args: [
      "--input",
      fileUrl,
      "--output",
      `/tmp/canon-extraction/${versionId}`,
      "--book-slug",
      canonParams.bookSlug,
      "--max-chars",
      canonParams.maxNodeChars.toString(),
    ],
  });

  // Import to Strapi guidebook-node collection
  await importCanonToStrapi(strapi, versionId, canonParams);

  return { qaMetrics: result };
}

/**
 * Process library ingestion (general books)
 */
async function processLibraryIngestion(
  strapi: Core.Strapi,
  job: LibraryIngestionJob
): Promise<{ qaMetrics?: any }> {
  const { sourceId, versionId, fileUrl, fileType, libraryParams } = job;

  strapi.log.info(`[library-ingestion] Processing ${versionId}`);

  // Use existing library-parser
  const libraryScript = path.join(
    __dirname,
    "../../scripts/library-parser/ruach_library_parser.py"
  );

  const pythonArgs = [
    libraryScript,
    "--source-id",
    sourceId,
    "--version-id",
    versionId,
    "--file-url",
    fileUrl,
    "--file-type",
    fileType,
    "--max-chars",
    libraryParams.maxChars.toString(),
    "--max-tokens",
    libraryParams.maxTokens.toString(),
  ];

  if (libraryParams.includeToc) {
    pythonArgs.push("--include-toc");
  }

  const result = await runPythonScript(strapi, {
    scriptPath: "python3",
    args: pythonArgs,
  });

  return { qaMetrics: result };
}

/**
 * Process ministry text ingestion (EGW ministry books)
 */
async function processMinistryIngestion(
  strapi: Core.Strapi,
  job: MinistryIngestionJob
): Promise<{ qaMetrics?: any }> {
  const { versionId, fileUrl, ministryParams } = job;
  const { bookCode, bookTitle, author, enableEmbeddings, enableThemeTagging, enableAiMetadata } = ministryParams;

  strapi.log.info(`[ministry-ingestion] Processing ${bookCode} (${versionId})`);

  const workingDir = `/tmp/ministry-extraction/${versionId}`;
  await mkdir(workingDir, { recursive: true });

  try {
    // Step 1: PDF Extraction
    strapi.log.info(`[ministry-ingestion] Step 1/5: Extracting from PDF`);
    const extractorScript = path.join(__dirname, "../../scripts/ministry-extraction/pdf-extractor.py");

    await runPythonScript(strapi, {
      scriptPath: extractorScript,
      args: [
        "--pdf", fileUrl,
        "--out", `${workingDir}/paragraphs.jsonl`,
        "--book-code", bookCode
      ],
    });

    // Step 2: AI Enrichment (if enabled)
    let enrichedFile = `${workingDir}/paragraphs.jsonl`;
    if (enableEmbeddings || enableThemeTagging || enableAiMetadata) {
      strapi.log.info(`[ministry-ingestion] Step 2/5: AI enrichment`);
      const enrichmentScript = path.join(__dirname, "../../scripts/ministry-extraction/ai-enrichment.ts");
      const enrichmentArgs = [`${workingDir}/paragraphs.jsonl`, `${workingDir}/enriched.jsonl`];

      if (enableEmbeddings) enrichmentArgs.push("--embeddings");
      if (enableThemeTagging) enrichmentArgs.push("--themes");
      if (enableAiMetadata) enrichmentArgs.push("--ai-metadata");

      await runNodeScript(strapi, {
        scriptPath: enrichmentScript,
        args: enrichmentArgs,
        env: {
          OPENAI_API_KEY: process.env.OPENAI_API_KEY,
          ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
          STRAPI_URL: process.env.STRAPI_URL,
          STRAPI_API_TOKEN: process.env.STRAPI_API_TOKEN,
        },
      });

      enrichedFile = `${workingDir}/enriched.jsonl`;
    } else {
      strapi.log.info(`[ministry-ingestion] Step 2/5: Skipping AI enrichment (not enabled)`);
    }

    // Step 3: Convert to Strapi format
    strapi.log.info(`[ministry-ingestion] Step 3/5: Converting to Strapi format`);
    const converterScript = path.join(__dirname, "../../scripts/ministry-extraction/jsonl-to-strapi.py");

    await runPythonScript(strapi, {
      scriptPath: converterScript,
      args: [
        "--in", enrichedFile,
        "--out", `${workingDir}/ingest`,
        "--chunk", "500",
      ],
    });

    // Step 4: Validation
    strapi.log.info(`[ministry-ingestion] Step 4/5: Validating extraction`);
    const validatorScript = path.join(__dirname, "../../scripts/ministry-extraction/validate-ministry-dump.py");

    const validationResult = await runPythonScript(strapi, {
      scriptPath: validatorScript,
      args: [`${workingDir}/ingest`],
    });

    if (validationResult.exitCode !== 0) {
      throw new Error(`Validation failed for ${bookCode}`);
    }

    // Step 5: Auto-import to Strapi (no manual review required)
    strapi.log.info(`[ministry-ingestion] Step 5/5: Importing to Strapi`);
    const importScript = path.join(__dirname, "../../scripts/ministry-extraction/import-to-strapi.ts");

    await runNodeScript(strapi, {
      scriptPath: importScript,
      args: [`${workingDir}/ingest`],
      env: {
        STRAPI_URL: process.env.STRAPI_URL,
        STRAPI_API_TOKEN: process.env.STRAPI_API_TOKEN,
      },
    });

    // Load validation report for QA metrics
    const reportPath = `${workingDir}/ingest/validation-report.json`;
    const report = JSON.parse(await readFile(reportPath, "utf-8"));

    strapi.log.info(`[ministry-ingestion] Completed ${bookCode}: ${report.stats.paragraphs} paragraphs`);

    return { qaMetrics: report };
  } catch (error) {
    strapi.log.error(`[ministry-ingestion] Failed:`, error);
    throw error;
  }
}

/**
 * Run Python script via subprocess
 */
interface PythonScriptArgs {
  scriptPath: string;
  args: string[];
}

async function runPythonScript(
  strapi: Core.Strapi,
  config: PythonScriptArgs
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const python = spawn("python3", [config.scriptPath, ...config.args]);

    let stdout = "";
    let stderr = "";

    python.stdout.on("data", (data) => {
      stdout += data.toString();
      strapi.log.debug(`[python] ${data.toString().trim()}`);
    });

    python.stderr.on("data", (data) => {
      stderr += data.toString();
      strapi.log.warn(`[python] ${data.toString().trim()}`);
    });

    python.on("close", (code) => {
      resolve({ exitCode: code || 0, stdout, stderr });
    });

    python.on("error", (error) => {
      reject(new Error(`Failed to spawn Python process: ${error.message}`));
    });
  });
}

/**
 * Run Node/TypeScript script via subprocess
 */
interface NodeScriptArgs {
  scriptPath: string;
  args: string[];
  env?: Record<string, string>;
}

async function runNodeScript(
  strapi: Core.Strapi,
  config: NodeScriptArgs
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const node = spawn("npx", ["tsx", config.scriptPath, ...config.args], {
      env: {
        ...process.env,
        ...config.env,
      },
    });

    let stdout = "";
    let stderr = "";

    node.stdout.on("data", (data) => {
      stdout += data.toString();
      strapi.log.debug(`[node] ${data.toString().trim()}`);
    });

    node.stderr.on("data", (data) => {
      stderr += data.toString();
      strapi.log.warn(`[node] ${data.toString().trim()}`);
    });

    node.on("close", (code) => {
      resolve({ exitCode: code || 0, stdout, stderr });
    });

    node.on("error", (error) => {
      reject(new Error(`Failed to spawn Node process: ${error.message}`));
    });
  });
}

/**
 * Update ingestion status in database
 */
async function updateIngestionStatus(
  strapi: Core.Strapi,
  versionId: string,
  contentType: ContentType,
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

  // Route to appropriate table based on content type
  const tableName = `${contentType}_versions`;
  await db(tableName).where({ version_id: versionId }).update(updateData);
}

/**
 * Generate review report for manual QA
 */
async function generateReviewReport(
  strapi: Core.Strapi,
  versionId: string,
  contentType: ContentType
): Promise<void> {
  strapi.log.info(`[review] Generating review report for ${versionId}`);

  try {
    const db = strapi.db.connection;
    const versionRecord = await db(`${contentType}_versions`)
      .where({ version_id: versionId })
      .first();

    if (!versionRecord) {
      throw new Error(`Version not found: ${versionId}`);
    }

    const extractionDir = `/tmp/scripture-extraction/${versionId}`;
    const worksPath = `${extractionDir}/works.json`;

    if (!existsSync(worksPath)) {
      strapi.log.warn(`[review] Works file not found: ${worksPath}`);
      return;
    }

    const worksData = await readFile(worksPath, "utf-8");
    const works = JSON.parse(worksData);

    // Generate review report
    const report = {
      versionId,
      contentType,
      generatedAt: new Date().toISOString(),
      summary: {
        totalWorks: works.length,
        totalVerses: works.reduce((sum: number, w: any) => sum + (w.totalVerses || 0), 0),
        testaments: {
          tanakh: works.filter((w: any) => w.testament === "tanakh").length,
          renewed_covenant: works.filter((w: any) => w.testament === "renewed_covenant").length,
          apocrypha: works.filter((w: any) => w.testament === "apocrypha").length,
        },
      },
      works: works.map((w: any) => ({
        workId: w.workId,
        canonicalName: w.canonicalName,
        testament: w.testament,
        chapters: w.totalChapters,
        verses: w.totalVerses,
      })),
    };

    // Save report to extraction directory
    const reportPath = `${extractionDir}/review-report.json`;
    await writeFile(reportPath, JSON.stringify(report, null, 2), "utf-8");

    // Update version record with report URL
    await db(`${contentType}_versions`)
      .where({ version_id: versionId })
      .update({
        qa_metrics: JSON.stringify({ reportPath, ...report.summary }),
      });

    strapi.log.info(`[review] Review report generated: ${reportPath}`);
  } catch (error) {
    strapi.log.error(`[review] Failed to generate report for ${versionId}:`, error);
    // Don't throw - report generation failure shouldn't block ingestion
  }
}

/**
 * Get review status from database
 */
async function getReviewStatus(
  strapi: Core.Strapi,
  versionId: string
): Promise<"pending" | "approved" | "rejected" | "needs_review"> {
  try {
    const db = strapi.db.connection;

    // Check scripture_review_actions table
    const reviewAction = await db("scripture_review_actions")
      .where({ version_id: versionId })
      .orderBy("created_at", "desc")
      .first();

    if (reviewAction) {
      return reviewAction.action as "approved" | "rejected" | "needs_review";
    }

    // Default: pending review
    return "pending";
  } catch (error) {
    strapi.log.warn(`[review] Could not get review status for ${versionId}, defaulting to pending:`, error);
    return "pending";
  }
}

/**
 * Import scripture to Strapi using existing import script
 */
async function importScriptureToStrapi(
  strapi: Core.Strapi,
  versionId: string
): Promise<void> {
  strapi.log.info(`[scripture-import] Importing ${versionId} to Strapi`);

  try {
    const extractionDir = `/tmp/scripture-extraction/${versionId}`;
    const importScript = path.join(
      __dirname,
      "../../scripts/scripture-extraction/import-to-strapi.ts"
    );

    // Get Strapi API token from env or config
    const apiToken = process.env.STRAPI_API_TOKEN || strapi.config.get("server.adminToken");

    if (!apiToken) {
      throw new Error("STRAPI_API_TOKEN not configured");
    }

    // Run import script
    const result = await runNodeScript(strapi, {
      scriptPath: importScript,
      args: [extractionDir],
      env: {
        ...process.env,
        STRAPI_URL: process.env.STRAPI_URL || "http://localhost:1337",
        STRAPI_API_TOKEN: apiToken,
      },
    });

    if (result.exitCode !== 0) {
      throw new Error(`Import script failed: ${result.stderr}`);
    }

    strapi.log.info(`[scripture-import] Successfully imported ${versionId}`);
  } catch (error) {
    strapi.log.error(`[scripture-import] Failed to import ${versionId}:`, error);
    throw error;
  }
}

/**
 * Import canon to Strapi using existing canon import script
 */
async function importCanonToStrapi(
  strapi: Core.Strapi,
  versionId: string,
  params: CanonIngestionJob["canonParams"]
): Promise<void> {
  strapi.log.info(`[canon-import] Importing ${versionId} to Strapi`);

  try {
    const extractionDir = `/tmp/canon-extraction/${versionId}`;
    const importScript = path.join(
      __dirname,
      "../../scripts/canon-parser/canon-strapi-import.ts"
    );

    // Get Strapi API token
    const apiToken = process.env.STRAPI_API_TOKEN || strapi.config.get("server.adminToken");

    if (!apiToken) {
      throw new Error("STRAPI_API_TOKEN not configured");
    }

    // Run import script
    const result = await runNodeScript(strapi, {
      scriptPath: importScript,
      args: [extractionDir, params.bookSlug],
      env: {
        ...process.env,
        STRAPI_URL: process.env.STRAPI_URL || "http://localhost:1337",
        STRAPI_API_TOKEN: apiToken,
      },
    });

    if (result.exitCode !== 0) {
      throw new Error(`Canon import script failed: ${result.stderr}`);
    }

    strapi.log.info(`[canon-import] Successfully imported ${versionId}`);
  } catch (error) {
    strapi.log.error(`[canon-import] Failed to import ${versionId}:`, error);
    throw error;
  }
}

/**
 * Initialize unified ingestion queue
 */
export async function initializeUnifiedIngestionQueue({
  strapi,
}: {
  strapi: Core.Strapi;
}) {
  if (queue && worker) return;

  try {
    const connection = createRedisConnection();
    const queueName = "unified-ingestion";

    queue = new Queue<
      UnifiedIngestionJob,
      any,
      string,
      UnifiedIngestionJob,
      any,
      string
    >(queueName, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 60_000 },
        removeOnComplete: { count: 100, age: 7 * 24 * 3600 },
        removeOnFail: { count: 200, age: 30 * 24 * 3600 },
      },
    });

    worker = new Worker<UnifiedIngestionJob>(
      queueName,
      async (job: Job<UnifiedIngestionJob>) => {
        await processUnifiedIngestion(strapi, job.data);
      },
      {
        connection,
        concurrency: 2, // Process 2 jobs in parallel
      }
    );

    worker.on("completed", (job) => {
      strapi.log.info(`[unified-ingestion] Job ${job.id} completed`);
    });

    worker.on("failed", (job, err) => {
      strapi.log.error(`[unified-ingestion] Job ${job?.id} failed:`, err);
    });

    strapi.log.info("[unified-ingestion] Queue and worker initialized");
  } catch (error) {
    strapi.log.error("[unified-ingestion] Failed to initialize queue:", error);
    throw error;
  }
}

/**
 * Add job to queue
 */
export async function enqueueIngestion(job: UnifiedIngestionJob): Promise<string> {
  if (!queue) {
    throw new Error("Unified ingestion queue not initialized");
  }

  const bullJob = await queue.add(`${job.contentType}-ingestion`, job, {
    jobId: job.versionId,
  });

  return bullJob.id || job.versionId;
}

/**
 * Shutdown queue gracefully
 */
export async function shutdownUnifiedIngestionQueue() {
  if (worker) {
    await worker.close();
    worker = null;
  }
  if (queue) {
    await queue.close();
    queue = null;
  }
}
