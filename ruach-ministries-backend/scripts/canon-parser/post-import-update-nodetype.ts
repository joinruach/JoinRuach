#!/usr/bin/env tsx
/**
 * Post-Import Node Type Updater
 *
 * Updates nodeType field for guidebook nodes that were imported without it.
 * This is a workaround for the Strapi v5 "Invalid key set" error during creation.
 *
 * Usage:
 *   tsx scripts/canon-parser/post-import-update-nodetype.ts \
 *     --phase awakening \
 *     --node-type Formation \
 *     [--dry-run]
 *
 * Environment:
 *   STRAPI_URL - Strapi instance URL (default: http://localhost:1337)
 *   STRAPI_TOKEN - API token with update permissions (required)
 */

const STRAPI_URL = (process.env.STRAPI_URL ?? "http://localhost:1337").replace(/\/$/, "");
const STRAPI_TOKEN = process.env.STRAPI_TOKEN;

const NODE_TYPE_ENUM = ["Awakening", "Healing", "Warfare", "Formation", "Commissioning"] as const;
type NodeType = typeof NODE_TYPE_ENUM[number];

type Options = {
  phaseId?: number;
  phaseSlug?: string;
  nodeType: NodeType;
  dryRun: boolean;
};

async function fetchJson(url: string, init: RequestInit): Promise<any> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Fetch failed (${res.status}): ${url}\n${body}`);
  }
  return await res.json();
}

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const options: Partial<Options> = {
    dryRun: false,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    switch (arg) {
      case "--phase-id":
        options.phaseId = Number.parseInt(args[++i] ?? "", 10);
        if (!Number.isFinite(options.phaseId)) {
          throw new Error("--phase-id must be a number.");
        }
        break;
      case "--phase":
      case "--phase-slug":
        options.phaseSlug = (args[++i] ?? "").trim() || undefined;
        break;
      case "--node-type":
        const nodeType = (args[++i] ?? "").trim() as NodeType;
        if (!NODE_TYPE_ENUM.includes(nodeType)) {
          throw new Error(`--node-type must be one of: ${NODE_TYPE_ENUM.join(", ")}`);
        }
        options.nodeType = nodeType;
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

  if (!options.nodeType) {
    throw new Error("--node-type is required.");
  }

  if (!options.phaseId && !options.phaseSlug) {
    throw new Error("Either --phase-id or --phase/--phase-slug is required.");
  }

  return options as Options;
}

function printUsage(): void {
  console.log(`
Usage:
  tsx scripts/canon-parser/post-import-update-nodetype.ts \\
    [--phase <slug> | --phase-id <id>] \\
    --node-type <type> \\
    [--dry-run]

Options:
  --phase, --phase-slug    Phase slug (e.g., awakening)
  --phase-id               Phase numeric ID
  --node-type              Node type: ${NODE_TYPE_ENUM.join(", ")}
  --dry-run                Preview changes without updating

Environment:
  STRAPI_URL      Strapi instance URL (default: http://localhost:1337)
  STRAPI_TOKEN    API token (required)

Examples:
  # Dry run
  STRAPI_TOKEN=xxx tsx scripts/canon-parser/post-import-update-nodetype.ts \\
    --phase awakening --node-type Formation --dry-run

  # Update all awakening nodes to Formation
  STRAPI_TOKEN=xxx tsx scripts/canon-parser/post-import-update-nodetype.ts \\
    --phase awakening --node-type Formation
`);
}

async function resolvePhaseId(phaseSlug: string): Promise<number> {
  const params = new URLSearchParams({
    "filters[slug][$eq]": phaseSlug,
    "fields[0]": "id",
    "pagination[pageSize]": "2",
  });
  const result = await fetchJson(`${STRAPI_URL}/api/formation-phases?${params}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${STRAPI_TOKEN}`,
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

async function main(): Promise<void> {
  if (!STRAPI_TOKEN) {
    throw new Error("STRAPI_TOKEN is required.");
  }

  const options = parseArgs();

  // Resolve phase ID
  const phaseId = options.phaseId ?? (await resolvePhaseId(options.phaseSlug!));

  console.log(`\n🔧 Updating nodeType for phase ID ${phaseId} to "${options.nodeType}"...`);
  if (options.dryRun) {
    console.log("🔍 DRY RUN MODE - No changes will be made\n");
  }

  // Fetch all nodes in this phase with null nodeType
  const params = new URLSearchParams({
    "filters[phase][id][$eq]": String(phaseId),
    "filters[nodeType][$null]": "true",
    "fields[0]": "id",
    "fields[1]": "nodeId",
    "fields[2]": "title",
    "fields[3]": "nodeType",
    "pagination[pageSize]": "100",
  });

  let page = 1;
  let updated = 0;
  let totalFound = 0;

  while (true) {
    params.set("pagination[page]", String(page));
    const result = await fetchJson(`${STRAPI_URL}/api/guidebook-nodes?${params}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${STRAPI_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    const nodes = result?.data ?? [];
    if (nodes.length === 0) break;

    totalFound += nodes.length;

    for (const node of nodes) {
      const nodeId = node.id;
      const canonNodeId = node.nodeId;
      const title = node.title;

      if (options.dryRun) {
        console.log(`[DRY-RUN] Would update ${canonNodeId} (ID: ${nodeId})`);
        updated += 1;
        continue;
      }

      try {
        await fetchJson(`${STRAPI_URL}/api/guidebook-nodes/${nodeId}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${STRAPI_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: {
              nodeType: options.nodeType,
            },
          }),
        });
        updated += 1;

        if (updated % 50 === 0) {
          console.log(`✓ Updated ${updated}/${totalFound} nodes...`);
        }
      } catch (error) {
        console.error(`\n❌ Failed to update ${canonNodeId} (ID: ${nodeId})`);
        console.error(`   Title: ${title}`);
        throw error;
      }
    }

    // Check if there are more pages
    const pagination = result?.meta?.pagination;
    if (!pagination || page >= pagination.pageCount) {
      break;
    }
    page += 1;
  }

  if (totalFound === 0) {
    console.log(`\n✅ No nodes found with null nodeType for phase ID ${phaseId}`);
  } else {
    console.log(`\n✅ ${options.dryRun ? "Would update" : "Updated"} ${updated} nodes`);
  }
}

main().catch((error) => {
  console.error("\n❌ Update failed:", error);
  process.exit(1);
});
