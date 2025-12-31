#!/usr/bin/env tsx
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

type CanonNode = {
  canonNodeId: string;
  canonType: string;
  source: unknown;
  location: unknown;
  content: {
    type: string;
    text: string;
    [key: string]: unknown;
  };
  anchors: unknown;
  authority: unknown;
  [key: string]: unknown;
};

type CanonBundle = {
  book: unknown;
  nodes: CanonNode[];
  meta?: Record<string, unknown>;
  [key: string]: unknown;
};

type NormalizationStats = {
  nodesProcessed: number;
  nodesTouched: number;
  hyphenFixes: number;
  comboSpacingFixes: number;
  camelSpacingFixes: number;
  markerRemovals: number;
};

const mashPairs: Array<{ prefix: string; suffix: string }> = [
  { prefix: "of", suffix: "the" },
  { prefix: "in", suffix: "the" },
  { prefix: "to", suffix: "the" },
  { prefix: "for", suffix: "the" },
  { prefix: "by", suffix: "the" },
  { prefix: "with", suffix: "the" },
  { prefix: "from", suffix: "the" },
  { prefix: "at", suffix: "the" },
  { prefix: "after", suffix: "the" },
  { prefix: "before", suffix: "the" },
  { prefix: "through", suffix: "the" },
  { prefix: "among", suffix: "the" },
  { prefix: "within", suffix: "the" },
  { prefix: "of", suffix: "God" },
  { prefix: "in", suffix: "God" },
  { prefix: "to", suffix: "God" },
  { prefix: "for", suffix: "God" },
  { prefix: "by", suffix: "God" },
  { prefix: "with", suffix: "God" },
  { prefix: "of", suffix: "Lord" },
  { prefix: "in", suffix: "Lord" },
  { prefix: "to", suffix: "Lord" },
  { prefix: "for", suffix: "Lord" },
  { prefix: "by", suffix: "Lord" },
  { prefix: "of", suffix: "Christ" },
  { prefix: "in", suffix: "Christ" },
  { prefix: "for", suffix: "Christ" },
  { prefix: "of", suffix: "Messiah" },
  { prefix: "in", suffix: "Messiah" },
  { prefix: "for", suffix: "Messiah" },
  { prefix: "of", suffix: "Him" },
  { prefix: "in", suffix: "Him" },
  { prefix: "to", suffix: "Him" },
  { prefix: "for", suffix: "Him" },
  { prefix: "by", suffix: "Him" },
  { prefix: "with", suffix: "His" },
  { prefix: "of", suffix: "His" },
  { prefix: "in", suffix: "His" },
  { prefix: "to", suffix: "His" },
  { prefix: "for", suffix: "His" },
  { prefix: "by", suffix: "His" },
  { prefix: "with", suffix: "Spirit" },
  { prefix: "for", suffix: "Spirit" },
  { prefix: "in", suffix: "Spirit" },
  { prefix: "of", suffix: "Spirit" },
  { prefix: "and", suffix: "the" },
  { prefix: "the", suffix: "Lord" },
  { prefix: "the", suffix: "Kingdom" },
  { prefix: "in", suffix: "Jesus" },
  { prefix: "of", suffix: "Jesus" },
  { prefix: "to", suffix: "Jesus" },
];

type ParserOptions = {
  input: string;
  output?: string;
  apply: boolean;
  diff: boolean;
  failOnDiff: boolean;
};

function parseArgs(): ParserOptions {
  const args = process.argv.slice(2);
  const options: ParserOptions = {
    input: "",
    apply: false,
    diff: false,
    failOnDiff: false,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    switch (arg) {
      case "--input":
      case "-i": {
        options.input = args[++i] ?? "";
        break;
      }
      case "--output":
      case "--out": {
        options.output = args[++i];
        break;
      }
      case "--apply": {
        options.apply = true;
        break;
      }
      case "--diff": {
        options.diff = true;
        break;
      }
      case "--fail-on-diff": {
        options.failOnDiff = true;
        break;
      }
      case "--help":
      case "-h": {
        printUsage();
        process.exit(0);
      }
      default: {
        throw new Error(`Unknown argument: ${arg}`);
      }
    }
  }

  if (!options.input) {
    throw new Error("The --input argument is required.");
  }

  return options;
}

function printUsage(): void {
  const script = path.relative(process.cwd(), process.argv[1] ?? "canon-text-normalize.ts");
  // eslint-disable-next-line no-console
  console.log(`
Usage:
  tsx ${script} --input path/to/book.canon.json [--apply] [--diff] [--out path/to/book.canon.clean.json]

Options:
  --input, -i   Source canon JSON (required)
  --out         Output path (defaults to *.canon.clean.json beside the source)
  --apply       Write the cleaned bundle (otherwise dry-run)
  --diff        Show text diffs for the modified nodes
  --fail-on-diff  Exit non-zero when --diff finds changes (use for CI)
  --help, -h    Show this help
`);
}

function normalizeText(input: string): { text: string; stats: Partial<NormalizationStats> } {
  let text = input;
  let hyphenFixes = 0;
  let comboSpacingFixes = 0;
  let camelSpacingFixes = 0;
  let markerRemovals = 0;

  const hyphenRegex = /([A-Za-z]+)-\s+([A-Za-z]+)/g;
  text = text.replace(hyphenRegex, (match, left, right) => {
    hyphenFixes += 1;
    return `${left}${right}`;
  });

  const markerRegex = /\[\d{2,4}\]/g;
  text = text.replace(markerRegex, () => {
    markerRemovals += 1;
    return "";
  });

  for (const { prefix, suffix } of mashPairs) {
    const regex = new RegExp(`\\b(${prefix})(${suffix})\\b`, "gi");
    text = text.replace(regex, (match, p1, p2) => {
      comboSpacingFixes += 1;
      return `${p1} ${p2}`;
    });
  }

  const camelRegex = /([a-z])([A-Z][a-z])/g;
  text = text.replace(camelRegex, (match, left, right) => {
    camelSpacingFixes += 1;
    return `${left} ${right}`;
  });

  return {
    text,
    stats: {
      hyphenFixes,
      comboSpacingFixes,
      camelSpacingFixes,
      markerRemovals,
    },
  };
}

function hashNode(node: CanonNode): string {
  const clone = {
    ...node,
    content: {
      ...node.content,
      text: "",
    },
  };
  const serialized = JSON.stringify(clone);
  return createHash("sha256").update(serialized).digest("hex");
}

function buildOutputPath(input: string): string {
  if (input.endsWith(".canon.json")) {
    return `${input.replace(/\.canon\.json$/, "")}.canon.clean.json`;
  }
  return `${input}.clean.json`;
}

function buildDiffSample(originalText: string, normalizedText: string): string {
  const header = `--- original\n+++ normalized`;
  return `${header}\n${originalText}\n${normalizedText}`;
}

async function main(): Promise<void> {
  const options = parseArgs();
  const source = await fs.readFile(options.input, "utf-8");
  const bundle: CanonBundle = JSON.parse(source);

  const diffEntries: Array<{
    canonNodeId: string;
    chapter: string;
    order: number;
    original: string;
    normalized: string;
  }> = [];

  const normalizedNodes: CanonNode[] = [];

  const stats: NormalizationStats = {
    nodesProcessed: bundle.nodes.length,
    nodesTouched: 0,
    hyphenFixes: 0,
    comboSpacingFixes: 0,
    camelSpacingFixes: 0,
    markerRemovals: 0,
  };

  for (const node of bundle.nodes) {
    const { text, stats: nodeStats } = normalizeText(node.content.text);
    const touched = text !== node.content.text;
    const normalizedNode: CanonNode = {
      ...node,
      content: {
        ...node.content,
        text,
      },
    };

    if (nodeStats.hyphenFixes) {
      stats.hyphenFixes += nodeStats.hyphenFixes;
    }
    if (nodeStats.comboSpacingFixes) {
      stats.comboSpacingFixes += nodeStats.comboSpacingFixes;
    }
    if (nodeStats.camelSpacingFixes) {
      stats.camelSpacingFixes += nodeStats.camelSpacingFixes;
    }
    if (nodeStats.markerRemovals) {
      stats.markerRemovals += nodeStats.markerRemovals;
    }

    if (touched) {
      stats.nodesTouched += 1;
      diffEntries.push({
        canonNodeId: node.canonNodeId,
        chapter: `${(node.location as { chapter: { title: string } }).chapter?.title ?? ""}`,
        order: Number((node.location as { order?: number }).order ?? 0),
        original: node.content.text,
        normalized: text,
      });
    }

    const originalHash = hashNode(node);
    const normalizedHash = hashNode(normalizedNode);
    if (originalHash !== normalizedHash) {
      throw new Error(
        `Normalization altered non-text fields on node ${node.canonNodeId}. Aborting.`,
      );
    }

    normalizedNodes.push(normalizedNode);
  }

  const normalizedBundle: CanonBundle = {
    ...bundle,
    nodes: normalizedNodes,
    meta: {
      ...bundle.meta,
      textNormalized: true,
      normalizationPass: "canon-text-cleanup-v1",
      canonIntegrity: "preserved",
    },
  };

  if (stats.nodesProcessed !== normalizedBundle.nodes.length) {
    throw new Error("Node count changed during normalization.");
  }

  const originalIds = bundle.nodes.map((node) => node.canonNodeId);
  const normalizedIds = normalizedBundle.nodes.map((node) => node.canonNodeId);
  if (originalIds.join("|") !== normalizedIds.join("|")) {
    throw new Error("canonNodeId list changed - normalization must not alter IDs.");
  }

  const outputPath = options.output ?? buildOutputPath(options.input);

  // Diff reporting
  if (options.diff && diffEntries.length > 0) {
    const limit = Math.min(diffEntries.length, 20);
    for (let i = 0; i < limit; i += 1) {
      const entry = diffEntries[i];
      // eslint-disable-next-line no-console
      console.log(
        `\n@@ Node ${entry.canonNodeId} (${entry.chapter || "unknown"} #${entry.order})`,
      );
      // eslint-disable-next-line no-console
      console.log(buildDiffSample(entry.original, entry.normalized));
    }

    if (diffEntries.length > limit) {
      // eslint-disable-next-line no-console
      console.log(`\n... ${diffEntries.length - limit} additional diffs withheld.`);
    }
  } else if (options.diff) {
    // eslint-disable-next-line no-console
    console.log("No text changes detected; nothing to diff.");
  }

  // Dry run summary
  // eslint-disable-next-line no-console
  console.log(`
Normalization Summary
  Nodes processed: ${stats.nodesProcessed}
  Nodes touched:   ${stats.nodesTouched}
  Hyphen fixes:   ${stats.hyphenFixes}
  Combo spaces:   ${stats.comboSpacingFixes}
  Camel fixes:    ${stats.camelSpacingFixes}
  Markers removed:${stats.markerRemovals}
  Output path:     ${outputPath}
  Mode:            ${options.apply ? "apply" : "dry-run"}
`);

  if (options.failOnDiff && diffEntries.length > 0 && !options.apply) {
    throw new Error("Diffs detected; exiting because --fail-on-diff is set.");
  }

  if (options.apply) {
    await fs.writeFile(outputPath, `${JSON.stringify(normalizedBundle, null, 2)}\n`, "utf-8");
    // eslint-disable-next-line no-console
    console.log(`Written cleaned bundle to ${outputPath}`);
  } else {
    // eslint-disable-next-line no-console
    console.log("Run with --apply to write the cleaned artifact.");
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Normalization failed:", error);
  process.exit(1);
});
