#!/usr/bin/env tsx
import fs from "node:fs/promises";
import path from "node:path";

async function readJson<T>(file: string): Promise<T> {
  const text = await fs.readFile(file, "utf-8");
  return JSON.parse(text) as T;
}

type CanonNode = {
  canonNodeId: string;
  [key: string]: unknown;
};

type CanonBundle = {
  meta?: Record<string, unknown>;
  nodes: CanonNode[];
};

type Options = {
  input: string;
  dryRun: boolean;
};

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const options: Options = {
    input: "",
    dryRun: false,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    switch (arg) {
      case "--input":
      case "-i":
        options.input = args[++i] ?? "";
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--help":
      case "-h":
        printUsage();
        process.exit(0);
      default:
        throw new Error(`Unknown arg: ${arg}`);
    }
  }

  if (!options.input) {
    throw new Error("--input is required.");
  }

  return options;
}

function printUsage(): void {
  const script = path.relative(process.cwd(), process.argv[1] ?? "canon-strapi-import.ts");
  // eslint-disable-next-line no-console
  console.log(`
Usage:
  tsx ${script} --input path/to/ministry-of-healing.canon.clean.json [--dry-run]

Env:
  STRAPI_URL (default http://localhost:1337)
  STRAPI_TOKEN (required)
`);
}

async function fetchJson(url: string, init: RequestInit): Promise<any> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Fetch failed (${res.status}): ${url}\n${body}`);
  }
  const json = await res.json();
  return json;
}

async function main(): Promise<void> {
  const options = parseArgs();
  const CANON_PATH = options.input;
  const STRAPI_URL = (process.env.STRAPI_URL ?? "http://localhost:1337").replace(
    /\/$/,
    "",
  );
  const STRAPI_TOKEN = process.env.STRAPI_TOKEN;

  if (!STRAPI_TOKEN) {
    throw new Error("STRAPI_TOKEN is required.");
  }

  const canon = await readJson<CanonBundle>(CANON_PATH);
  if (!canon.meta?.textNormalized) {
    throw new Error("Canon must be normalized before importing into Strapi.");
  }

  let created = 0;
  let updated = 0;

  for (const node of canon.nodes) {
    const filters = new URLSearchParams({
      "filters[canonNodeId][$eq]": node.canonNodeId,
      "fields[0]": "id",
      limit: "1",
    });
    const queryUrl = `${STRAPI_URL}/api/canon-nodes?${filters.toString()}`;

    const existing = await fetchJson(queryUrl, {
      headers: {
        Authorization: `Bearer ${STRAPI_TOKEN}`,
        "Content-Type": "application/json",
      },
      method: "GET",
    });

    const existingEntry = Array.isArray(existing?.data) ? existing.data[0] : null;
    const payload = { data: node };
    const targetUrl = existingEntry
      ? `${STRAPI_URL}/api/canon-nodes/${existingEntry.id}`
      : `${STRAPI_URL}/api/canon-nodes`;
    const method = existingEntry ? "PUT" : "POST";

    if (options.dryRun) {
      // eslint-disable-next-line no-console
      console.log(`[dry-run] ${method} ${targetUrl} (canonNodeId=${node.canonNodeId})`);
      if (existingEntry) {
        updated += 1;
      } else {
        created += 1;
      }
      continue;
    }

    await fetchJson(targetUrl, {
      method,
      headers: {
        Authorization: `Bearer ${STRAPI_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (existingEntry) {
      updated += 1;
    } else {
      created += 1;
    }
  }

  // eslint-disable-next-line no-console
  console.log(`Canon import complete (created=${created}, updated=${updated}).`);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Import failed:", error);
  process.exit(1);
});
