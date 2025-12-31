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
  phaseId?: number;
  phaseSlug?: string;
};

const NODE_TYPE_ENUM = ["Awakening", "Healing", "Warfare", "Formation", "Commissioning"] as const;
const FORMATION_SCOPE_ENUM = ["Individual", "Household", "Ecclesia", "Network"] as const;
const CHECKPOINT_TYPE_ENUM = ["None", "Text Response", "Voice Response", "Text & Voice"] as const;
const GUIDEBOOK_SCHEMA_UID = "api::guidebook-node.guidebook-node";
const BACKEND_ROOT = path.resolve(__dirname, "..", "..");
const GUIDEBOOK_SCHEMA_PATH = path.resolve(
  BACKEND_ROOT,
  "src/api/guidebook-node/content-types/guidebook-node/schema.json",
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
      case "--phase-id":
        options.phaseId = Number.parseInt(args[++i] ?? "", 10);
        if (!Number.isFinite(options.phaseId)) {
          throw new Error("--phase-id must be a number.");
        }
        break;
      case "--phase-slug":
        options.phaseSlug = (args[++i] ?? "").trim() || undefined;
        if (!options.phaseSlug) {
          throw new Error("--phase-slug must be a non-empty string.");
        }
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
  tsx ${script} --input path/to/ministry-of-healing.canon.clean.json [--phase-id 123|--phase-slug slug] [--dry-run]

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
    if (key === "required" && value === false) {
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
    "fields[0]": "uid",
    "fields[1]": "schema",
    "pagination[pageSize]": "100",
  });
  const result = await fetchJson(`${strapiUrl}/api/content-type-builder/content-types?${params}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const entry = Array.isArray(result?.data)
    ? result.data.find((item: any) => item?.uid === GUIDEBOOK_SCHEMA_UID)
    : null;
  if (!entry?.schema?.attributes) {
    throw new Error("Failed to load guidebook schema from Strapi.");
  }
  return entry.schema.attributes;
}

async function resolvePhaseId(strapiUrl: string, token: string, phaseSlug: string): Promise<number> {
  const params = new URLSearchParams({
    "filters[slug][$eq]": phaseSlug,
    "fields[0]": "id",
    "pagination[pageSize]": "2",
  });
  const result = await fetchJson(`${strapiUrl}/api/formation-phases?${params}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!Array.isArray(result?.data) || result.data.length === 0) {
    throw new Error(`No formation phase found for slug "${phaseSlug}".`);
  }
  if (result.data.length > 1) {
    throw new Error(`Multiple formation phases found for slug "${phaseSlug}".`);
  }
  const id = result.data[0]?.id;
  if (typeof id !== "number") {
    throw new Error(`Malformed formation phase response for slug "${phaseSlug}".`);
  }
  return id;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function normalizeIdList(input: unknown): number[] {
  if (!Array.isArray(input)) return [];
  const ids: number[] = [];
  for (const value of input) {
    const asNumber = typeof value === "number" ? value : Number.parseInt(String(value), 10);
    if (Number.isFinite(asNumber)) {
      ids.push(asNumber);
    }
  }
  return ids;
}

function normalizeId(input: unknown): number | undefined {
  if (typeof input === "number") return Number.isFinite(input) ? input : undefined;
  if (typeof input === "string" && input.trim()) {
    const parsed = Number.parseInt(input, 10);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function uniqueNumbers(values: number[]): number[] {
  return [...new Set(values)];
}

function buildGuidebookRawNode(node: CanonNode, index: number, allowedFields: Set<string>): Record<string, unknown> {
  const computed = canonToGuidebookNode(node, index);
  const raw: Record<string, unknown> = { ...computed };

  // Allow canon bundles that already carry Strapi-aligned scalar fields at top-level.
  if (isRecord(node)) {
    for (const [key, value] of Object.entries(node)) {
      if (!allowedFields.has(key)) continue;
      if (key === "content") continue; // canon "content" is structured; Strapi expects richtext string
      if (key in raw) continue;
      raw[key] = value;
    }
  }

  // Allow canon meta to provide Strapi scalar fields (still schema-gated later).
  if (isRecord(node.meta)) {
    for (const [key, value] of Object.entries(node.meta)) {
      if (!allowedFields.has(key)) continue;
      if (key in raw) continue;
      raw[key] = value;
    }
  }

  return raw;
}

function collectCanonCandidateKeys(node: CanonNode): string[] {
  const canonInternalKeys = new Set([
    "canonNodeId",
    "canonType",
    "source",
    "location",
    "content",
    "anchors",
    "authority",
    "checksum",
    "meta",
  ]);

  const candidates = new Set<string>();
  for (const key of Object.keys(node)) {
    if (canonInternalKeys.has(key)) continue;
    candidates.add(key);
  }

  if (isRecord(node.meta)) {
    for (const key of Object.keys(node.meta)) {
      candidates.add(key);
    }
  }

  return [...candidates];
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
  const allowedFields = new Set(Object.keys(localAttributes));
  const allowedScalarFields = new Set(
    Object.entries(localAttributes)
      .filter(([, attribute]) => isRecord(attribute) && attribute.type !== "relation" && attribute.type !== "media")
      .map(([key]) => key),
  );

  const phaseIdFromSlug = options.phaseSlug
    ? await resolvePhaseId(STRAPI_URL, STRAPI_TOKEN, options.phaseSlug)
    : undefined;

  const canon = await readJson<CanonBundle>(CANON_PATH);
  if (!canon.meta?.textNormalized) {
    throw new Error("Canon must be normalized before importing into Strapi.");
  }

  let created = 0;
  let updated = 0;

  for (let index = 0; index < canon.nodes.length; index += 1) {
    const node = canon.nodes[index];
    const rawNode = buildGuidebookRawNode(node, index, allowedFields);
    const extraAllowed = new Set(["phaseId", "canonAxiomIds", "phaseSlug"]);
    const unknown = collectCanonCandidateKeys(node).filter((key) => !allowedFields.has(key) && !extraAllowed.has(key));
    if (unknown.length) {
      throw new Error(
        `Importer attempted to send unknown keys: ${unknown.join(", ")}`,
      );
    }

    const phaseId =
      options.phaseId ??
      phaseIdFromSlug ??
      normalizeId(isRecord(node.meta) ? node.meta.phaseId : undefined) ??
      normalizeId((node as any).phaseId);

    if (!Number.isFinite(phaseId)) {
      throw new Error(
        `guidebook-node ${node.canonNodeId} missing required phase; provide --phase-id <id>, --phase-slug <slug>, or include phaseId in the canon node.`,
      );
    }

    const canonAxiomIds = uniqueNumbers([
      ...normalizeIdList((node as any).canonAxiomIds),
      ...normalizeIdList(isRecord(node.meta) ? node.meta.canonAxiomIds : undefined),
    ]);

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(rawNode)) {
      if (!allowedScalarFields.has(key)) continue;
      if (value === undefined) continue;
      sanitized[key] = value;
    }

    // Relations are always shaped explicitly; never pass through raw relation structures.
    sanitized.phase = { connect: [{ id: phaseId }] };
    if (canonAxiomIds.length) {
      sanitized.canonAxioms = { connect: canonAxiomIds.map((id) => ({ id })) };
    }

    const bodyPayload = { data: sanitized };
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
