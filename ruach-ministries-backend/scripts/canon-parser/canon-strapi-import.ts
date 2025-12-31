#!/usr/bin/env tsx
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

async function readJson<T>(file: string): Promise<T> {
  const text = await fs.readFile(file, "utf-8");
  return JSON.parse(text) as T;
}

type CanonNode = {
  canonNodeId: string;
  content: {
    text: string;
    [key: string]: unknown;
  };
  location?: {
    chapter?: { title?: string };
    order?: number;
    [key: string]: unknown;
  };
  checksum?: string;
  meta?: Record<string, string | undefined>;
  [key: string]: unknown;
};

type CanonBundle = {
  meta?: Record<string, unknown>;
  nodes: CanonNode[];
};

type GuidebookPayload = {
  nodeId: string;
  title: string;
  content: string;
  orderInPhase: number;
  checksum: string;
  nodeType: "Awakening" | "Healing" | "Warfare" | "Formation" | "Commissioning";
  formationScope: "Individual" | "Household" | "Ecclesia" | "Network";
  checkpointType: "None" | "Text Response" | "Voice Response" | "Text & Voice";
};

type Options = {
  input: string;
  dryRun: boolean;
};

const NODE_TYPE_ENUM = ["Awakening", "Healing", "Warfare", "Formation", "Commissioning"] as const;
const FORMATION_SCOPE_ENUM = ["Individual", "Household", "Ecclesia", "Network"] as const;
const CHECKPOINT_TYPE_ENUM = ["None", "Text Response", "Voice Response", "Text & Voice"] as const;
const GUIDEBOOK_SCHEMA_UID = "api::guidebook-node.guidebook-node";
const GUIDEBOOK_SCHEMA_PATH = path.resolve(
  process.cwd(),
  "ruach-ministries-backend/src/api/guidebook-node/content-types/guidebook-node/schema.json",
);

function normalizeNodeType(input?: string): GuidebookPayload["nodeType"] {
  if (NODE_TYPE_ENUM.includes(input as any)) {
    return input as GuidebookPayload["nodeType"];
  }
  return "Formation";
}

function normalizeFormationScope(input?: string): GuidebookPayload["formationScope"] {
  if (FORMATION_SCOPE_ENUM.includes(input as any)) {
    return input as GuidebookPayload["formationScope"];
  }
  return "Individual";
}

function normalizeCheckpointType(input?: string): GuidebookPayload["checkpointType"] {
  if (CHECKPOINT_TYPE_ENUM.includes(input as any)) {
    return input as GuidebookPayload["checkpointType"];
  }
  return "None";
}

function computeChecksum(node: CanonNode): string {
  if (node.checksum) return node.checksum;
  return createHash("sha256").update(node.content.text).digest("hex");
}

function canonToGuidebookNode(node: CanonNode, index: number): GuidebookPayload {
  const title =
    node.location?.chapter?.title?.trim() ||
    `Canon node ${index + 1}`;

  return {
    nodeId: node.canonNodeId,
    title,
    content: node.content.text,
    orderInPhase: node.location?.order ?? index + 1,
    checksum: computeChecksum(node),
    nodeType: normalizeNodeType(node.meta?.nodeType),
    formationScope: normalizeFormationScope(node.meta?.formationScope),
    checkpointType: normalizeCheckpointType(node.meta?.checkpointType),
    // no extra fields: schema expects only the base attributes
  };
}

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

function attributeSignature(attribute: Record<string, unknown>): string {
  const signatureKeys = ["type", "relation", "target", "enum", "required", "default", "inversedBy"];
  const subset: Record<string, unknown> = {};
  for (const key of signatureKeys) {
    if (!(key in attribute)) continue;
    const value = attribute[key as keyof Record<string, unknown>];
    if (key === "enum" && Array.isArray(value)) {
      subset.enum = [...value].sort();
      continue;
    }
    subset[key] = value;
  }
  return JSON.stringify(subset);
}

function compareAttributeSets(local: Record<string, Record<string, unknown>>, remote: Record<string, Record<string, unknown>>): void {
  const localKeys = Object.keys(local);
  const remoteKeys = Object.keys(remote);
  const extra = remoteKeys.filter((key) => !localKeys.includes(key));
  const missing = localKeys.filter((key) => !remoteKeys.includes(key));
  if (extra.length || missing.length) {
    throw new Error(
      `Guidebook schema mismatch: ${
        extra.length ? `unexpected remote attributes: ${extra.join(", ")}` : ""
      }${extra.length && missing.length ? "; " : ""}${
        missing.length ? `missing remote attributes: ${missing.join(", ")}` : ""
      }`,
    );
  }

  for (const attrName of localKeys) {
    const localSig = attributeSignature(local[attrName]);
    const remoteSig = attributeSignature(remote[attrName]);
    if (localSig !== remoteSig) {
      throw new Error(
        `Guidebook attribute "${attrName}" changed: local=${localSig}, remote=${remoteSig}`,
      );
    }
  }
}

async function loadLocalGuidebookSchema(): Promise<Record<string, Record<string, unknown>>> {
  const text = await fs.readFile(GUIDEBOOK_SCHEMA_PATH, "utf-8");
  const parsed = JSON.parse(text);
  if (!parsed?.attributes || typeof parsed.attributes !== "object") {
    throw new Error("Local guidebook schema is malformed.");
  }
  return parsed.attributes;
}

async function fetchRemoteGuidebookSchema(strapiUrl: string, token: string): Promise<Record<string, Record<string, unknown>>> {
  const params = new URLSearchParams({
    "filters[uid][$eq]": GUIDEBOOK_SCHEMA_UID,
    "fields[0]": "schema",
  });
  const result = await fetchJson(`${strapiUrl}/api/content-type-builder/content-types?${params}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const entry = Array.isArray(result?.data) ? result.data[0] : null;
  if (!entry?.schema?.attributes) {
    throw new Error("Failed to load guidebook schema from Strapi.");
  }
  return entry.schema.attributes;
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

  const localAttributes = await loadLocalGuidebookSchema();
  const remoteAttributes = await fetchRemoteGuidebookSchema(STRAPI_URL, STRAPI_TOKEN);
  compareAttributeSets(localAttributes, remoteAttributes);

  const canon = await readJson<CanonBundle>(CANON_PATH);
  if (!canon.meta?.textNormalized) {
    throw new Error("Canon must be normalized before importing into Strapi.");
  }

  let created = 0;
  let updated = 0;

  for (let index = 0; index < canon.nodes.length; index += 1) {
    const node = canon.nodes[index];
    const payload = canonToGuidebookNode(node, index);
    const filters = new URLSearchParams({
      "filters[nodeId][$eq]": node.canonNodeId,
      "fields[0]": "id",
      limit: "1",
    });
    const queryUrl = `${STRAPI_URL}/api/guidebook-nodes?${filters.toString()}`;

    const existing = await fetchJson(queryUrl, {
      headers: {
        Authorization: `Bearer ${STRAPI_TOKEN}`,
        "Content-Type": "application/json",
      },
      method: "GET",
    });

    const existingEntry = Array.isArray(existing?.data) ? existing.data[0] : null;
    const bodyPayload = { data: payload };
    // log payload for audit/comparison when running live import
    console.log(`⏺ Import payload: ${JSON.stringify(bodyPayload)}`);
    const targetUrl = existingEntry
      ? `${STRAPI_URL}/api/guidebook-nodes/${existingEntry.id}`
      : `${STRAPI_URL}/api/guidebook-nodes`;
    if (options.dryRun) {
      // eslint-disable-next-line no-console
      console.log(`[dry-run] ${existingEntry ? "PUT" : "POST"} ${targetUrl} (canonNodeId=${node.canonNodeId})`);
      if (existingEntry) {
        updated += 1;
      } else {
        created += 1;
      }
      continue;
    }

    if (!existingEntry) {
      await fetchJson(targetUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${STRAPI_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyPayload),
      });
      created += 1;
      continue;
    }

    await fetchJson(targetUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${STRAPI_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyPayload),
    });
    updated += 1;
  }

  // eslint-disable-next-line no-console
  console.log(`Canon import complete (created=${created}, updated=${updated}).`);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Import failed:", error);
  process.exit(1);
});
